import type { UserMessage, UserNotice } from '@/api/types/message'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getNoticeUnreadCount,
  getNoticeUnreadList,
  getUserMessageUnreadCount,
  getUserMessageUnreadList,
} from '@/api/methods/message'
import { tabbarList, tabbarStore } from '@/tabbar/store'

// 兼容后端返回结构，统一解析未读数量
function resolveUnreadCount(payload: number | Record<string, any> | null | undefined) {
  if (typeof payload === 'number') {
    return payload
  }
  if (payload && typeof payload.data === 'number') {
    return payload.data
  }
  const value = payload?.unreadCount ?? payload?.count ?? payload?.total
  return Number(value || 0)
}

// 兼容后端返回结构，统一解析未读列表
function resolveUnreadList<T>(payload: T[] | Record<string, any> | null | undefined) {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload && Array.isArray(payload.records)) {
    return payload.records as T[]
  }
  if (payload && Array.isArray(payload.list)) {
    return payload.list as T[]
  }
  return [] as T[]
}

// tabbar 消息入口索引，用于角标展示
function getMessageTabIndex() {
  return tabbarList.findIndex(item => item.pagePath.replace(/^\//, '') === 'pages/message/message')
}

export const useMessageStore = defineStore(
  'message',
  () => {
    // 未读数量与列表缓存
    const systemUnreadCount = ref(0)
    const noticeUnreadCount = ref(0)
    const systemUnreadList = ref<UserMessage[]>([])
    const noticeUnreadList = ref<UserNotice[]>([])
    const activeNotice = ref<UserNotice | null>(null)
    const noticeCache = ref<Record<string, UserNotice>>({})

    // 总未读数量用于 tabbar 角标
    const totalUnreadCount = computed(() => systemUnreadCount.value + noticeUnreadCount.value)

    // 单条公告缓存，详情页兜底使用
    const cacheNotice = (notice: UserNotice) => {
      const id = notice.noticeId
      if (!id && id !== 0) {
        return
      }
      noticeCache.value[String(id)] = notice
    }

    const cacheNoticeList = (list: UserNotice[]) => {
      list.forEach(cacheNotice)
    }

    // 获取公告缓存，避免详情页初始空白
    const getNoticeCache = (noticeId?: number | string | null) => {
      if (noticeId === undefined || noticeId === null)
        return undefined
      return noticeCache.value[String(noticeId)]
    }

    // tabbar 角标刷新（未读为 0 时清空）
    const updateTabbarBadge = () => {
      const tabIndex = getMessageTabIndex()
      if (tabIndex < 0)
        return
      const total = totalUnreadCount.value
      tabbarStore.setTabbarItemBadge(tabIndex, total > 0 ? total : 0)
    }

    // 刷新系统消息未读数据
    const refreshSystemUnread = async () => {
      const [count, list] = await Promise.all([
        getUserMessageUnreadCount(),
        getUserMessageUnreadList(),
      ])
      systemUnreadCount.value = resolveUnreadCount(count)
      systemUnreadList.value = resolveUnreadList<UserMessage>(list)
      updateTabbarBadge()
    }

    // 刷新公告未读数据
    const refreshNoticeUnread = async () => {
      const [count, list] = await Promise.all([
        getNoticeUnreadCount(),
        getNoticeUnreadList(),
      ])
      noticeUnreadCount.value = resolveUnreadCount(count)
      noticeUnreadList.value = resolveUnreadList<UserNotice>(list)
      cacheNoticeList(noticeUnreadList.value)
      updateTabbarBadge()
    }

    // 同步刷新所有未读数据
    const refreshUnread = async () => {
      await Promise.all([refreshSystemUnread(), refreshNoticeUnread()])
    }

    // 记录当前跳转详情的公告，用于详情页兜底展示
    const setActiveNotice = (notice: UserNotice) => {
      activeNotice.value = notice
      cacheNotice(notice)
    }

    // 退出登录或切换账号时清空未读状态
    const clear = () => {
      systemUnreadCount.value = 0
      noticeUnreadCount.value = 0
      systemUnreadList.value = []
      noticeUnreadList.value = []
      activeNotice.value = null
      noticeCache.value = {}
      updateTabbarBadge()
    }

    return {
      systemUnreadCount,
      noticeUnreadCount,
      systemUnreadList,
      noticeUnreadList,
      activeNotice,
      totalUnreadCount,
      refreshSystemUnread,
      refreshNoticeUnread,
      refreshUnread,
      setActiveNotice,
      getNoticeCache,
      cacheNoticeList,
      clear,
    }
  },
  {
    persist: true,
  },
)
