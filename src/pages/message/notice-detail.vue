<script lang="ts" setup>
import type { NoticeDetail, UserNotice } from '@/api/types/message'
import { getNoticeDetail, markNoticeRead } from '@/api/methods/message'
import { t } from '@/locale'
import { useDictStore, useMessageStore } from '@/store'
import { handleBack } from '@/utils'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%message.noticeDetail.title%',
  },
})

const dictStore = useDictStore()
const messageStore = useMessageStore()
const currentLocale = ref(uni.getLocale())

// 列表摘要与详情数据分离，优先展示摘要，详情加载后覆盖
const summary = ref<UserNotice | null>(null)
const detail = ref<NoticeDetail | null>(null)
const loading = ref(false)
const noticeId = ref<number | string | null>(null)

const navTitle = computed(() => t('message.noticeDetail.title', { locale: currentLocale.value }))
const fallbackContent = computed(() => `<p>${t('message.noticeDetail.fallbackContent', { locale: currentLocale.value })}</p>`)

// 富文本样式透传给 mp-html，避免内容溢出/样式错乱
const tagStyle = {
  img: 'max-width: 100%; height: auto; display: block;',
  table: 'width: 100%; border-collapse: collapse;',
  p: 'line-height: 1.7; color: var(--text-color); font-size: 16px;',
  a: 'color: var(--primary-color);',
  strong: 'font-weight: 600; color: var(--text-color);',
}

// 视图字段兜底：标题/时间/标签优先来自详情，缺失则回退摘要
const title = computed(() => detail.value?.noticeTitle || summary.value?.noticeTitle || t('message.noticeDetail.fallbackTitle', { locale: currentLocale.value }))
const content = computed(() => detail.value?.noticeContent || fallbackContent.value)
const time = computed(() => detail.value?.createTime || summary.value?.createTime || '')
const noticeType = computed(() => detail.value?.noticeType || summary.value?.noticeType || '')
const readFlagValue = computed(() => summary.value?.readFlag)
const noticeTypeLabel = computed(() => dictStore.getDictLabel('sys_notice_type', noticeType.value)
  || t('message.noticeDetail.fallbackType', { locale: currentLocale.value }))
const readLabel = computed(() => {
  const label = dictStore.getDictLabel('read_status', readFlagValue.value)
  if (label)
    return label
  return readFlagValue.value === '1'
    ? t('message.read.read', { locale: currentLocale.value })
    : t('message.read.unread', { locale: currentLocale.value })
})

// 详情加载后标记已读，并刷新角标
async function loadDetail() {
  if (!noticeId.value)
    return
  loading.value = true
  summary.value = messageStore.getNoticeCache(noticeId.value) || messageStore.activeNotice
  try {
    detail.value = await getNoticeDetail(noticeId.value)
  }
  finally {
    loading.value = false
  }
  await markNoticeRead(noticeId.value)
  if (summary.value) {
    summary.value = { ...summary.value, readFlag: '1' }
  }
  await messageStore.refreshUnread()
}

// 解析路由参数并初始化字典后拉取详情
onLoad(async (query) => {
  const rawId = query?.id
  if (rawId !== undefined && rawId !== null) {
    const numericId = Number(rawId)
    noticeId.value = Number.isNaN(numericId) ? rawId : numericId
  }
  await dictStore.ensureDicts(['read_status', 'sys_notice_type'])
  await loadDetail()
})

onShow(() => {
  currentLocale.value = uni.getLocale()
})
</script>

<template>
  <view class="page">
    <sar-navbar status-bar show-back fixed :title="navTitle" back-text="" @back="handleBack" />

    <view class="content">
      <view v-if="loading" class="loading">
        {{ $t('message.detail.loading') }}
      </view>
      <template v-else>
        <view class="detail-header">
          <view class="detail-title">
            {{ title }}
          </view>
          <view class="detail-meta">
            <view class="detail-tags">
              <text class="detail-tag detail-tag--info">
                {{ noticeTypeLabel }}
              </text>
              <text class="detail-tag" :class="{ 'detail-tag--unread': readFlagValue === '0' }">
                {{ readLabel }}
              </text>
            </view>
            <text class="detail-time">{{ time || '-' }}</text>
          </view>
        </view>
        <view class="detail-divider" />
        <view class="detail-body">
          <mp-html :content="content" :tag-style="tagStyle" />
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #ffffff;
  color: var(--text-color);
  font-family: 'Plus Jakarta Sans', sans-serif;
  --detail-border: #e2e8f0;
  --sar-navbar-bg: rgba(255, 255, 255, 0.95);
  --sar-navbar-title-color: var(--text-color);
  --sar-navbar-item-color: var(--text-color);
  --sar-navbar-title-font-size: 32rpx;
}

.content {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

:deep(.sar-navbar__fixation) {
  backdrop-filter: blur(16rpx);
  border-bottom: 1rpx solid var(--detail-border);
}

.detail-header {
  padding: 32rpx 32rpx 24rpx;
}

.detail-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
}

.detail-meta {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  flex-wrap: wrap;
}

.detail-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.detail-tag {
  font-size: 22rpx;
  font-weight: 500;
  color: var(--success-color);
  background: rgba(82, 196, 26, 0.1);
  border: 1rpx solid rgba(82, 196, 26, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.detail-tag--unread {
  color: var(--warning-color);
  background: rgba(250, 173, 20, 0.12);
  border-color: rgba(250, 173, 20, 0.25);
}

.detail-tag--info {
  color: var(--primary-color);
  background: rgba(100, 108, 255, 0.12);
  border-color: rgba(100, 108, 255, 0.2);
}

.detail-time {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--secondary-text-color);
  letter-spacing: 2rpx;
}

.detail-divider {
  height: 1rpx;
  width: 100%;
  background: var(--detail-border);
}

.detail-body {
  padding: 32rpx;
}

.loading {
  text-align: center;
  padding: 120rpx 0;
  color: var(--secondary-text-color);
  font-size: 26rpx;
}
</style>
