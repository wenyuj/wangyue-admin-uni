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
const safeTopRpx = ref(0)

const profileSectionPaddingTop = computed(() => `${48 + safeTopRpx.value}rpx`)

// 个人资料卡展示字段
const displayName = computed(() => {
  if (!tokenStore.hasLogin)
    return t('profile.login.required')
  return userInfo.value.nickName || userInfo.value.userName
})
const roleLabels = computed(() => (userInfo.value.roleList ?? [])
  .map(role => getRoleLabel(role))
  .filter(Boolean))
const avatarUrl = computed(() => userInfo.value.avatar || '/static/images/default-avatar.png')

// 三宫格静态占位数据（后续可替换成接口数据）
const statCards = [
  {
    id: 'pending',
    labelKey: 'profile.stats.pending',
    value: 12,
  },
  {
    id: 'messages',
    labelKey: 'profile.stats.messages',
    value: 5,
    alert: true,
  },
  {
    id: 'reports',
    labelKey: 'profile.stats.reports',
    value: 8,
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
  version: '1.0.0',
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

function updateSafeTop() {
  const { statusBarHeight = 0, screenWidth = 375 } = uni.getSystemInfoSync()
  safeTopRpx.value = screenWidth ? Math.round(statusBarHeight * 750 / screenWidth) : 0
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
      uni.redirectTo({
        url: `${LOGIN_PAGE}?redirect=${encodeURIComponent('/pages/profile/profile')}`,
      })
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
  updateSafeTop()
})
</script>

<template>
  <view class="profile-page">
    <view class="content">
      <!-- 加载骨架 -->
      <view v-if="showSkeleton" class="loading-block">
        <sar-loading type="circular" />
        <text class="loading-text">{{ $t('profile.loading.profile') }}</text>
      </view>

      <template v-else>
        <!-- 个人资料卡片 -->
        <view class="profile-hero" :style="{ paddingTop: profileSectionPaddingTop }">
          <view class="hero-layer hero-layer--glow hero-layer--glow-right" />
          <view class="hero-layer hero-layer--glow hero-layer--glow-left" />
          <view class="hero-content">
            <view class="profile-section" @click="openEditProfile">
              <view class="profile-avatar">
                <view class="avatar-glow" />
                <view class="avatar-card">
                  <view class="avatar-frame">
                    <image :src="avatarUrl" mode="aspectFill" class="avatar-image" />
                  </view>
                  <view class="avatar-status">
                    <view class="status-dot" />
                  </view>
                </view>
              </view>
              <view class="profile-basic">
                <view class="display-name">
                  {{ displayName }}
                </view>
                <view class="profile-meta">
                  <view v-if="roleLabels.length" class="role-list">
                    <text
                      v-for="(role, index) in roleLabels"
                      :key="`${role}-${index}`"
                      class="role-chip"
                    >
                      {{ role }}
                    </text>
                  </view>
                </view>
              </view>
              <view class="profile-action">
                <view class="profile-action-icon i-carbon-edit" />
              </view>
            </view>

            <!-- 三宫格统计 -->
            <view class="stats-panel">
              <view
                v-for="item in statCards"
                :key="item.id"
                class="stats-item"
                :class="{ 'stats-item--alert': item.alert }"
              >
                <view class="stat-value">
                  {{ item.value }}
                </view>
                <view class="stat-label">
                  {{ $t(item.labelKey) }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 刷新提示 -->
        <view v-if="showRefreshing" class="refreshing-tip">
          {{ $t('profile.refreshing.profile') }}
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
            <view class="menu-icon">
              <view class="menu-icon__glyph" :class="item.icon" />
            </view>
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
            <view class="menu-icon">
              <view class="menu-icon__glyph" :class="item.icon" />
            </view>
            <text class="menu-title">{{ $t(item.labelKey) }}</text>
            <view class="menu-arrow i-carbon-chevron-right" />
          </view>
        </view>

        <!-- 退出登录 -->
        <view class="logout-button" @click="handleLogout">
          <view class="logout-icon i-carbon-logout" />
          <text class="logout-text">{{ $t('profile.action.logout') }}</text>
        </view>

        <!-- 版本信息 -->
        <view class="version-text">
          {{ versionLabel }}
        </view>
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
  color: var(--text-color);
  line-height: 1.5;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
  --profile-bg: var(--bg-color);
  --profile-card: #ffffff;
  --profile-card-rgb: 255, 255, 255;
  --profile-soft-bg: #f8fafc;
  --profile-avatar-bg: #e2e8f0;
  --profile-border: rgba(226, 232, 240, 0.7);
  --profile-border-strong: rgba(226, 232, 240, 0.8);
  --profile-border-stronger: rgba(226, 232, 240, 0.9);
  --profile-divider: rgba(226, 232, 240, 0.5);
  --profile-hero-bg: linear-gradient(
    180deg,
    rgba(var(--primary-color-rgb), 0.08) 0%,
    rgba(var(--bg-color-rgb), 1) 100%
  );
  --profile-hero-shadow: 0 40rpx 100rpx -24rpx rgba(var(--primary-color-rgb), 0.1);
}

.profile-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(
    0deg,
    var(--profile-bg) 0%,
    rgba(var(--bg-color-rgb), 0.82) 60%,
    rgba(var(--bg-color-rgb), 0) 100%
  );
}

.content {
  width: 100%;
  position: relative;
  z-index: 1;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 40rpx;
  color: var(--secondary-text-color);
}

.loading-text {
  font-size: 24rpx;
}

.profile-hero {
  position: relative;
  overflow: hidden;
  padding: 0 40rpx 48rpx;
  border-bottom-left-radius: 72rpx;
  border-bottom-right-radius: 72rpx;
  background: var(--profile-hero-bg);
  box-shadow: var(--profile-hero-shadow);
}

.hero-layer {
  position: absolute;
  pointer-events: none;
}

.hero-layer--glow {
  border-radius: 999rpx;
  filter: blur(80rpx);
  mix-blend-mode: multiply;
}

.hero-layer--glow-right {
  width: 80%;
  height: 80%;
  right: -20%;
  top: -20%;
  background: rgba(var(--primary-color-rgb), 0.1);
  animation: hero-pulse 8s ease-in-out infinite;
}

.hero-layer--glow-left {
  width: 60%;
  height: 60%;
  left: -10%;
  top: 10%;
  background: rgba(var(--primary-color-rgb), 0.05);
  filter: blur(60rpx);
}

@keyframes hero-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.02);
    opacity: 0.9;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding-top: 24rpx;
}

.profile-section:active {
  opacity: 0.85;
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-glow {
  position: absolute;
  inset: 0;
  border-radius: 38rpx;
  background: rgba(var(--primary-color-rgb), 0.2);
  filter: blur(40rpx);
  transform: scale(0.9) translateY(8rpx);
}

.avatar-card {
  width: 160rpx;
  height: 160rpx;
  border-radius: 45rpx;
  padding: 10rpx;
  background: var(--profile-card);
  border: 2rpx solid rgba(var(--profile-card-rgb), 0.6);
  box-shadow:
    0 32rpx 40rpx -8rpx rgba(15, 23, 42, 0.12),
    0 16rpx 16rpx -8rpx rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.avatar-frame {
  width: 100%;
  height: 100%;
  border-radius: 35rpx;
  overflow: hidden;
  background: var(--profile-avatar-bg);
  box-sizing: border-box;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-status {
  position: absolute;
  bottom: -8rpx;
  right: -8rpx;
  background: var(--profile-card);
  border-radius: 999rpx;
  padding: 6rpx;
  border: 2rpx solid var(--profile-border-stronger);
  box-shadow: 0 6rpx 12rpx rgba(15, 23, 42, 0.12);
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background: #10b981;
  border: 4rpx solid var(--profile-card);
}

.profile-basic {
  flex: 1;
  min-width: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 10rpx;
}

.display-name {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16rpx;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.role-chip {
  font-size: 20rpx;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2rpx;
  background: rgba(var(--profile-card-rgb), 0.65);
  border: 1rpx solid var(--profile-border-strong);
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.profile-action {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.08);
  border: 1rpx solid rgba(var(--primary-color-rgb), 0.3);
}

.profile-action:active {
  background: rgba(var(--primary-color-rgb), 0.16);
}

.profile-action-icon {
  width: 28rpx;
  height: 28rpx;
  font-size: 28rpx;
}

.refreshing-tip {
  margin: 16rpx 40rpx 0;
  font-size: 22rpx;
  color: var(--secondary-text-color);
}

.stats-panel {
  margin-top: 48rpx;
  margin-left: -12rpx;
  margin-right: -12rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 12rpx;
}

.stats-item {
  padding: 12rpx 4rpx 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  position: relative;
  transition: color 0.2s ease;
  cursor: pointer;
}

.stats-item:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6rpx;
  bottom: 6rpx;
  width: 1rpx;
  background: var(--profile-border-strong);
}

.stats-item--alert::after {
  content: '';
  position: absolute;
  top: 4rpx;
  right: 12rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--danger-color);
  border: 2rpx solid rgba(var(--profile-card-rgb), 0.9);
}

.stat-label {
  font-size: 18rpx;
  font-weight: 700;
  color: var(--third-text-color);
  letter-spacing: 4rpx;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: color 0.2s ease;
}

.stats-item:active .stat-value,
.stats-item:active .stat-label {
  color: var(--primary-color);
}

@media (hover: hover) {
  .stats-item:hover .stat-value,
  .stats-item:hover .stat-label {
    color: var(--primary-color);
  }
}

.section-label {
  padding: 32rpx 40rpx 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--third-text-color);
  letter-spacing: 6rpx;
  text-transform: uppercase;
}

.menu-section {
  background: var(--profile-card);
  border-top: 1rpx solid var(--profile-border);
  border-bottom: 1rpx solid var(--profile-border);
  margin-bottom: 20rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx 40rpx;
  border-bottom: 1rpx solid var(--profile-divider);
  transition: background-color 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item--active {
  background: var(--profile-soft-bg);
}

.menu-item--active .menu-icon {
  transform: scale(1.05);
}

.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: rgba(var(--primary-color-rgb), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.menu-icon__glyph {
  width: 40rpx;
  height: 40rpx;
  color: var(--primary-color);
  font-size: 40rpx;
}

.menu-title {
  flex: 1;
  font-size: 28rpx;
}

.menu-badge {
  font-size: 24rpx;
  color: #64748b;
  background: var(--profile-soft-bg);
  border: 1rpx solid var(--profile-border-strong);
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  margin-right: 12rpx;
}

.menu-arrow {
  font-size: 32rpx;
  color: #cbd5e1;
}

.logout-button {
  margin: 64rpx 48rpx 0;
  padding: 32rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: rgba(var(--danger-color-rgb), 0.9);
  background: var(--profile-card);
  border: 1rpx solid rgba(var(--danger-color-rgb), 0.12);
  border-radius: 24rpx;
  letter-spacing: 5rpx;
  text-transform: uppercase;
  box-shadow: 0 6rpx 12rpx rgba(15, 23, 42, 0.06);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.logout-button:active {
  background: rgba(var(--danger-color-rgb), 0.08);
  border-color: rgba(var(--danger-color-rgb), 0.2);
  transform: scale(0.98);
}

@media (hover: hover) {
  .logout-button:hover {
    background: rgba(var(--danger-color-rgb), 0.08);
    border-color: rgba(var(--danger-color-rgb), 0.2);
  }
}

.logout-icon {
  width: 32rpx;
  height: 32rpx;
  font-size: 32rpx;
}

.logout-text {
  font-size: 26rpx;
  font-weight: 700;
}

.version-text {
  padding: 24rpx 40rpx 40rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--third-text-color);
  font-family: 'SFMono-Regular', 'Menlo', 'Courier New', monospace;
  letter-spacing: 6rpx;
  text-transform: uppercase;
  opacity: 0.6;
}
</style>
