import type { Pinia } from 'pinia'
import { effectScope, watch } from 'vue'
import { useTokenStore } from '@/store'
import { isDoubleTokenMode } from '@/utils'

// WebSocket 全局管理器：
// 1) 登录后自动连接，退出登录主动断开
// 2) 统一管理重连、topics、事件分发
// 3) 提供轻量订阅接口给业务层使用
interface TokenStore extends ReturnType<typeof useTokenStore> {}

export type WsStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error' | 'disabled'
export interface WsMessage {
  event: string
  data: unknown
}

export interface WsHandler {
  (data: unknown, message: WsMessage): void
}

export interface WsOptions {
  url?: string
  enabled?: boolean
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

// 重连策略默认值
const DEFAULT_MAX_RETRIES = 10
const DEFAULT_BASE_DELAY = 1000
const DEFAULT_MAX_DELAY = 30000

// 将开关配置转换为布尔值，空值使用默认值（支持 'false'/'0'）
function normalizeBoolean(value: unknown, defaultValue = true) {
  if (value === undefined || value === null)
    return defaultValue
  const normalized = String(value).trim().toLowerCase()
  if (!normalized)
    return defaultValue
  if (normalized === 'false' || normalized === '0')
    return false
  return true
}

// 规范化 topics（去空、去空格、逗号分隔）
function normalizeTopics(topics: string[] | string) {
  const list = Array.isArray(topics) ? topics : topics.split(',')
  return list.map(item => item.trim()).filter(Boolean).join(',')
}

// 构造带 token/topics 的连接地址（避免在日志中输出完整 URL）
function buildWsUrl(baseUrl: string, token: string, topics?: string) {
  const params = [`token=${encodeURIComponent(token)}`]
  if (topics)
    params.push(`topics=${encodeURIComponent(topics)}`)
  const joiner = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${joiner}${params.join('&')}`
}

class WsManager {
  // 当前连接任务（uni.connectSocket 返回）
  private socketTask: UniApp.SocketTask | null = null
  // 事件订阅表：event -> handlers
  private handlers = new Map<string, Set<WsHandler>>()
  // 重连定时器
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  // 已尝试的重连次数
  private retryCount = 0
  // 主动断开标记：为 true 时不触发重连
  private manualClose = false
  // 当前 topics（用于重连复用）
  private topics = ''
  // 认证与刷新 token 的 store
  private tokenStore: TokenStore | null = null

  // 状态用于外部观察连接生命周期
  status: WsStatus = 'idle'

  // 运行时配置（可通过 configure 覆盖）
  private options: Required<WsOptions> = {
    url: '',
    enabled: true,
    maxRetries: DEFAULT_MAX_RETRIES,
    baseDelay: DEFAULT_BASE_DELAY,
    maxDelay: DEFAULT_MAX_DELAY,
  }

  // 绑定 token store，用于获取有效 token 与刷新逻辑
  bindTokenStore(store: TokenStore) {
    this.tokenStore = store
  }

  // 动态配置连接参数（包含开关与重连策略）
  configure(options: WsOptions) {
    this.options = {
      ...this.options,
      ...options,
    }
    if (!this.options.enabled) {
      // 禁用后立即断开并标记为 disabled
      this.disconnect({ manual: true })
      this.status = 'disabled'
    }
  }

  // 订阅业务事件（返回取消订阅函数）
  on(event: string, handler: WsHandler) {
    const handlers = this.handlers.get(event) || new Set<WsHandler>()
    handlers.add(handler)
    this.handlers.set(event, handlers)
    return () => this.off(event, handler)
  }

  // 取消订阅业务事件
  off(event: string, handler: WsHandler) {
    const handlers = this.handlers.get(event)
    if (!handlers)
      return
    handlers.delete(handler)
    if (!handlers.size)
      this.handlers.delete(event)
  }

  // 触发事件分发
  emit(event: string, data: unknown, message: WsMessage) {
    const handlers = this.handlers.get(event)
    if (!handlers)
      return
    handlers.forEach(handler => handler(data, message))
  }

  // 更新订阅 topics：
  // - 空值视为清空订阅并主动断开
  // - 已连接/连接中时触发重连以应用新订阅
  setTopics(topics: string[] | string) {
    const normalized = normalizeTopics(topics)
    this.topics = normalized

    if (!this.options.enabled)
      return

    if (!normalized) {
      // 清空订阅时主动断开，不进入重连流程
      this.disconnect({ manual: true })
      return
    }

    if (this.status === 'open' || this.status === 'connecting')
      this.reconnect()
  }

  // 建立连接（自动处理 token 获取与重连条件）
  async connect() {
    if (!this.options.enabled) {
      this.status = 'disabled'
      return
    }

    if (!this.options.url) {
      // URL 缺失直接禁用重连
      this.stopReconnect()
      this.status = 'disabled'
      return
    }

    if (this.status === 'connecting' || this.status === 'open')
      return

    // 清理手动断开标记，允许后续重连
    this.manualClose = false
    this.clearReconnectTimer()

    const token = await this.resolveToken()
    if (!token) {
      // 没有有效 token 则等待登录状态变化
      this.stopReconnect()
      this.status = 'idle'
      return
    }

    const wsUrl = buildWsUrl(this.options.url, token, this.topics || undefined)

    this.status = 'connecting'

    try {
      // uni.connectSocket 在不同端可能返回 Promise/SocketTask
      const socketTask = await uni.connectSocket({ url: wsUrl })
      this.socketTask = socketTask

      socketTask.onOpen(() => {
        this.status = 'open'
        this.retryCount = 0
      })

      socketTask.onMessage((res) => {
        if (typeof res.data !== 'string')
          return
        let message: WsMessage
        try {
          message = JSON.parse(res.data)
        }
        catch {
          return
        }
        if (!message || typeof message.event !== 'string')
          return
        if (message.event === 'heartbeat')
          return
        this.emit(message.event, message.data, message)
      })

      socketTask.onClose(() => {
        this.socketTask = null
        if (this.manualClose) {
          this.status = 'closed'
          return
        }
        this.status = 'closed'
        this.scheduleReconnect()
      })

      socketTask.onError(() => {
        if (this.manualClose)
          return
        this.status = 'error'
        this.scheduleReconnect()
      })
    }
    catch {
      this.status = 'error'
      this.scheduleReconnect()
      return
    }
  }

  // 主动断开连接（不会触发自动重连）
  disconnect(options: { manual?: boolean } = {}) {
    const { manual = true } = options
    if (manual)
      this.manualClose = true
    this.clearReconnectTimer()
    this.retryCount = 0
    if (this.socketTask) {
      try {
        this.socketTask.close({})
      }
      catch {
        // ignore close errors
      }
      this.socketTask = null
    }
    this.status = 'closed'
  }

  // 立即重连（先主动断开再连接）
  private reconnect() {
    this.disconnect({ manual: true })
    this.connect()
  }

  // 获取可用 token，必要时刷新；失败则清理登录信息
  private async resolveToken() {
    if (!this.tokenStore)
      return ''

    const token = this.tokenStore.validToken
    if (token)
      return token

    if (!isDoubleTokenMode)
      return ''

    try {
      await this.tokenStore.refreshToken()
      return this.tokenStore.validToken
    }
    catch {
      // 刷新失败则清空登录信息，等待业务侧重新登录
      this.tokenStore.clearTokenInfo()
      this.stopReconnect()
      return ''
    }
  }

  // 指数退避 + 抖动的自动重连调度
  private scheduleReconnect() {
    if (this.manualClose || !this.options.enabled)
      return
    if (this.reconnectTimer)
      return
    if (this.options.maxRetries <= 0)
      return
    if (this.retryCount >= this.options.maxRetries)
      return

    // 退避延迟：baseDelay * 2^retryCount，并加 0~30% 随机抖动
    const delayBase = this.options.baseDelay * (2 ** this.retryCount)
    const delay = Math.min(this.options.maxDelay, delayBase)
    const jitter = delay * Math.random() * 0.3
    const finalDelay = delay + jitter

    this.retryCount += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, finalDelay)
  }

  // 终止重连并标记为手动断开
  private stopReconnect() {
    this.manualClose = true
    this.clearReconnectTimer()
  }

  // 清理重连定时器
  private clearReconnectTimer() {
    if (!this.reconnectTimer)
      return
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }
}

export const wsManager = new WsManager()

let wsInitialized = false

// 应用启动时初始化 WebSocket（与登录状态联动）
export function initWebSocket(pinia: Pinia) {
  if (wsInitialized)
    return
  wsInitialized = true

  const tokenStore = useTokenStore(pinia)
  wsManager.bindTokenStore(tokenStore)

  // 读取环境变量配置，未启用或缺失 URL 时不建立连接
  const url = import.meta.env.VITE_WS_URL || ''
  const enabled = normalizeBoolean(import.meta.env.VITE_WS_ENABLE, true) && !!url

  wsManager.configure({
    enabled,
    url,
  })

  const scope = effectScope()
  scope.run(() => {
    // 监听登录态变化：登录后连接，退出后断开
    watch(
      () => tokenStore.hasLogin,
      (hasLogin) => {
        if (!enabled)
          return
        if (hasLogin)
          wsManager.connect()
        else
          wsManager.disconnect({ manual: true })
      },
      { immediate: true },
    )
  })
}
