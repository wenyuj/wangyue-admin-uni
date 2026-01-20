<script lang="ts" setup>
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import { getI18nText } from '@/tabbar/i18n'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%tabbar.me%',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const navTitle = computed(() => getI18nText('%tabbar.me%'))
const userInfo = computed(() => userStore.userInfo)

const profileLoading = ref(false)

// 个人资料卡展示字段
const displayName = computed(() => userInfo.value.nickName || userInfo.value.userName || '-')
const showUserId = computed(() => userInfo.value.userId > 0)
const userIdLabel = computed(() => (showUserId.value ? userInfo.value.userId : '-'))
const roleLabel = computed(() => getRoleLabel(userStore.roles?.[0] ?? userInfo.value.roleList?.[0]))

// 三宫格静态占位数据（后续可替换成接口数据）
const statCards = [
  { label: '待处理', value: 12 },
  { label: '消息', value: 5, alert: true },
  { label: '报表', value: 8 },
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

onShow(() => {
  refreshProfile()
})
</script>

<template>
  <view class="profile-page">
    <sar-navbar status-bar fixed :title="navTitle" />

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
          <view class="card profile-card" @click="openEditProfile">
            <view class="profile-accent" />
            <view class="profile-header">
              <view class="avatar-shell">
                <image :src="userInfo.avatar" mode="scaleToFill" class="avatar-image" />
              </view>

              <view class="profile-basic">
                <view class="display-name">
                  {{ displayName }}
                </view>
                <view class="role-title">
                  {{ roleLabel }}
                </view>
                <view v-if="showUserId" class="profile-meta">
                  <view class="meta-icon i-carbon-badge" />
                  <text class="meta-text">ID: {{ userIdLabel }}</text>
                </view>
              </view>

              <view class="profile-edit" @click.stop="openEditProfile">
                <view class="edit-icon i-carbon-edit" />
              </view>
            </view>

            <view v-if="showRefreshing" class="refreshing-tip">
              资料更新中...
            </view>
          </view>

          <!-- 三宫格统计 -->
          <view class="stats-grid">
            <view
              v-for="item in statCards"
              :key="item.label"
              class="stat-card"
              :class="{ 'stat-card--alert': item.alert }"
            >
              <view class="stat-value">
                {{ item.value }}
              </view>
              <view class="stat-label">
                {{ item.label }}
              </view>
            </view>
          </view>

          <!-- 功能列表 -->
          <sar-list card root-class="function-list">
            <sar-list-item
              title="修改密码"
              root-class="function-item"
              arrow
              hover
              @click="openChangePassword"
            >
              <template #icon>
                <view class="list-icon list-icon--primary">
                  <view class="i-carbon-locked" />
                </view>
              </template>
            </sar-list-item>
          </sar-list>

          <!-- 退出登录 -->
          <view class="logout-button" @click="handleLogout">
            退出登录
          </view>
        </template>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 页面基础变量与布局 */
.profile-page {
  min-height: 100vh;
  --card-bg: #ffffff;
  --border: #f1f5f9;
  --card-shadow: 0 6rpx 12rpx rgba(15, 23, 42, 0.06);
  --sar-navbar-bg: transparent;
  --sar-navbar-title-color: var(--text-color);
  --sar-navbar-item-color: var(--text-color);
  --sar-navbar-title-font-size: 32rpx;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.5;
}

.content {
  padding: 24rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
}

/* 通用卡片容器 */
.card {
  background: var(--card-bg);
  border-radius: 32rpx;
  padding: 40rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--card-shadow);
  margin-bottom: 24rpx;
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
  color: var(--text-color);
}

:deep(.login-btn) {
  width: 60%;
}

.profile-header {
  display: flex;
  gap: 32rpx;
  align-items: center;
  position: relative;
  z-index: 1;
}

.profile-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 160rpx;
  height: 160rpx;
  border-bottom-left-radius: 999rpx;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  background: rgba(var(--primary-color-rgb), 0.05);
  pointer-events: none;
}

.avatar-shell {
  width: 160rpx;
  height: 160rpx;
  border-radius: 999rpx;
  overflow: hidden;
  border: 4rpx solid #ffffff;
  background: rgba(148, 163, 184, 0.18);
  box-shadow: inset 0 0 0 1rpx rgba(15, 23, 42, 0.04);
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.profile-basic {
  flex: 1;
  min-width: 0;
}

.display-name {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-title {
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--primary-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-meta {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: var(--third-text-color);
}

.meta-icon {
  font-size: 26rpx;
  color: var(--third-text-color);
}

.meta-text {
  line-height: 1.4;
}

.profile-edit {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(var(--primary-color-rgb), 0.14);
  background: rgba(var(--primary-color-rgb), 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.profile-edit:active {
  background: rgba(var(--primary-color-rgb), 0.16);
  border-color: rgba(var(--primary-color-rgb), 0.24);
}

.edit-icon {
  font-size: 28rpx;
  color: var(--text-color);
}

.refreshing-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--third-text-color);
}

.profile-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  padding: 48rpx;
}

.profile-card:active {
  transform: translateY(2rpx);
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0 24rpx;
  color: var(--third-text-color);
}

.loading-text {
  font-size: 24rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 24rpx;
  border: 1rpx solid var(--border);
  padding: 32rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  box-shadow: var(--card-shadow);
  position: relative;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
  cursor: pointer;
}

.stat-card:active {
  border-color: rgba(var(--primary-color-rgb), 0.3);
  transform: translateY(2rpx);
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-card--alert::after {
  content: '';
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--danger-color);
  border: 2rpx solid var(--card-bg);
}

.stat-label {
  font-size: 24rpx;
  color: var(--third-text-color);
}

:deep(.function-list) {
  margin-bottom: 24rpx;
  --sar-list-border-color: var(--border);
  --sar-list-card-border-radius: 24rpx;
  --sar-list-item-padding-x: 32rpx;
  --sar-list-item-padding-y: 32rpx;
  --sar-list-item-bg: var(--card-bg);
  --sar-list-item-active-bg: #f8fafc;
  --sar-list-item-title-font-size: 28rpx;
  --sar-list-item-title-line-height: 1.4;
  --sar-list-item-arrow-font-size: 30rpx;
  --sar-list-item-arrow-color: var(--third-text-color);
  --sar-list-item-icon-margin-right: 24rpx;
}

:deep(.function-list .sar-list__content) {
  border-radius: 24rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

:deep(.function-item .sar-list-item__title) {
  font-weight: 600;
  color: var(--text-color);
}

.list-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.list-icon--primary {
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--primary-color);
}

:deep(.function-item:active .list-icon--primary) {
  background: var(--primary-color);
  color: #ffffff;
}

.logout-button {
  background: var(--card-bg);
  border-radius: 24rpx;
  border: 1rpx solid rgba(var(--danger-color-rgb), 0.3);
  padding: 28rpx 24rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--danger-color);
  box-shadow: var(--card-shadow);
  cursor: pointer;
}

.logout-button:active {
  background: rgba(var(--danger-color-rgb), 0.06);
}
</style>
