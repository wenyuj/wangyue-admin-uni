import type { ReadStatus, UserMessage } from '@/api/types/message'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserMessageUnreadCount } from '@/api/methods/message'

const MAX_DEDUPE_SIZE = 500
const MAX_LIVE_ITEMS = 50
const REFRESH_DEBOUNCE_MS = 400

function normalizeReadFlag(value: unknown): ReadStatus | null {
  if (value === '0' || value === 0 || value === false)
    return '0'
  if (value === '1' || value === 1 || value === true)
    return '1'
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '0' || trimmed === '1')
      return trimmed as ReadStatus
  }
  return null
}

export const useSystemMessageStore = defineStore(
  'system-message',
  () => {
    // 系统消息 store：
    // 1) unreadCount 用于角标与未读提示
    // 2) liveMessages 用于 WS 推送实时插入列表
    const unreadCount = ref(0)
    // 仅用于 UI 实时插入，分页列表仍由接口驱动。
    const liveMessages = ref<UserMessage[]>([])

    const recentReadFlags = new Map<number | string, ReadStatus>()
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const refreshUnreadCount = async () => {
      const count = await getUserMessageUnreadCount()
      unreadCount.value = count
    }

    const scheduleRefresh = () => {
      if (refreshTimer)
        clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        refreshTimer = null
        refreshUnreadCount().catch(() => {})
      }, REFRESH_DEBOUNCE_MS)
    }

    const trackReadFlag = (id: number | string, readFlag: ReadStatus) => {
      if (recentReadFlags.size >= MAX_DEDUPE_SIZE)
        recentReadFlags.clear()
      recentReadFlags.set(id, readFlag)
    }

    // 将推送消息插入顶部，已存在则更新以避免重复。
    const upsertLiveMessage = (message: UserMessage) => {
      const id = message.messageId
      if (id === undefined || id === null)
        return
      const index = liveMessages.value.findIndex(item => item.messageId === id)
      if (index >= 0) {
        liveMessages.value[index] = { ...liveMessages.value[index], ...message }
        return
      }
      liveMessages.value.unshift(message)
      if (liveMessages.value.length > MAX_LIVE_ITEMS)
        liveMessages.value.pop()
    }

    // 详情页返回时同步本地已读，保证列表状态与角标一致。
    const markLiveMessageRead = (id: number | string) => {
      const index = liveMessages.value.findIndex(item => item.messageId === id)
      if (index < 0)
        return
      const target = liveMessages.value[index]
      if (target.readFlag === '1')
        return
      liveMessages.value[index] = { ...target, readFlag: '1' }
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      trackReadFlag(id, '1')
    }

    // WS 消息入口：message.data 直传为 UserMessage。
    const ingestMessage = (message: UserMessage) => {
      const id = message.messageId
      if (id === undefined || id === null) {
        scheduleRefresh()
        return
      }

      const normalizedFlag = normalizeReadFlag(message.readFlag)
      const readFlag = normalizedFlag ?? '0'
      const normalizedMessage = { ...message, readFlag }
      upsertLiveMessage(normalizedMessage)

      if (normalizedFlag) {
        const previous = recentReadFlags.get(id)
        if (previous !== readFlag) {
          if (readFlag === '0')
            unreadCount.value += 1
          else
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          trackReadFlag(id, readFlag)
        }
      }

      scheduleRefresh()
    }

    const clear = () => {
      unreadCount.value = 0
      liveMessages.value = []
      recentReadFlags.clear()
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }

    return {
      unreadCount,
      liveMessages,
      refreshUnreadCount,
      ingestMessage,
      markLiveMessageRead,
      clear,
    }
  },
  {
    persist: {
      paths: ['unreadCount'],
    },
  },
)
