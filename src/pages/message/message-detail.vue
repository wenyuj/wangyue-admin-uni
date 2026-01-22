<script lang="ts" setup>
import type { UserMessage } from '@/api/types/message'
import { getUserMessageDetail, markUserMessageRead } from '@/api/methods/message'
import { useDictStore, useMessageStore } from '@/store'
import { handleBack } from '@/utils'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '系统消息详情',
  },
})

const dictStore = useDictStore()
const messageStore = useMessageStore()

// 详情数据与加载状态
const detail = ref<UserMessage | null>(null)
const loading = ref(false)
const messageId = ref<number | string | null>(null)

const navTitle = ref('系统消息详情')

// 富文本样式透传给 mp-html，避免内容溢出/样式错乱
const tagStyle = {
  img: 'max-width: 100%; height: auto; display: block;',
  table: 'width: 100%; border-collapse: collapse;',
  p: 'line-height: 1.7; color: #1e293b; font-size: 16px;',
  a: 'color: #646cff;',
  strong: 'font-weight: 600; color: #1e293b;',
}

// 视图字段兜底，确保空数据也能正确展示
const title = computed(() => detail.value?.title || '系统消息')
const content = computed(() => detail.value?.content || '')
const time = computed(() => detail.value?.createTime || '')
const readFlagValue = computed(() => detail.value?.readFlag)
const readLabel = computed(() => {
  const label = dictStore.getDictLabel('read_status', readFlagValue.value)
  if (label)
    return label
  return readFlagValue.value === '1' ? '已读' : '未读'
})

// 读取详情后立即标记已读，并刷新角标
async function loadDetail() {
  if (!messageId.value)
    return
  loading.value = true
  try {
    detail.value = await getUserMessageDetail(messageId.value)
    await markUserMessageRead(messageId.value)
    if (detail.value) {
      detail.value = { ...detail.value, readFlag: '1' }
    }
    await messageStore.refreshUnread()
  }
  finally {
    loading.value = false
  }
}

// 解析路由参数并初始化字典后拉取详情
onLoad(async (query) => {
  const rawId = query?.id
  if (rawId !== undefined && rawId !== null) {
    const numericId = Number(rawId)
    messageId.value = Number.isNaN(numericId) ? rawId : numericId
  }
  await dictStore.ensureDicts(['read_status'])
  await loadDetail()
})
</script>

<template>
  <view class="page">
    <sar-navbar status-bar show-back fixed :title="navTitle" back-text="" @back="handleBack" />

    <view class="content">
      <view v-if="loading" class="loading">
        加载中...
      </view>
      <template v-else>
        <view class="detail-header">
          <view class="detail-title">
            {{ title }}
          </view>
          <view class="detail-meta">
            <text class="detail-tag" :class="{ 'detail-tag--unread': readFlagValue === '0' }">
              {{ readLabel }}
            </text>
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
  color: #1e293b;
  font-family: 'Plus Jakarta Sans', sans-serif;
  --detail-primary: #646cff;
  --detail-primary-dark: #535bf2;
  --detail-success: #52c41a;
  --detail-warning: #faad14;
  --detail-border: #e2e8f0;
  --detail-text-sub: #64748b;
  --sar-navbar-bg: rgba(255, 255, 255, 0.95);
  --sar-navbar-title-color: #1e293b;
  --sar-navbar-item-color: #1e293b;
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
  color: #1e293b;
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

.detail-tag {
  font-size: 22rpx;
  font-weight: 500;
  color: var(--detail-success);
  background: rgba(82, 196, 26, 0.1);
  border: 1rpx solid rgba(82, 196, 26, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.detail-tag--unread {
  color: var(--detail-warning);
  background: rgba(250, 173, 20, 0.12);
  border-color: rgba(250, 173, 20, 0.25);
}

.detail-time {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--detail-text-sub);
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
  color: var(--detail-text-sub);
  font-size: 26rpx;
}
</style>
