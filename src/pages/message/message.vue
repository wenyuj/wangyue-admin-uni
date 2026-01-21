<script lang="ts" setup>
import type { LoadMoreStatus } from 'sard-uniapp'
import type { ComputedRef, Ref } from 'vue'
import type { UserMessage, UserNotice } from '@/api/types/message'
import { usePagination, useRequest } from 'alova/client'
import { dialog, toast } from 'sard-uniapp'
import {
  getNoticePage,
  getUserMessagePage,
  markAllNoticeRead,
  markAllUserMessageRead,
} from '@/api/methods/message'
import { useDictStore, useMessageStore } from '@/store'
import { getI18nText } from '@/tabbar/i18n'
import UserMessageCard from './components/user-message-card.vue'
import UserNoticeCard from './components/user-notice-card.vue'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%tabbar.message%',
  },
})

// tabbar 标题与字典/角标统一由 store 与 i18n 驱动
const navTitle = computed(() => getI18nText('%tabbar.message%'))
const dictStore = useDictStore()
const messageStore = useMessageStore()

type MessageTab = 'system' | 'notice'
interface ReadRecord { type: MessageTab, id: number }

// 当前列表类型（系统消息 / 平台公告）
const currentTab = ref<MessageTab>('system')
// 详情页返回后仅标记已读，避免强制刷新导致下拉状态卡死
const lastRead = ref<ReadRecord | null>(null)
const pullDownRef = ref<{ enableToRefresh: (canRefresh: boolean) => void } | null>(null)

const PAGE_SIZE = 10
const PREVIEW_MAX = 60

// 顶部回到列表起点，避免切换/刷新时滚动位置干扰体验
function scrollListToTop() {
  uni.pageScrollTo({ scrollTop: 0, duration: 0 })
}

// 系统消息内容可能包含 HTML，列表仅取纯文本预览
function buildPreview(content?: string | null) {
  if (!content)
    return ''
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text)
    return ''
  return text.length > PREVIEW_MAX ? `${text.slice(0, PREVIEW_MAX)}...` : text
}

// 抽象分页逻辑：统一列表刷新/加载更多/下拉状态
interface ListPager<T> {
  list: Ref<T[]>
  loading: Ref<boolean>
  refreshing: Ref<boolean>
  loadMoreStatus: ComputedRef<LoadMoreStatus>
  refresh: (options?: { scrollToTop?: boolean }) => Promise<void>
  loadMore: () => void
}

function useListPager<T>(fetcher: (page: number, pageSize: number) => any): ListPager<T> {
  const {
    page,
    data,
    loading,
    isLastPage,
    reload,
    abort,
  } = usePagination(
    (pageNumber, pageSize) => fetcher(pageNumber, pageSize),
    {
      total: response => response.totalRow,
      data: response => response.records,
      append: true,
      preloadNextPage: false,
      preloadPreviousPage: false,
      initialPageSize: PAGE_SIZE,
    },
  )

  const refreshing = ref(false)

  const loadMoreStatus = computed<LoadMoreStatus>(() => {
    if (loading.value)
      return 'loading'
    return isLastPage.value ? 'complete' : 'incomplete'
  })

  const refresh = async (options?: { scrollToTop?: boolean }) => {
    abort()
    refreshing.value = true
    data.value = []
    if (options?.scrollToTop)
      scrollListToTop()
    try {
      await reload()
    }
    finally {
      refreshing.value = false
    }
  }

  // 触底加载更多，只在非加载/非最后一页时触发
  const loadMore = () => {
    if (loading.value || isLastPage.value)
      return
    page.value += 1
  }

  return {
    list: data,
    loading,
    refreshing,
    loadMoreStatus,
    refresh,
    loadMore,
  }
}

// 系统消息分页
const systemPager = useListPager<UserMessage>((pageNumber, pageSize) => getUserMessagePage({
  pageNumber,
  pageSize,
}))

// 平台公告分页
const noticePager = useListPager<UserNotice>((pageNumber, pageSize) => getNoticePage({
  pageNumber,
  pageSize,
}))

const systemList = computed(() => systemPager.list.value)
const noticeList = computed(() => noticePager.list.value)
const activePager = computed(() => (currentTab.value === 'system' ? systemPager : noticePager))
const refreshing = computed(() => activePager.value.refreshing.value)
const tabItems = computed(() => ([
  {
    name: 'system' as MessageTab,
    label: '系统消息',
    unread: messageStore.systemUnreadCount > 0,
  },
  {
    name: 'notice' as MessageTab,
    label: '平台公告',
    unread: messageStore.noticeUnreadCount > 0,
  },
]))

// 系统消息一键已读
const { loading: systemReadAllLoading, send: sendSystemReadAll } = useRequest(markAllUserMessageRead, {
  immediate: false,
}).onSuccess(() => {
  toast.success('系统消息已全部标记为已读')
  messageStore.refreshUnread()
  systemPager.refresh({ scrollToTop: true })
}).onError(() => {
  toast.fail('操作失败，请稍后重试')
})

// 平台公告一键已读
const { loading: noticeReadAllLoading, send: sendNoticeReadAll } = useRequest(markAllNoticeRead, {
  immediate: false,
}).onSuccess(() => {
  toast.success('平台公告已全部标记为已读')
  messageStore.refreshUnread()
  noticePager.refresh({ scrollToTop: true })
}).onError(() => {
  toast.fail('操作失败，请稍后重试')
})

// 下拉刷新：仅刷新当前 Tab，避免触发额外请求
function handleRefresh() {
  activePager.value.refresh()
  messageStore.refreshUnread()
}

// 系统消息全部已读确认弹窗
function handleReadAllSystem() {
  if (systemReadAllLoading.value)
    return
  dialog.confirm({
    title: '提示',
    message: '确定将系统消息全部标记为已读吗？',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => sendSystemReadAll(),
  })
}

// 平台公告全部已读确认弹窗
function handleReadAllNotice() {
  if (noticeReadAllLoading.value)
    return
  dialog.confirm({
    title: '提示',
    message: '确定将平台公告全部标记为已读吗？',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => sendNoticeReadAll(),
  })
}

// 跳转系统消息详情，记录本次已读以便返回后就地更新
function openSystemDetail(id: number) {
  lastRead.value = { type: 'system', id }
  uni.navigateTo({
    url: `/pages/message/message-detail?id=${id}`,
  })
}

// 跳转公告详情，缓存概要数据供详情页兜底
function openNoticeDetail(item: UserNotice) {
  messageStore.setActiveNotice(item)
  lastRead.value = { type: 'notice', id: item.noticeId }
  uni.navigateTo({
    url: `/pages/message/notice-detail?id=${item.noticeId}`,
  })
}

// 切换 Tab 时，若当前列表为空则触发一次首屏加载
watch(currentTab, (tab) => {
  if (tab === 'system' && systemList.value.length === 0 && !systemPager.loading.value) {
    systemPager.refresh({ scrollToTop: true })
    return
  }
  if (tab === 'notice' && noticeList.value.length === 0 && !noticePager.loading.value) {
    noticePager.refresh({ scrollToTop: true })
  }
})

// 触底加载更多：按当前 Tab 分发
onReachBottom(() => {
  activePager.value.loadMore()
})

// 仅在页面顶端允许下拉刷新，避免滚动中误触
onPageScroll(({ scrollTop }) => {
  pullDownRef.value?.enableToRefresh(scrollTop <= 0)
})

// 详情页返回后就地标记已读，不触发强制刷新
function markListRead(payload: ReadRecord) {
  if (payload.type === 'system') {
    const target = systemPager.list.value.find(item => item.messageId === payload.id)
    if (target) {
      target.readFlag = '1'
    }
    return
  }
  const target = noticePager.list.value.find(item => item.noticeId === payload.id)
  if (target) {
    target.readFlag = '1'
  }
}

// 页面显示时保证字典与角标同步，并应用返回已读标记
onShow(async () => {
  await dictStore.ensureDicts(['read_status', 'sys_notice_type'])
  await messageStore.refreshUnread()
  if (lastRead.value) {
    markListRead(lastRead.value)
    lastRead.value = null
  }
})
</script>

<template>
  <view class="page">
    <sar-navbar status-bar fixed :title="navTitle" />

    <sar-pull-down-refresh
      ref="pullDownRef"
      :loading="refreshing"
      root-class="refresh-wrap"
      @refresh="handleRefresh"
    >
      <view class="content">
        <view class="tabs-row">
          <scroll-view scroll-x class="tabs-scroll">
            <view class="tabs-track">
              <view
                v-for="tab in tabItems"
                :key="tab.name"
                class="tab-item"
                :class="{ 'tab-item--active': currentTab === tab.name }"
                @click="currentTab = tab.name"
              >
                <text class="tab-text">{{ tab.label }}</text>
                <view v-if="tab.unread" class="tab-dot" />
                <view v-if="currentTab === tab.name" class="tab-underline" />
              </view>
            </view>
          </scroll-view>

          <sar-button
            v-if="currentTab === 'system'"
            inline
            type="text"
            theme="primary"
            root-class="read-all-btn"
            :loading="systemReadAllLoading"
            @click="handleReadAllSystem"
          >
            全部已读
          </sar-button>
          <sar-button
            v-else
            inline
            type="text"
            theme="primary"
            root-class="read-all-btn"
            :loading="noticeReadAllLoading"
            @click="handleReadAllNotice"
          >
            全部已读
          </sar-button>
        </view>

        <view v-show="currentTab === 'system'" class="list">
          <view v-if="!systemPager.loading.value && systemList.length === 0" class="empty">
            <sar-empty description="暂无系统消息" />
          </view>
          <UserMessageCard
            v-for="item in systemList"
            :key="item.messageId"
            :item="item"
            :preview="buildPreview(item.content)"
            @click="openSystemDetail(item.messageId)"
          />

          <sar-load-more
            v-if="systemList.length > 0"
            :status="systemPager.loadMoreStatus.value"
            @load-more="systemPager.loadMore"
          />
        </view>

        <view v-show="currentTab === 'notice'" class="list">
          <view v-if="!noticePager.loading.value && noticeList.length === 0" class="empty">
            <sar-empty description="暂无平台公告" />
          </view>
          <UserNoticeCard
            v-for="item in noticeList"
            :key="item.noticeId"
            :item="item"
            @click="openNoticeDetail(item)"
          />

          <sar-load-more
            v-if="noticeList.length > 0"
            :status="noticePager.loadMoreStatus.value"
            @load-more="noticePager.loadMore"
          />
        </view>
      </view>
    </sar-pull-down-refresh>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #ffffff;
  color: #1e293b;
  font-family: 'Plus Jakarta Sans', sans-serif;
  --message-primary: #646cff;
  --message-primary-dark: #535bf2;
  --message-warning: #faad14;
  --message-text-main: #1e293b;
  --message-text-sub: #64748b;
  --message-border: #e2e8f0;
  --sar-navbar-bg: rgba(255, 255, 255, 0.95);
  --sar-navbar-title-color: var(--message-text-main);
  --sar-navbar-item-color: var(--message-text-main);
  --sar-navbar-title-font-size: 32rpx;
}

.refresh-wrap {
  min-height: 100vh;
  background-color: #ffffff;
}

.content {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

:deep(.sar-navbar__fixation) {
  backdrop-filter: blur(16rpx);
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
}

.tabs-row {
  position: sticky;
  top: calc(var(--sar-navbar-height) + constant(safe-area-inset-top));
  top: calc(var(--sar-navbar-height) + env(safe-area-inset-top));
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 32rpx;
  background-color: rgba(255, 255, 255, 0.95);
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(16rpx);
}

.tabs-scroll {
  flex: 1;
  white-space: nowrap;
}

.tabs-track {
  display: flex;
  align-items: center;
  gap: 48rpx;
}

.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 24rpx 0;
  font-size: 28rpx;
  font-weight: 500;
  color: var(--message-text-sub);
}

.tab-item--active {
  color: var(--message-primary);
  font-weight: 600;
}

.tab-text {
  line-height: 1.2;
}

.tab-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: var(--message-warning);
}

.tab-underline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: var(--message-primary);
}

:deep(.read-all-btn) {
  margin-left: auto;
  font-weight: 600;
  color: var(--message-primary);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.empty {
  padding: 120rpx 0;
}
</style>
