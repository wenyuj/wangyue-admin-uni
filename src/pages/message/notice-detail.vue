<script lang="ts" setup>
import type { NoticeDetail, UserNotice } from '@/api/types/message'
import { getNoticeDetail, markNoticeRead } from '@/api/methods/message'
import DictTag from '@/components/dict-tag.vue'
import { useDictStore, useMessageStore } from '@/store'
import { handleBack } from '@/utils'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '平台公告详情',
  },
})

const dictStore = useDictStore()
const messageStore = useMessageStore()

// 列表摘要与详情数据分离，优先展示摘要，详情加载后覆盖
const summary = ref<UserNotice | null>(null)
const detail = ref<NoticeDetail | null>(null)
const loading = ref(false)
const noticeId = ref<number | string | null>(null)

const navTitle = ref('平台公告详情')

// 富文本样式透传给 mp-html，避免内容溢出/样式错乱
const tagStyle = {
  img: 'max-width: 100%; height: auto; display: block;',
  table: 'width: 100%; border-collapse: collapse;',
  p: 'line-height: 1.7; color: #374151;',
  a: 'color: #2563eb;',
}

// 视图字段兜底：标题/时间/标签优先来自详情，缺失则回退摘要
const title = computed(() => detail.value?.noticeTitle || summary.value?.noticeTitle || '平台公告')
const content = computed(() => detail.value?.noticeContent || '')
const time = computed(() => detail.value?.createTime || summary.value?.createTime || '')
const noticeType = computed(() => detail.value?.noticeType || summary.value?.noticeType || '')
const readFlagValue = computed(() => summary.value?.readFlag)

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
            <DictTag dict-type="sys_notice_type" :value="noticeType" size="small" />
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
  flex-wrap: wrap;
  align-items: center;
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
