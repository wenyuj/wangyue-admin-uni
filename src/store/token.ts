import type { TokenInfo } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue' // 修复：导入 computed
import { refreshToken as _refreshToken } from '@/api/methods/auth'
import { useUserStore } from './user'

// 初始化状态
export const isDoubleTokenMode = import.meta.env.VITE_AUTH_MODE === 'double'
const tokenInfoState: TokenInfo = isDoubleTokenMode
  ? {
      accessToken: '',
      accessExpireTime: 0,
      refreshToken: '',
      refreshExpireTime: 0,
    }
  : {
      accessToken: '',
      accessExpireTime: 0,
    }

export const useTokenStore = defineStore(
  'token',
  () => {
    // 定义用户信息
    const tokenInfo = ref<TokenInfo>({ ...tokenInfoState })
    // 设置用户信息
    const setTokenInfo = (val: TokenInfo) => {
      tokenInfo.value = {
        ...val,
      }

      // 计算并存储过期时间
      const now = Date.now()
      if (!isDoubleTokenMode) {
        // 单token模式
        const expireTime = now + val.accessExpireTime * 1000
        uni.setStorageSync('accessTokenExpireTime', expireTime)
      }
      else {
        // 双token模式
        const accessExpireTime = now + val.accessExpireTime * 1000
        const refreshExpireTime = now + val.refreshExpireTime * 1000
        uni.setStorageSync('accessTokenExpireTime', accessExpireTime)
        uni.setStorageSync('refreshTokenExpireTime', refreshExpireTime)
      }
      const userStore = useUserStore()
      userStore.refreshUserInfo()
    }

    const clearTokenInfo = () => {
      // 清除存储的过期时间
      uni.removeStorageSync('accessTokenExpireTime')
      uni.removeStorageSync('refreshTokenExpireTime')
      tokenInfo.value = { ...tokenInfoState }
      uni.removeStorageSync('accessToken')
      const userStore = useUserStore()
      userStore.clearUserInfo()
    }

    /**
     * 判断token是否过期
     */
    const isTokenExpired = computed(() => {
      if (!tokenInfo.value) {
        return true
      }

      const now = Date.now()
      const expireTime = uni.getStorageSync('accessTokenExpireTime')

      if (!expireTime)
        return true
      return now >= expireTime
    })

    /**
     * 判断refreshToken是否过期
     */
    const isRefreshTokenExpired = computed(() => {
      if (!isDoubleTokenMode)
        return true

      const now = Date.now()
      const refreshExpireTime = uni.getStorageSync('refreshTokenExpireTime')

      if (!refreshExpireTime)
        return true
      return now >= refreshExpireTime
    })

    /**
     * 刷新token
     * @returns 刷新结果
     */
    const refreshToken = async () => {
      if (!isDoubleTokenMode) {
        throw new Error('单token模式不支持刷新token')
      }
      // 安全检查，确保refreshToken存在
      if (!tokenInfo.value.refreshToken) {
        throw new Error('无效的refreshToken')
      }
      try {
        const refreshToken = tokenInfo.value.refreshToken
        const res = await _refreshToken(refreshToken)
        setTokenInfo(res)
        return res
      }
      catch (error) {
        console.error('刷新token失败:', error)
        throw error
      }
    }

    /**
     * 获取有效的token
     * 注意：在computed中不直接调用异步函数，只做状态判断
     * 实际的刷新操作应由调用方处理
     */
    const getValidToken = computed(() => {
      // token已过期，返回空
      if (isTokenExpired.value) {
        return ''
      }
      return tokenInfo.value.accessToken
    })

    /**
     * 检查是否有登录信息（不考虑token是否过期）
     */
    const hasLoginInfo = computed(() => {
      if (!tokenInfo.value) {
        return false
      }
      return !!tokenInfo.value.accessToken
    })

    /**
     * 检查是否已登录且token有效
     */
    const hasValidLogin = computed(() => {
      return hasLoginInfo.value && !isTokenExpired.value
    })

    /**
     * 尝试获取有效的token，如果过期且可刷新，则刷新token
     * @returns 有效的token或空字符串
     */
    const tryGetValidToken = async (): Promise<string> => {
      if (!getValidToken.value && isDoubleTokenMode && !isRefreshTokenExpired.value) {
        try {
          await refreshToken()
          return getValidToken.value
        }
        catch (error) {
          console.error('尝试刷新token失败:', error)
          return ''
        }
      }
      return getValidToken.value
    }

    return {
      // 认证状态判断（最常用的）
      hasLogin: hasValidLogin,

      // 内部系统使用的方法
      refreshToken,
      tryGetValidToken,
      validToken: getValidToken,

      // 调试或特殊场景可能需要直接访问的信息
      tokenInfo,
      setTokenInfo,
      clearTokenInfo,
    }
  },
  {
    // 添加持久化配置，确保刷新页面后token信息不丢失
    persist: true,
  },
)
