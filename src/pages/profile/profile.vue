<script lang="ts" setup>
import { dialog, toast } from 'sard-uniapp'
import i18n, { t } from '@/locale'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import { setTabbarItem } from '@/tabbar/i18n'

definePage({
  // 页面配置：自定义导航 + i18n 标题
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%tabbar.me%',
  },
})

// 用户与 token 状态
const userStore = useUserStore()
const tokenStore = useTokenStore()
// 用户信息响应式引用
const userInfo = computed(() => userStore.userInfo)

// 页面刷新状态
const profileLoading = ref(false)
// 当前语言与语言选择弹层状态
const currentLocale = ref(uni.getLocale())
const languageVisible = ref(false)
const languageValue = ref(currentLocale.value)

// 个人资料兜底（仅用于头像/ID）
const fallbackProfile = {
  id: '894-2201',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDLZdvNxwVHnetQj-jIRR_bg8GpPLoivQL5dYitM9nhPEpWRSM58Yhj7tO6R7TvZadRkyWJGOYWb2XpQtUzgtvn70d9OiHKPJxEzlFnLXonEfhl4DNjfpA1viEfE9dJ6Hud_CJurknq6mD9qi0ZHXnRmdzEquA5kynBbsfVeGSAyVDH7Lr_kC0ipf-BrToKI91YANKjxX0qCneFlz-JfJqCvsOp-Ast0gEISFJxodeiqY3lgaSrHRXD1CPbAhlDjgS-APSlpEh-YlE',
}

// 显式依赖 currentLocale，确保文案随语言切换更新
const fallbackName = computed(() => t('profile.fallback.name', { locale: currentLocale.value }))
const fallbackRole = computed(() => t('profile.fallback.role', { locale: currentLocale.value }))

// 个人资料卡展示字段
const displayName = computed(() => userInfo.value.nickName || userInfo.value.userName || fallbackName.value)
const userIdLabel = computed(() => (userInfo.value.userId > 0 ? String(userInfo.value.userId) : fallbackProfile.id))
const roleLabel = computed(() => {
  const label = getRoleLabel(userStore.roles?.[0] ?? userInfo.value.roleList?.[0])
  return label || fallbackRole.value
})
const avatarUrl = computed(() => userInfo.value.avatar || fallbackProfile.avatar)

// 三宫格静态占位数据（后续可替换成接口数据）
const statCards = [
  {
    id: 'pending',
    labelKey: 'profile.stats.pending',
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
    id: 'messages',
    labelKey: 'profile.stats.messages',
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
    id: 'reports',
    labelKey: 'profile.stats.reports',
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

// 页面加载展示逻辑
const profileReady = computed(() => userInfo.value.userId !== -1)
const showSkeleton = computed(() => profileLoading.value && !profileReady.value)
const showRefreshing = computed(() => profileLoading.value && profileReady.value)
// 语言选项与显示文本
const languageColumns = computed(() => [
  { label: t('locale.zhHans', { locale: currentLocale.value }), value: 'zh-Hans' },
  { label: t('locale.en', { locale: currentLocale.value }), value: 'en' },
])
const currentLocaleLabel = computed(() => {
  const locale = currentLocale.value
  const match = languageColumns.value.find(item => item.value === locale)
  return match?.label ?? locale
})
// 版本信息与展示文案
const versionInfo = {
  version: '2.4.0',
  build: '3902',
}
const versionLabel = computed(() => t('profile.version', { ...versionInfo, locale: currentLocale.value }))

// 角色字段标准化（避免空值/异常结构）
function getRoleLabel(role: unknown) {
  if (!role)
    return ''
  if (typeof role === 'string')
    return role
  const roleRecord = role as Record<string, unknown>
  const roleValue = roleRecord.roleName ?? roleRecord.name ?? roleRecord.roleKey ?? roleRecord.roleId
  if (roleValue === undefined || roleValue === null || roleValue === '')
    return ''
  return String(roleValue)
}

// 同步系统语言到页面与 i18n
function syncLocale() {
  const locale = uni.getLocale()
  currentLocale.value = locale
  languageValue.value = locale
  i18n.global.locale = locale
}

// 应用语言切换
function applyLocale(locale: string) {
  if (!locale)
    return
  // 需要同时更新 uni 与 vue-i18n，并刷新 tabbar 文案
  currentLocale.value = locale
  languageValue.value = locale
  uni.setLocale(locale)
  i18n.global.locale = locale
  setTabbarItem()
}

// 打开语言选择弹层
function openLanguagePicker() {
  if (profileLoading.value)
    return
  languageValue.value = currentLocale.value
  languageVisible.value = true
}

// 响应语言选择
function handleLocaleChange(value: string | string[]) {
  const nextLocale = Array.isArray(value) ? value[0] : value
  if (!nextLocale)
    return
  applyLocale(nextLocale)
}

// 刷新用户信息
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

// 前往登录页
function handleLogin() {
  uni.navigateTo({
    url: `${LOGIN_PAGE}?redirect=${encodeURIComponent('/pages/profile/profile')}`,
  })
}

// 退出登录确认
function handleLogout() {
  dialog.confirm({
    title: t('profile.logout.title'),
    message: t('profile.logout.confirm'),
    confirmText: t('profile.action.confirm'),
    cancelText: t('profile.action.cancel'),
    onConfirm: () => {
      tokenStore.logout()
      toast.success(t('profile.logout.success'))
    },
  })
}

// 页面可交互时再导航
function navigateWhenReady(url: string) {
  if (profileLoading.value)
    return
  uni.navigateTo({
    url,
  })
}

// 快捷入口
const openEditProfile = () => navigateWhenReady('/pages/profile/edit-profile')
const openChangePassword = () => navigateWhenReady('/pages/profile/change-password')

// 未开放功能提示
function showComingSoon(labelKey: string) {
  if (profileLoading.value)
    return
  const labelText = t(labelKey)
  toast(t('profile.comingSoon', { label: labelText }))
}

// 账户相关菜单
const accountItems = [
  { id: 'security', labelKey: 'profile.menu.accountSecurity', icon: 'i-carbon-security', action: openChangePassword },
  { id: 'notifications', labelKey: 'profile.menu.notifications', icon: 'i-carbon-notification', action: () => showComingSoon('profile.menu.notifications') },
  { id: 'language', labelKey: 'profile.menu.language', icon: 'i-carbon-language', action: openLanguagePicker },
]

// 支持相关菜单
const supportItems = [
  { id: 'help', labelKey: 'profile.menu.help', icon: 'i-carbon-help', action: () => showComingSoon('profile.menu.help') },
  { id: 'about', labelKey: 'profile.menu.about', icon: 'i-carbon-information', action: () => showComingSoon('profile.menu.about') },
]

// 页面显示时同步语言并刷新资料
onShow(() => {
  syncLocale()
  refreshProfile()
})
</script>

<template>
  <view class="profile-page">
    <view class="content">
      <!-- 未登录状态 -->
      <view v-if="!tokenStore.hasLogin" class="card login-card">
        <view class="login-title">
          {{ $t('profile.login.required') }}
        </view>
        <sar-button type="primary" root-class="login-btn" @click="handleLogin">
          {{ $t('profile.login.button') }}
        </sar-button>
      </view>

      <template v-else>
        <!-- 加载骨架 -->
        <view v-if="showSkeleton" class="loading-block">
          <sar-loading type="circular" />
          <text class="loading-text">{{ $t('profile.loading.profile') }}</text>
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
                <text class="meta-chip">{{ $t('profile.idLabel') }}: {{ userIdLabel }}</text>
                <text class="meta-action" @click.stop="openEditProfile">{{ $t('profile.action.view') }}</text>
              </view>
            </view>
          </view>

          <!-- 刷新提示 -->
          <view v-if="showRefreshing" class="refreshing-tip">
            {{ $t('profile.refreshing.profile') }}
          </view>

          <!-- 三宫格统计 -->
          <view class="stats-panel">
            <view
              v-for="item in statCards"
              :key="item.id"
              class="stats-item"
              :class="{ 'stats-item--alert': item.alert }"
              :style="{ '--tone-rgb': item.toneRgb }"
            >
              <view class="stat-label">
                {{ $t(item.labelKey) }}
              </view>
              <view class="stat-value">
                {{ item.value }}
              </view>
              <view class="stat-sparkline">
                <view
                  v-for="(bar, index) in item.bars"
                  :key="`${item.id}-${index}`"
                  class="stat-bar"
                  :style="{ 'height': `${bar.height}%`, '--bar-opacity': bar.opacity }"
                />
              </view>
            </view>
          </view>

          <!-- 账户分组 -->
          <view class="section-label">
            {{ $t('profile.section.account') }}
          </view>
          <view class="menu-section">
            <view
              v-for="item in accountItems"
              :key="item.id"
              class="menu-item"
              hover-class="menu-item--active"
              @click="item.action"
            >
              <view class="menu-icon" :class="item.icon" />
              <text class="menu-title">{{ $t(item.labelKey) }}</text>
              <text v-if="item.id === 'language'" class="menu-badge">{{ currentLocaleLabel }}</text>
              <view class="menu-arrow i-carbon-chevron-right" />
            </view>
          </view>

          <!-- 支持分组 -->
          <view class="section-label">
            {{ $t('profile.section.support') }}
          </view>
          <view class="menu-section">
            <view
              v-for="item in supportItems"
              :key="item.id"
              class="menu-item"
              hover-class="menu-item--active"
              @click="item.action"
            >
              <view class="menu-icon" :class="item.icon" />
              <text class="menu-title">{{ $t(item.labelKey) }}</text>
              <view class="menu-arrow i-carbon-chevron-right" />
            </view>
          </view>

          <!-- 退出登录 -->
          <view class="logout-button" @click="handleLogout">
            {{ $t('profile.action.logout') }}
          </view>

          <!-- 版本信息 -->
          <view class="version-text">
            {{ versionLabel }}
          </view>
        </template>
      </template>
    </view>

    <!-- 语言选择弹层 -->
    <sar-picker-popout
      v-model:visible="languageVisible"
      v-model="languageValue"
      :title="$t('profile.language.title')"
      :confirm-text="$t('profile.action.confirm')"
      :columns="languageColumns"
      @change="handleLocaleChange"
    />
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
  --profile-primary-dark: #535bf2;
  --profile-success: #10b981;
  --profile-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.content {
  width: 100%;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
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
  color: var(--primary-color);
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
  color: var(--primary-color);
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
  background: var(--danger-color);
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
  color: var(--primary-color);
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
  color: var(--danger-color);
  margin-top: 48rpx;
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
