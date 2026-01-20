<script lang="ts" setup>
import type { UserGender } from '@/api/types/login'
import { toast } from 'sard-uniapp'
import { updateUserProfile } from '@/api/methods/auth'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import { handleBack } from '@/utils'
import { uploadFileUrl, useUpload } from '@/utils/uploadFile'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '资料编辑',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()

const formRef = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const avatarUploading = ref(false)

const displayName = computed(() => userStore.userInfo.nickName || userStore.userInfo.userName || '-')

const form = reactive({
  nickName: '',
  sex: '0' as UserGender,
  phoneNumber: '',
  email: '',
})

const sexOptions = [
  { label: '男', value: '0' },
  { label: '女', value: '1' },
]

const rules = {
  nickName: [{ required: true, message: '请输入昵称' }],
  sex: [{ required: true, message: '请选择性别' }],
}

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
    toast.success('保存成功')
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
    toast.success('头像更新成功')
    await userStore.refreshUserInfo()
    syncForm()
  },
  onError: () => {
    toast.fail('头像上传失败')
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
  refreshProfile()
})
</script>

<template>
  <view class="page">
    <sar-navbar status-bar show-back fixed title="资料编辑" @back="handleBack" />

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
        <view v-if="loading" class="loading-block">
          <sar-loading type="circular" />
          <text class="loading-text">正在加载资料</text>
        </view>

        <template v-else>
          <view class="card avatar-card">
            <view class="section-head">
              <view class="section-title">
                头像
              </view>
              <view class="section-desc">
                用于个人中心展示
              </view>
            </view>

            <view class="avatar-row">
              <view class="avatar-preview">
                <image :src="userStore.userInfo.avatar" mode="scaleToFill" class="avatar-image" />
              </view>
              <view class="avatar-meta">
                <view class="avatar-name">
                  {{ displayName }}
                </view>
                <view class="avatar-tip">
                  建议上传清晰头像
                </view>
                <view class="avatar-actions">
                  <!-- #ifdef MP-WEIXIN -->
                  <button
                    class="avatar-upload-btn"
                    open-type="chooseAvatar"
                    :disabled="avatarUploading"
                    @chooseavatar="onChooseAvatar"
                  >
                    {{ avatarUploading ? '上传中...' : '更换头像' }}
                  </button>
                  <!-- #endif -->
                  <!-- #ifndef MP-WEIXIN -->
                  <sar-button
                    type="primary"
                    root-class="avatar-upload-root"
                    :loading="avatarUploading"
                    @click="handleAvatarUpload"
                  >
                    更换头像
                  </sar-button>
                  <!-- #endif -->
                </view>
              </view>
            </view>
          </view>

          <view class="card">
            <view class="section-head">
              <view class="section-title">
                基础信息
              </view>
              <view class="section-desc">
                修改后会同步到个人中心
              </view>
            </view>

            <sar-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-width="140rpx"
              direction="vertical"
              root-class="form-root"
            >
              <sar-form-item name="nickName" label="昵称" required>
                <sar-input v-model="form.nickName" placeholder="请输入昵称" clearable />
              </sar-form-item>
              <sar-form-item name="sex" label="性别" required>
                <sar-radio-group v-model="form.sex" :options="sexOptions" direction="horizontal" />
              </sar-form-item>
              <sar-form-item name="phoneNumber" label="手机号">
                <sar-input v-model="form.phoneNumber" placeholder="请输入手机号" inputmode="tel" clearable />
              </sar-form-item>
              <sar-form-item name="email" label="邮箱">
                <sar-input v-model="form.email" placeholder="请输入邮箱" inputmode="email" clearable />
              </sar-form-item>
            </sar-form>

            <sar-button
              type="primary"
              root-class="section-action"
              :loading="saving"
              @click="handleSave"
            >
              保存资料
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
  --card-bg: #ffffff;
  --border: rgba(var(--primary-color-rgb), 0.12);
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.5;
}

.content {
  padding: 24rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
}

.card {
  background: var(--card-bg);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1rpx solid var(--border);
  box-shadow: 0 16rpx 36rpx rgba(15, 23, 42, 0.08);
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

:deep(.form-root) {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.section-head {
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color);
}

.section-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--third-text-color);
}

.avatar-card {
  padding-top: 20rpx;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar-preview {
  width: 140rpx;
  height: 140rpx;
  border-radius: 999rpx;
  overflow: hidden;
  border: 4rpx solid rgba(var(--primary-color-rgb), 0.1);
  background: var(--card-bg);
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.avatar-name {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text-color);
}

.avatar-tip {
  font-size: 22rpx;
  color: var(--third-text-color);
}

.avatar-actions {
  margin-top: 8rpx;
}

:deep(.avatar-upload-root) {
  min-width: 200rpx;
}

.avatar-upload-btn {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--text-color);
  border: none;
}

.avatar-upload-btn:disabled {
  opacity: 0.6;
}

:deep(.section-action) {
  margin-top: 16rpx;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0 24rpx;
  color: var(--third-text-color);
}

@media (max-width: 520px) {
  .avatar-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

.loading-text {
  font-size: 24rpx;
}
</style>
