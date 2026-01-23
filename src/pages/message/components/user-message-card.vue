<script lang="ts" setup>
import type { UserMessage } from '@/api/types/message'

const props = defineProps<{
  item: UserMessage
  preview: string
}>()

// 统一对外抛出点击事件，列表页负责跳转
const emit = defineEmits<{
  (event: 'click'): void
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <view class="message-row" :class="{ 'is-unread': props.item.readFlag === '0' }" @click="handleClick">
    <view class="message-icon">
      <view class="icon i-carbon-notification" />
    </view>
    <view class="message-content">
      <view class="message-title-row">
        <view class="message-title-wrap">
          <text class="message-title">{{ props.item.title }}</text>
          <text v-if="props.item.readFlag === '0'" class="unread-dot" />
        </view>
        <text class="message-time">{{ props.item.createTime || '-' }}</text>
      </view>
      <view v-if="props.preview" class="message-preview">
        {{ props.preview }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.message-row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f1f5f9;
  background: #ffffff;
}

.message-row:active {
  background: #f8fafc;
}

.message-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.2);
  color: var(--third-text-color);
  flex-shrink: 0;
}

.message-row.is-unread .message-icon {
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--primary-color);
}

.icon {
  font-size: 36rpx;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.message-title-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.message-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 20rpx;
  font-weight: 500;
  color: var(--third-text-color);
  white-space: nowrap;
}

.unread-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: var(--warning-color);
  flex-shrink: 0;
}

.message-preview {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--secondary-text-color);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
