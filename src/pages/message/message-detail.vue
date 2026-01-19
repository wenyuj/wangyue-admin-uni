<script lang="ts" setup>
import type { UserMessage } from '@/api/types/message'
import { getUserMessageDetail, markUserMessageRead } from '@/api/methods/message'
import DictTag from '@/components/dict-tag.vue'
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
  p: 'line-height: 1.7; color: #374151;',
  a: 'color: #2563eb;',
}

// 视图字段兜底，确保空数据也能正确展示
const title = computed(() => detail.value?.title || '系统消息')
const content = computed(() => detail.value?.content || '')
const time = computed(() => detail.value?.createTime || '')
const readFlagValue = computed(() => detail.value?.readFlag)

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
    <sar-navbar status-bar show-back fixed :title="navTitle" @back="handleBack" />

    <view class="content">
      <view v-if="loading" class="loading">
        加载中...
      </view>
      <template v-else>
        <view class="header">
          <view class="title">
            {{ title }}
          </view>
          <view class="meta">
            <DictTag dict-type="read_status" :value="readFlagValue" size="small" />
            <text class="time">{{ time || '-' }}</text>
          </view>
        </view>
        <view class="body">
          <mp-html :content="content" :tag-style="tagStyle" />
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 24rpx;
}

.header {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
}

.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.meta {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
}

.body {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
}

.loading {
  text-align: center;
  padding: 60rpx 0;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>
