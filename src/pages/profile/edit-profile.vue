<script lang="ts" setup>
import type { UserGender } from '@/api/types/login'
import { toast } from 'sard-uniapp'
import { updateUserProfile } from '@/api/methods/auth'
import { t } from '@/locale'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import { handleBack } from '@/utils'
import { uploadFileUrl, useUpload } from '@/utils/uploadFile'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%profile.edit.title%',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const currentLocale = ref(uni.getLocale())

const formRef = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const avatarUploading = ref(false)

const navTitle = computed(() => t('profile.edit.title', { locale: currentLocale.value }))
const avatarUrl = computed(() => userStore.userInfo.avatar || '')

const form = reactive({
  nickName: '',
  sex: '0' as UserGender,
  phoneNumber: '',
  email: '',
})

const sexOptions = computed(() => [
  { label: t('profile.edit.form.gender.male', { locale: currentLocale.value }), value: '0' },
  { label: t('profile.edit.form.gender.female', { locale: currentLocale.value }), value: '1' },
])

const rules = computed(() => ({
  nickName: [{ required: true, message: t('profile.edit.form.nickname.required', { locale: currentLocale.value }) }],
  sex: [{ required: true, message: t('profile.edit.form.gender.required', { locale: currentLocale.value }) }],
}))

const avatarActionText = computed(() => {
  const key = avatarUploading.value ? 'profile.edit.avatar.uploading' : 'profile.edit.avatar.change'
  return t(key, { locale: currentLocale.value })
})

function syncForm() {
  const info = userStore.userInfo
  form.nickName = info.nickName || ''
  form.sex = (info.sex || '0') as UserGender
  form.phoneNumber = info.phoneNumber || ''
  form.email = info.email || ''
}

async function refreshProfile() {
  if (!tokenStore.hasLogin)
    return
  loading.value = true
  try {
    await userStore.refreshUserInfo()
    syncForm()
  }
  finally {
    loading.value = false
  }
}

function handleLogin() {
  uni.navigateTo({
    url: `${LOGIN_PAGE}?redirect=${encodeURIComponent('/pages/profile/edit-profile')}`,
  })
}

function syncLocale() {
  currentLocale.value = uni.getLocale()
}

async function handleSave() {
  if (saving.value)
    return
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }
  saving.value = true
  try {
    await updateUserProfile({ ...form })
    toast.success(t('profile.edit.save.success'))
    await userStore.refreshUserInfo()
    syncForm()
    uni.navigateBack()
  }
  finally {
    saving.value = false
  }
}

const avatarUploadOptions = {
  fileFieldName: 'avatarFile',
  onSuccess: async () => {
    toast.success(t('profile.edit.avatar.update.success'))
    await userStore.refreshUserInfo()
    syncForm()
  },
  onError: () => {
    toast.fail(t('profile.edit.avatar.update.failed'))
  },
  onComplete: () => {
    avatarUploading.value = false
  },
}

const { run: pickAvatar } = useUpload(uploadFileUrl.USER_AVATAR, {}, avatarUploadOptions)

function handleAvatarUpload() {
  if (avatarUploading.value)
    return
  avatarUploading.value = true
  pickAvatar()
}

// #ifdef MP-WEIXIN
function onChooseAvatar(e: any) {
  const avatarUrl = e?.detail?.avatarUrl
  if (!avatarUrl || avatarUploading.value)
    return
  avatarUploading.value = true
  const { run } = useUpload(uploadFileUrl.USER_AVATAR, {}, avatarUploadOptions, avatarUrl)
  run()
}
// #endif

onShow(() => {
  syncLocale()
  refreshProfile()
})
</script>

<template>
  <view class="page">
    <sar-navbar status-bar show-back fixed :title="navTitle" back-text="" @back="handleBack" />

    <view class="content">
      <view v-if="!tokenStore.hasLogin" class="login-card">
        <view class="login-title">
          {{ $t('profile.login.required') }}
        </view>
        <sar-button type="default" theme="primary" root-class="login-btn" @click="handleLogin">
          {{ $t('profile.login.button') }}
        </sar-button>
      </view>

      <template v-else>
        <view v-if="loading" class="loading-block">
          <sar-loading type="circular" />
          <text class="loading-text">{{ $t('profile.edit.loading') }}</text>
        </view>

        <template v-else>
          <view class="avatar-section">
            <view class="avatar-wrapper">
              <view class="avatar-frame">
                <image v-if="avatarUrl" :src="avatarUrl" mode="aspectFill" class="avatar-image" />
                <view v-else class="avatar-placeholder i-carbon-user" />
              </view>
              <view class="avatar-edit">
                <view class="i-carbon-edit" />
              </view>
              <!-- #ifndef MP-WEIXIN -->
              <view class="avatar-overlay" @click="handleAvatarUpload" />
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <button
                class="avatar-overlay"
                open-type="chooseAvatar"
                :disabled="avatarUploading"
                @chooseavatar="onChooseAvatar"
              />
              <!-- #endif -->
            </view>
            <view class="avatar-actions">
              <!-- #ifdef MP-WEIXIN -->
              <button
                class="avatar-change-btn"
                open-type="chooseAvatar"
                :disabled="avatarUploading"
                @chooseavatar="onChooseAvatar"
              >
                {{ avatarActionText }}
              </button>
              <!-- #endif -->
              <!-- #ifndef MP-WEIXIN -->
              <sar-button
                type="text"
                theme="primary"
                inline
                root-class="avatar-change-btn"
                :loading="avatarUploading"
                @click="handleAvatarUpload"
              >
                {{ avatarActionText }}
              </sar-button>
              <!-- #endif -->
            </view>
            <view class="avatar-tip">
              {{ $t('profile.edit.avatar.tip') }}
            </view>
          </view>

          <view class="section-label">
            {{ $t('profile.edit.section.basic') }}
          </view>

          <view class="form-section">
            <sar-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-width="160rpx"
              direction="horizontal"
              content-position="right"
              root-class="form-root"
            >
              <sar-form-item name="nickName" :label="$t('profile.edit.form.nickname.label')" required root-class="form-item">
                <sar-input
                  v-model="form.nickName"
                  :placeholder="$t('profile.edit.form.nickname.placeholder')"
                  inlaid
                  root-class="form-input"
                />
              </sar-form-item>
              <sar-form-item name="sex" :label="$t('profile.edit.form.gender.label')" required root-class="form-item">
                <sar-radio-group
                  v-model="form.sex"
                  :options="sexOptions"
                  direction="horizontal"
                  root-class="form-radio-group"
                />
              </sar-form-item>
              <sar-form-item name="phoneNumber" :label="$t('profile.edit.form.phone.label')" root-class="form-item">
                <sar-input
                  v-model="form.phoneNumber"
                  :placeholder="$t('profile.edit.form.phone.placeholder')"
                  inputmode="tel"
                  inlaid
                  root-class="form-input"
                />
              </sar-form-item>
              <sar-form-item name="email" :label="$t('profile.edit.form.email.label')" root-class="form-item">
                <sar-input
                  v-model="form.email"
                  :placeholder="$t('profile.edit.form.email.placeholder')"
                  inputmode="email"
                  inlaid
                  root-class="form-input"
                />
              </sar-form-item>
            </sar-form>
          </view>

          <view class="form-tip">
            {{ $t('profile.edit.form.tip') }}
          </view>

          <view class="footer">
            <sar-button
              type="default"
              theme="primary"
              root-class="save-btn"
              :loading="saving"
              @click="handleSave"
            >
              {{ $t('profile.edit.save.button') }}
            </sar-button>
          </view>
        </template>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f8f9fa;
  color: #111827;
  line-height: 1.5;
  font-family: 'Noto Sans SC', 'Inter', sans-serif;
  --edit-primary-hover: #535bf2;
  --edit-border: #e5e7eb;
  --edit-text-main: #111827;
  --edit-text-sub: #6b7280;
  --sar-navbar-bg: rgba(255, 255, 255, 0.95);
  --sar-navbar-title-color: var(--edit-text-main);
  --sar-navbar-item-color: var(--edit-text-main);
  --sar-navbar-title-font-size: 32rpx;
}

.content {
  min-height: calc(100vh - var(--sar-navbar-height) - env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  background: #ffffff;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}

:deep(.sar-navbar__fixation) {
  backdrop-filter: blur(16rpx);
  border-bottom: 1rpx solid var(--edit-border);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  margin: 32rpx;
  padding: 48rpx 24rpx;
  border-radius: 16rpx;
  border: 1rpx solid var(--edit-border);
  background: #ffffff;
}

.login-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--edit-text-main);
}

:deep(.login-btn) {
  width: 60%;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 40rpx 32rpx;
  color: var(--edit-text-sub);
}

.loading-text {
  font-size: 24rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 32rpx 48rpx;
  border-bottom: 1rpx solid var(--edit-border);
}

.avatar-wrapper {
  position: relative;
  width: 192rpx;
  height: 192rpx;
}

.avatar-frame {
  width: 100%;
  height: 100%;
  border-radius: 999rpx;
  overflow: hidden;
  border: 2rpx solid #f8f9fa;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 8rpx rgba(15, 23, 42, 0.06);
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  font-size: 64rpx;
  color: #9ca3af;
}

.avatar-edit {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #ffffff;
  color: #ffffff;
  box-shadow: 0 4rpx 8rpx rgba(15, 23, 42, 0.12);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 999rpx;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
}

.avatar-overlay::after {
  border: none;
}

.avatar-actions {
  margin-top: 16rpx;
}

:deep(.avatar-change-btn) {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 24rpx;
  font-weight: 500;
  color: var(--primary-color);
}

.avatar-change-btn:active {
  color: var(--edit-primary-hover);
}

.avatar-change-btn:disabled {
  opacity: 0.6;
}

.avatar-tip {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--edit-text-sub);
}

.section-label {
  padding: 24rpx 32rpx;
  background: rgba(248, 249, 250, 0.7);
  border-bottom: 1rpx solid var(--edit-border);
  font-size: 22rpx;
  font-weight: 600;
  color: var(--edit-text-sub);
  letter-spacing: 2rpx;
}

.form-section {
  background: #ffffff;
  border-bottom: 1rpx solid var(--edit-border);
}

:deep(.form-root) {
  --sar-form-item-padding-x: 32rpx;
  --sar-form-item-padding-y: 28rpx;
  --sar-form-item-border-color: var(--edit-border);
  --sar-form-item-label-width: 160rpx;
  --sar-form-item-label-margin-right: 16rpx;
  --sar-form-item-label-font-size: 26rpx;
  --sar-form-item-label-line-height: 1.4;
  --sar-form-item-star-color: #ef4444;
  --sar-form-item-star-font-size: 24rpx;
  --sar-form-item-error-color: #ef4444;
}

:deep(.form-root .sar-form-item) {
  background: #ffffff;
}

:deep(.form-root .sar-form-item:active) {
  background: #f8f9fa;
}

:deep(.form-input) {
  width: 100%;
  --sar-input-bg: transparent;
  --sar-input-control-font-size: 28rpx;
}

:deep(.form-input .sar-input__control) {
  text-align: right;
  color: var(--edit-text-main);
}

:deep(.form-radio-group) {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  --sar-radio-icon-font-size: 36rpx;
  --sar-radio-icon-color: #d1d5db;
  --sar-radio-icon-checked-color: var(--primary-color);
  --sar-radio-label-margin-left: 12rpx;
  --sar-radio-group-column-gap: 32rpx;
}

:deep(.form-radio-group .sar-radio__label) {
  font-size: 26rpx;
  color: var(--edit-text-main);
}

.form-tip {
  padding: 16rpx 32rpx 0;
  font-size: 22rpx;
  color: var(--edit-text-sub);
  text-align: center;
}

.footer {
  margin-top: auto;
  padding: 32rpx;
  background: #ffffff;
}

:deep(.save-btn) {
  border-radius: 16rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 24rpx rgba(100, 108, 255, 0.2);
}
</style>
