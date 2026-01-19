<script lang="ts" setup>
import { getI18nText } from '@/tabbar/i18n'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%tabbar.workbench%',
  },
})

const navTitle = computed(() => getI18nText('%tabbar.workbench%'))
</script>

<template>
  <view class="page bg-white">
    <sar-navbar status-bar fixed :title="navTitle" />
    <view class="px-4 py-3 text-sm text-gray-500">
      工作台内容占位
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
}
</style>
