<script lang="ts" setup>
import type { UserMessage } from '@/api/types/message'
import DictTag from '@/components/dict-tag.vue'

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
  <view class="message-card" :class="{ 'is-unread': props.item.readFlag === '0' }" @click="handleClick">
    <view class="item-header">
      <view class="item-title-row">
        <text v-if="props.item.readFlag === '0'" class="unread-dot" />
        <view class="item-title">
          {{ props.item.title }}
        </view>
      </view>
      <DictTag dict-type="read_status" :value="props.item.readFlag" size="small" />
    </view>
    <view v-if="props.preview" class="item-body">
      {{ props.preview }}
    </view>
    <view class="item-footer">
      <view class="item-time">
        {{ props.item.createTime || '-' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.message-card {
  position: relative;
  background: rgba(255, 255, 255, 0.92);
  padding: 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease;
}

.message-card:active {
  transform: scale(0.99);
}

.message-card.is-unread {
  border-color: rgba(245, 158, 11, 0.2);
  box-shadow:
    0 12rpx 28rpx rgba(15, 23, 42, 0.06),
    inset 0 0 0 2rpx rgba(245, 158, 11, 0.1);
}

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(245, 158, 11, 0.95);
  box-shadow: 0 0 0 2rpx rgba(245, 158, 11, 0.18);
}

.item-body {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: rgba(15, 23, 42, 0.65);
  line-height: 1.6;
}

.item-footer {
  margin-top: 14rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-time {
  font-size: 24rpx;
  color: rgba(15, 23, 42, 0.45);
}
</style>
