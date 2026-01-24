import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { tabbarList, tabbarStore } from '@/tabbar/store'
import { useNoticeStore } from './notice'
import { useSystemMessageStore } from './system-message'

// tabbar 消息入口索引，用于角标展示
function getMessageTabIndex() {
  return tabbarList.findIndex(item => item.pagePath.replace(/^\//, '') === 'pages/message/message')
}

export const useMessageStore = defineStore(
  'message',
  () => {
    const systemStore = useSystemMessageStore()
    const noticeStore = useNoticeStore()

    // 总未读数量用于 tabbar 角标
    const systemUnreadCount = computed(() => systemStore.unreadCount)
    const noticeUnreadCount = computed(() => noticeStore.unreadCount)
    const totalUnreadCount = computed(() => systemUnreadCount.value + noticeUnreadCount.value)

    // tabbar 角标刷新（未读为 0 时清空）
    const updateTabbarBadge = (total: number) => {
      const tabIndex = getMessageTabIndex()
      if (tabIndex < 0)
        return
      tabbarStore.setTabbarItemBadge(tabIndex, total > 0 ? total : 0)
    }

    watch(
      totalUnreadCount,
      (total) => {
        updateTabbarBadge(total)
      },
      { immediate: true },
    )

    // 同步刷新所有未读数据
    const refreshUnread = async () => {
      await Promise.all([
        systemStore.refreshUnreadCount(),
        noticeStore.refreshUnreadCount(),
      ])
    }

    // 退出登录或切换账号时清空未读状态
    const clear = () => {
      systemStore.clear()
      noticeStore.clear()
      updateTabbarBadge(0)
    }

    return {
      systemUnreadCount,
      noticeUnreadCount,
      totalUnreadCount,
      refreshUnread,
      clear,
    }
  },
)
