<script lang="ts" setup>
import { auth } from '@/api/methods/auth'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { tabbarList } from '@/tabbar/config'
import { isPageTabbar } from '@/tabbar/store'
import { ensureDecodeURIComponent, parseUrlToObj } from '@/utils'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '登录',
  },
})

const redirectUrl = ref('')
const form = reactive({
  userName: '',
  password: '',
})
const loading = ref(false)

onLoad((options) => {
  if (options.redirect) {
    redirectUrl.value = ensureDecodeURIComponent(options.redirect)
  }
  else {
    redirectUrl.value = tabbarList[0].pagePath
  }
})

const userStore = useUserStore()
const tokenStore = useTokenStore()

async function doLogin() {
  if (tokenStore.hasLogin) {
    uni.navigateBack()
    return
  }
  if (!form.userName.trim()) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }
  if (!form.password.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  try {
    loading.value = true
    const tokenInfo = await auth({
      userName: form.userName.trim(),
      password: form.password,
    })
    tokenStore.setTokenInfo(tokenInfo)
    await userStore.refreshUserInfo()
  }
  catch (error) {
    console.log('登录失败', error)
    uni.showToast({ title: '登录失败', icon: 'none' })
    return
  }
  finally {
    loading.value = false
  }

  let path = redirectUrl.value
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  const { path: targetPath } = parseUrlToObj(path)
  if (isPageTabbar(targetPath)) {
    uni.switchTab({ url: targetPath })
    return
  }
  uni.redirectTo({ url: path })
}
</script>

<template>
  <view class="login-page">
    <sar-navbar status-bar fixed title="" />

    <view class="bg-pattern" />
    <view class="bg-blob bg-blob--top" />
    <view class="bg-blob bg-blob--bottom" />

    <view class="login-main">
      <view class="login-header">
        <view class="logo-wrap">
          <view class="logo-card">
            <image class="logo-image" src="/static/logo.svg" mode="aspectFit" />
          </view>
          <view class="logo-glow" />
        </view>
        <view class="title-wrap">
          <text class="title-text">账号登录</text>
          <view class="title-line" />
        </view>
      </view>

      <view class="login-form">
        <view class="form-group">
          <view class="form-row">
            <view class="form-icon i-carbon-user-avatar" />
            <input
              v-model="form.userName"
              class="form-input"
              placeholder="请输入账号"
              placeholder-style="color: rgba(156, 163, 175, 0.8); font-weight: 500;"
            >
          </view>
        </view>
        <view class="form-group">
          <view class="form-row">
            <view class="form-icon i-carbon-password" />
            <input
              v-model="form.password"
              class="form-input"
              placeholder="请输入密码"
              password
              placeholder-style="color: rgba(156, 163, 175, 0.8); font-weight: 500;"
            >
          </view>
        </view>
      </view>

      <view class="login-action">
        <sar-button
          type="default"
          theme="primary"
          root-class="login-btn"
          :loading="loading"
          @click="doLogin"
        >
          登录
        </sar-button>
      </view>
    </view>

    <view class="login-footer">
      @Copyright 2025
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  color: var(--text-color);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  --sar-navbar-height: 0rpx;
}

.login-page ::selection {
  background: rgba(var(--primary-color-rgb), 0.2);
  color: var(--primary-color);
}

:deep(.sar-navbar__fixation) {
  background: transparent;
}

:deep(input:-webkit-autofill),
:deep(input:-webkit-autofill:hover),
:deep(input:-webkit-autofill:focus),
:deep(input:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 60rpx #f8fafc inset !important;
  -webkit-text-fill-color: var(--text-color) !important;
  transition: background-color 5000s ease-in-out 0s;
}

.bg-pattern {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(#cbd5e1 2rpx, transparent 2rpx);
  background-size: 48rpx 48rpx;
  opacity: 0.3;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0));
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0));
  pointer-events: none;
  z-index: 1;
}

.bg-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(128rpx);
  pointer-events: none;
  z-index: 1;
}

.bg-blob--top {
  top: -20%;
  right: -10%;
  width: 1000rpx;
  height: 1000rpx;
  background: rgba(var(--primary-color-rgb), 0.05);
}

.bg-blob--bottom {
  bottom: -10%;
  left: -10%;
  width: 800rpx;
  height: 800rpx;
  background: rgba(147, 197, 253, 0.1);
}

.login-main {
  position: relative;
  z-index: 10;
  flex: 1;
  width: 100%;
  max-width: 896rpx;
  margin: 0 auto;
  padding: 0 64rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 96rpx;
}

.logo-wrap {
  position: relative;
  margin-bottom: 48rpx;
}

.logo-card {
  width: 128rpx;
  height: 128rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #ffffff, #f1f5f9);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.logo-image {
  width: 72rpx;
  height: 72rpx;
}

.logo-glow {
  position: absolute;
  inset: 0;
  border-radius: 1998rpx;
  background: rgba(100, 108, 255, 0.2);
  filter: blur(48rpx);
  transform: scale(0.75);
  z-index: 1;
}

.title-wrap {
  text-align: center;
}

.title-text {
  font-size: 72rpx;
  font-weight: 500;
  letter-spacing: -1rpx;
}

.title-line {
  width: 64rpx;
  height: 8rpx;
  margin: 24rpx auto 0;
  border-radius: 1998rpx;
  background: rgba(100, 108, 255, 0.8);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 48rpx;
  width: 100%;
}

.form-group {
  position: relative;
}

.form-row {
  display: flex;
  align-items: center;
  border-bottom: 2rpx solid #e5e7eb;
  padding: 8rpx 0;
  transition: border-color 0.3s ease;
}

.form-group:focus-within .form-row {
  border-color: var(--primary-color);
}

.form-icon {
  margin-right: 24rpx;
  font-size: 40rpx;
  color: var(--third-text-color);
  transition: color 0.3s ease;
}

.form-group:focus-within .form-icon {
  color: var(--primary-color);
}

.form-input {
  flex: 1;
  padding: 24rpx 0;
  font-size: 34rpx;
  font-weight: 500;
  color: inherit;
  background: transparent;
  border: 0;
  outline: none;
  appearance: none;
}

.login-action {
  padding-top: 80rpx;
}

:deep(.login-btn) {
  width: 100%;
  height: 112rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 32rpx;
  border: 2rpx solid transparent;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff !important;
  background: var(--primary-color) !important;
  letter-spacing: 0.025em;
  box-shadow: 0 20rpx 80rpx -20rpx rgba(100, 108, 255, 0.4);
  transition: all 0.3s ease;
}

:deep(.login-btn:hover) {
  background: #535bf2 !important;
}

:deep(.login-btn:active) {
  transform: scale(0.98);
}

:deep(.login-btn:focus-visible) {
  outline: none;
  box-shadow:
    0 0 0 4rpx rgba(100, 108, 255, 0.5),
    0 20rpx 80rpx -20rpx rgba(100, 108, 255, 0.4);
}

.login-footer {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 64rpx 0;
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));
  font-size: 20rpx;
  font-weight: 300;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--third-text-color);
  opacity: 0.7;
}
</style>
