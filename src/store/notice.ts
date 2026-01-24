import type { ReadStatus, UserNotice } from '@/api/types/message'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNoticeUnreadCount } from '@/api/methods/message'

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

export const useNoticeStore = defineStore(
  'notice',
  () => {
    // 公告 store：
    // 1) unreadCount 用于角标与未读提示
    // 2) liveNotices 用于 WS 推送实时插入列表
    // 3) activeNotice/noticeCache 用于详情页兜底展示
    const unreadCount = ref(0)
    // 仅用于 UI 实时插入，分页列表仍由接口驱动。
    const liveNotices = ref<UserNotice[]>([])
    const activeNotice = ref<UserNotice | null>(null)
    const noticeCache = ref<Record<string, UserNotice>>({})

    const recentReadFlags = new Map<number | string, ReadStatus>()
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const refreshUnreadCount = async () => {
      const count = await getNoticeUnreadCount()
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

    const cacheNotice = (notice: UserNotice) => {
      const id = notice.noticeId
      if (id === undefined || id === null)
        return
      noticeCache.value[String(id)] = notice
    }

    const getNoticeCache = (noticeId?: number | string | null) => {
      if (noticeId === undefined || noticeId === null)
        return undefined
      return noticeCache.value[String(noticeId)]
    }

    const setActiveNotice = (notice: UserNotice) => {
      activeNotice.value = notice
      cacheNotice(notice)
    }

    const trackReadFlag = (id: number | string, readFlag: ReadStatus) => {
      if (recentReadFlags.size >= MAX_DEDUPE_SIZE)
        recentReadFlags.clear()
      recentReadFlags.set(id, readFlag)
    }

    // 将推送公告插入顶部，已存在则更新以避免重复。
    const upsertLiveNotice = (notice: UserNotice) => {
      const id = notice.noticeId
      if (id === undefined || id === null)
        return
      const index = liveNotices.value.findIndex(item => item.noticeId === id)
      if (index >= 0) {
        liveNotices.value[index] = { ...liveNotices.value[index], ...notice }
        return
      }
      liveNotices.value.unshift(notice)
      if (liveNotices.value.length > MAX_LIVE_ITEMS)
        liveNotices.value.pop()
    }

    // 详情页返回时同步本地已读，保证列表状态与角标一致。
    const markLiveNoticeRead = (id: number | string) => {
      const index = liveNotices.value.findIndex(item => item.noticeId === id)
      if (index < 0)
        return
      const target = liveNotices.value[index]
      if (target.readFlag === '1')
        return
      liveNotices.value[index] = { ...target, readFlag: '1' }
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      trackReadFlag(id, '1')
    }

    // WS 公告入口：message.data 直传为 UserNotice。
    const ingestNotice = (notice: UserNotice) => {
      const id = notice.noticeId
      if (id === undefined || id === null) {
        scheduleRefresh()
        return
      }

      const normalizedFlag = normalizeReadFlag(notice.readFlag)
      const readFlag = normalizedFlag ?? '0'
      const normalizedNotice = { ...notice, readFlag }
      cacheNotice(normalizedNotice)
      upsertLiveNotice(normalizedNotice)

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
      liveNotices.value = []
      activeNotice.value = null
      noticeCache.value = {}
      recentReadFlags.clear()
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }

    return {
      unreadCount,
      liveNotices,
      activeNotice,
      refreshUnreadCount,
      ingestNotice,
      setActiveNotice,
      getNoticeCache,
      markLiveNoticeRead,
      clear,
    }
  },
  {
    persist: {
      paths: ['unreadCount'],
    },
  },
)
