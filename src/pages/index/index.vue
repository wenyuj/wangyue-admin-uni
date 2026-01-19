<script lang="ts" setup>
import { LOGIN_PAGE } from '@/router/config'
import { getI18nText } from '@/tabbar/i18n'

defineOptions({
  name: 'Home',
})
definePage({
  // 使用 type: "home" 属性设置首页，其他页面不需要设置，默认为page
  type: 'home',
  style: {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    navigationStyle: 'custom',
    navigationBarTitleText: '%tabbar.home%',
  },
})

console.log('index/index 首页打印了')

onLoad(() => {
  console.log('测试 uni API 自动引入: onLoad')
})

function toLogin() {
  uni.navigateTo({
    url: LOGIN_PAGE,
  })
}

const navTitle = computed(() => getI18nText('%tabbar.home%'))
</script>

<template>
  <view class="bg-white">
    <sar-navbar status-bar fixed :title="navTitle" />
    <view class="px-4 pt-2">
      <view class="mt-4 text-center text-4xl text-[#d14328]">
        wangyue
      </view>
      <view class="mt-4 text-center">
        <sar-button type="default">
          UI组件按钮
        </sar-button>
      </view>
      <view class="mt-4 text-center">
        UI组件官网：<text class="text-green-500">
          https://sard.wzt.zone/sard-uniapp-docs/
        </text>
      </view>
      <button class="mt-4 w-40 text-center" @click="toLogin">
        点击去登录页
      </button>
      <view class="h-6" />
    </view>
  </view>
</template>
