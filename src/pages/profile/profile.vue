<script lang="ts" setup>
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%tabbar.me%',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const userInfo = computed(() => userStore.userInfo)

const profileLoading = ref(false)

const fallbackProfile = {
  name: 'Admin User',
  role: 'Senior Manager',
  id: '894-2201',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDLZdvNxwVHnetQj-jIRR_bg8GpPLoivQL5dYitM9nhPEpWRSM58Yhj7tO6R7TvZadRkyWJGOYWb2XpQtUzgtvn70d9OiHKPJxEzlFnLXonEfhl4DNjfpA1viEfE9dJ6Hud_CJurknq6mD9qi0ZHXnRmdzEquA5kynBbsfVeGSAyVDH7Lr_kC0ipf-BrToKI91YANKjxX0qCneFlz-JfJqCvsOp-Ast0gEISFJxodeiqY3lgaSrHRXD1CPbAhlDjgS-APSlpEh-YlE',
}

// 个人资料卡展示字段
const displayName = computed(() => userInfo.value.nickName || userInfo.value.userName || fallbackProfile.name)
const userIdLabel = computed(() => (userInfo.value.userId > 0 ? String(userInfo.value.userId) : fallbackProfile.id))
const roleLabel = computed(() => {
  const label = getRoleLabel(userStore.roles?.[0] ?? userInfo.value.roleList?.[0])
  return label === '暂无角色' ? fallbackProfile.role : label
})
const avatarUrl = computed(() => userInfo.value.avatar || fallbackProfile.avatar)

// 三宫格静态占位数据（后续可替换成接口数据）
const statCards = [
  {
    label: '待处理',
    value: 12,
    toneRgb: '32, 128, 240',
    bars: [
      { height: 40, opacity: 0.4 },
      { height: 60, opacity: 0.6 },
      { height: 30, opacity: 0.4 },
      { height: 80, opacity: 1 },
      { height: 50, opacity: 0.6 },
    ],
  },
  {
    label: '消息',
    value: 5,
    alert: true,
    toneRgb: '245, 34, 45',
    bars: [
      { height: 20, opacity: 0.3 },
      { height: 40, opacity: 0.4 },
      { height: 90, opacity: 1 },
      { height: 60, opacity: 0.5 },
      { height: 70, opacity: 0.6 },
    ],
  },
  {
    label: '报表',
    value: 8,
    toneRgb: '16, 185, 129',
    bars: [
      { height: 30, opacity: 0.3 },
      { height: 50, opacity: 0.4 },
      { height: 40, opacity: 0.3 },
      { height: 70, opacity: 0.8 },
      { height: 80, opacity: 1 },
    ],
  },
]

const profileReady = computed(() => userInfo.value.userId !== -1)
const showSkeleton = computed(() => profileLoading.value && !profileReady.value)
const showRefreshing = computed(() => profileLoading.value && profileReady.value)

function getRoleLabel(role: unknown) {
  if (!role)
    return '暂无角色'
  if (typeof role === 'string')
    return role
  const roleRecord = role as Record<string, unknown>
  const roleValue = roleRecord.roleName ?? roleRecord.name ?? roleRecord.roleKey ?? roleRecord.roleId
  if (roleValue === undefined || roleValue === null || roleValue === '')
    return '暂无角色'
  return String(roleValue)
}

async function refreshProfile() {
  if (!tokenStore.hasLogin)
    return
  profileLoading.value = true
  try {
    await userStore.refreshUserInfo()
  }
  finally {
    profileLoading.value = false
  }
}

function handleLogin() {
  uni.navigateTo({
    url: `${LOGIN_PAGE}?redirect=${encodeURIComponent('/pages/profile/profile')}`,
  })
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        tokenStore.logout()
        uni.showToast({
          title: '退出登录成功',
          icon: 'success',
        })
      }
    },
  })
}

function navigateWhenReady(url: string) {
  if (profileLoading.value)
    return
  uni.navigateTo({
    url,
  })
}

const openEditProfile = () => navigateWhenReady('/pages/profile/edit-profile')
const openChangePassword = () => navigateWhenReady('/pages/profile/change-password')

function showComingSoon(label: string) {
  if (profileLoading.value)
    return
  uni.showToast({
    title: `${label}暂未开放`,
    icon: 'none',
  })
}

const accountItems = [
  { label: '账号安全', icon: 'i-carbon-security', action: openChangePassword },
  { label: '通知设置', icon: 'i-carbon-notification', action: () => showComingSoon('通知设置') },
  { label: '语言', icon: 'i-carbon-language', value: 'EN', action: () => showComingSoon('语言') },
]

const supportItems = [
  { label: '帮助与支持', icon: 'i-carbon-help', action: () => showComingSoon('帮助与支持') },
  { label: '关于', icon: 'i-carbon-information', action: () => showComingSoon('关于') },
]

const versionLabel = 'Version 2.4.0 (Build 3902)'

onShow(() => {
  refreshProfile()
})
</script>

<template>
  <view class="profile-page">
    <sar-navbar status-bar fixed title="" />
    <view class="content">
      <view v-if="!tokenStore.hasLogin" class="card login-card">
        <view class="login-title">
          请先登录
        </view>
        <sar-button type="primary" root-class="login-btn" @click="handleLogin">
          登录
        </sar-button>
      </view>

      <template v-else>
        <view v-if="showSkeleton" class="loading-block">
          <sar-loading type="circular" />
          <text class="loading-text">正在加载个人信息</text>
        </view>

        <template v-else>
          <!-- 个人资料卡片 -->
          <view class="profile-section" @click="openEditProfile">
            <view class="profile-avatar">
              <view class="avatar-ring">
                <view class="avatar-inner">
                  <image :src="avatarUrl" mode="aspectFill" class="avatar-image" />
                </view>
              </view>
              <view class="avatar-edit" @click.stop="openEditProfile">
                <view class="edit-icon i-carbon-edit" />
              </view>
            </view>

            <view class="profile-basic">
              <view class="display-name">
                {{ displayName }}
              </view>
              <view class="role-title">
                {{ roleLabel }}
              </view>
              <view class="profile-meta">
                <text class="meta-chip">ID: {{ userIdLabel }}</text>
                <text class="meta-action" @click.stop="openEditProfile">查看</text>
              </view>
            </view>
          </view>

          <view v-if="showRefreshing" class="refreshing-tip">
            资料更新中...
          </view>

          <!-- 三宫格统计 -->
          <view class="stats-panel">
            <view
              v-for="item in statCards"
              :key="item.label"
              class="stats-item"
              :class="{ 'stats-item--alert': item.alert }"
              :style="{ '--tone-rgb': item.toneRgb }"
            >
              <view class="stat-label">
                {{ item.label }}
              </view>
              <view class="stat-value">
                {{ item.value }}
              </view>
              <view class="stat-sparkline">
                <view
                  v-for="(bar, index) in item.bars"
                  :key="`${item.label}-${index}`"
                  class="stat-bar"
                  :style="{ 'height': `${bar.height}%`, '--bar-opacity': bar.opacity }"
                />
              </view>
            </view>
          </view>

          <view class="section-label">
            账户
          </view>
          <view class="menu-section">
            <view
              v-for="item in accountItems"
              :key="item.label"
              class="menu-item"
              hover-class="menu-item--active"
              @click="item.action"
            >
              <view class="menu-icon" :class="item.icon" />
              <text class="menu-title">{{ item.label }}</text>
              <text v-if="item.value" class="menu-badge">{{ item.value }}</text>
              <view class="menu-arrow i-carbon-chevron-right" />
            </view>
          </view>

          <view class="section-label">
            支持
          </view>
          <view class="menu-section">
            <view
              v-for="item in supportItems"
              :key="item.label"
              class="menu-item"
              hover-class="menu-item--active"
              @click="item.action"
            >
              <view class="menu-icon" :class="item.icon" />
              <text class="menu-title">{{ item.label }}</text>
              <view class="menu-arrow i-carbon-chevron-right" />
            </view>
          </view>

          <!-- 退出登录 -->
          <view class="logout-button" @click="handleLogout">
            退出登录
          </view>

          <view class="version-text">
            {{ versionLabel }}
          </view>
        </template>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--profile-bg);
  color: var(--profile-text-main);
  line-height: 1.5;
  font-family: 'Plus Jakarta Sans', sans-serif;
  --profile-bg: #f1f5f9;
  --profile-card: #ffffff;
  --profile-border: #e2e8f0;
  --profile-border-soft: rgba(226, 232, 240, 0.5);
  --profile-text-main: #1e293b;
  --profile-text-sub: #64748b;
  --profile-primary: #646cff;
  --profile-primary-dark: #535bf2;
  --profile-info: #2080f0;
  --profile-success: #10b981;
  --profile-danger: #f5222d;
  --profile-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
  --sar-navbar-bg: rgba(255, 255, 255, 0.95);
  --sar-navbar-title-color: var(--profile-text-main);
  --sar-navbar-item-color: var(--profile-text-main);
  --sar-navbar-title-font-size: 32rpx;
}

.content {
  width: 100%;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

:deep(.sar-navbar__fixation) {
  backdrop-filter: blur(16rpx);
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
}

.card {
  background: var(--profile-card);
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  border: 1rpx solid var(--profile-border);
  box-shadow: var(--profile-shadow);
  margin: 32rpx 0 24rpx;
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 48rpx 24rpx;
}

.login-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--profile-text-main);
}

:deep(.login-btn) {
  width: 60%;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 40rpx;
  color: var(--profile-text-sub);
}

.loading-text {
  font-size: 24rpx;
}

.profile-section {
  background: var(--profile-card);
  padding: 48rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 32rpx;
  border-bottom: 1rpx solid var(--profile-border-soft);
}

.profile-section:active {
  background: #f8fafc;
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-ring {
  width: 144rpx;
  height: 144rpx;
  border-radius: 999rpx;
  padding: 4rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4rpx 8rpx rgba(15, 23, 42, 0.06);
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 999rpx;
  overflow: hidden;
  background: #e2e8f0;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-edit {
  position: absolute;
  right: -6rpx;
  bottom: -6rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 8rpx rgba(15, 23, 42, 0.08);
}

.avatar-edit:active {
  background: #f8fafc;
}

.edit-icon {
  font-size: 24rpx;
  color: var(--profile-primary);
}

.profile-basic {
  flex: 1;
  min-width: 0;
}

.display-name {
  font-size: 38rpx;
  font-weight: 700;
  font-family: 'Playfair Display', serif;
  color: var(--profile-text-main);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-title {
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--profile-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-meta {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.meta-chip {
  font-size: 20rpx;
  font-family: 'SFMono-Regular', 'Menlo', 'Courier New', monospace;
  color: #94a3b8;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.meta-action {
  font-size: 20rpx;
  font-weight: 600;
  color: var(--profile-primary);
  letter-spacing: 2rpx;
  text-transform: uppercase;
}

.meta-action:active {
  color: var(--profile-primary-dark);
}

.refreshing-tip {
  margin: 12rpx 40rpx 0;
  font-size: 22rpx;
  color: var(--profile-text-sub);
}

.stats-panel {
  background: var(--profile-card);
  border-top: 1rpx solid var(--profile-border-soft);
  border-bottom: 1rpx solid var(--profile-border-soft);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 24rpx;
}

.stats-item {
  padding: 36rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  position: relative;
}

.stats-item:not(:first-child) {
  border-left: 1rpx solid rgba(226, 232, 240, 0.7);
}

.stats-item--alert::after {
  content: '';
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--profile-danger);
  border: 2rpx solid #ffffff;
}

.stat-label {
  font-size: 20rpx;
  font-weight: 700;
  color: var(--profile-text-sub);
  letter-spacing: 4rpx;
  text-transform: uppercase;
}

.stat-value {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--profile-text-main);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-sparkline {
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
  height: 36rpx;
  opacity: 0.8;
}

.stat-bar {
  width: 6rpx;
  border-radius: 2rpx;
  background-color: rgba(var(--tone-rgb), var(--bar-opacity, 1));
}

.section-label {
  padding: 24rpx 40rpx 12rpx;
  font-size: 20rpx;
  font-weight: 700;
  color: var(--profile-text-sub);
  letter-spacing: 4rpx;
  text-transform: uppercase;
}

.menu-section {
  background: var(--profile-card);
  border-top: 1rpx solid var(--profile-border-soft);
  border-bottom: 1rpx solid var(--profile-border-soft);
  margin-bottom: 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.6);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item--active {
  background: #f8fafc;
}

.menu-item--active .menu-icon {
  color: var(--profile-primary);
}

.menu-icon {
  font-size: 44rpx;
  color: var(--profile-text-sub);
}

.menu-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  color: var(--profile-text-main);
}

.menu-badge {
  font-size: 20rpx;
  color: var(--profile-text-sub);
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  margin-right: 8rpx;
}

.menu-arrow {
  font-size: 32rpx;
  color: #cbd5e1;
}

.logout-button {
  background: var(--profile-card);
  border-top: 1rpx solid var(--profile-border-soft);
  border-bottom: 1rpx solid var(--profile-border-soft);
  padding: 32rpx 24rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--profile-danger);
  margin-top: 16rpx;
}

.logout-button:active {
  background: #fef2f2;
}

.version-text {
  padding: 24rpx 40rpx 40rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--profile-text-sub);
  font-family: 'SFMono-Regular', 'Menlo', 'Courier New', monospace;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  opacity: 0.6;
}
</style>
