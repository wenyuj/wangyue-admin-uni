<script lang="ts" setup>
import { toast } from 'sard-uniapp'
import { updateUserPassword } from '@/api/methods/auth'
import { LOGIN_PAGE } from '@/router/config'
import { useTokenStore } from '@/store/token'
import { handleBack } from '@/utils'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '修改密码',
  },
})

const tokenStore = useTokenStore()

const formRef = ref<any>(null)
const saving = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules = {
  oldPassword: [{ required: true, message: '请输入旧密码' }],
  newPassword: [{ required: true, message: '请输入新密码' }],
  confirmPassword: [
    { required: true, message: '请输入确认密码' },
    {
      validator: (value: string) => (value === form.newPassword ? true : '两次密码不一致'),
    },
  ],
}

watch(
  () => form.newPassword,
  () => {
    if (!form.confirmPassword)
      return
    formRef.value?.validate?.(['confirmPassword']).catch(() => {})
  },
)

function handleLogin() {
  uni.navigateTo({
    url: `${LOGIN_PAGE}?redirect=${encodeURIComponent('/pages/profile/change-password')}`,
  })
}

function resetForm() {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate?.()
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
    await updateUserPassword({ ...form })
    toast.success('密码修改成功')
    resetForm()
    uni.navigateBack()
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="page">
    <sar-navbar status-bar show-back fixed title="修改密码" back-text="" @back="handleBack" />

    <view class="content">
      <view v-if="!tokenStore.hasLogin" class="login-card">
        <view class="login-title">
          请先登录
        </view>
        <sar-button type="default" theme="primary" root-class="login-btn" @click="handleLogin">
          登录
        </sar-button>
      </view>

      <view v-else class="panel">
        <view class="intro">
          <view class="intro-title">
            安全设置
          </view>
          <view class="intro-desc">
            请妥善保管新密码，建议定期更换以保障安全。
          </view>
        </view>

        <view class="form-section">
          <sar-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="160rpx"
            direction="horizontal"
            root-class="form-root"
          >
            <sar-form-item name="oldPassword" label="旧密码" required root-class="form-item">
              <sar-input
                v-model="form.oldPassword"
                type="password"
                show-eye
                inlaid
                placeholder="请输入旧密码"
                root-class="form-input"
              />
            </sar-form-item>
            <sar-form-item name="newPassword" label="新密码" required root-class="form-item">
              <sar-input
                v-model="form.newPassword"
                type="password"
                show-eye
                inlaid
                placeholder="请输入新密码"
                root-class="form-input"
              />
            </sar-form-item>
            <sar-form-item name="confirmPassword" label="确认密码" required root-class="form-item">
              <sar-input
                v-model="form.confirmPassword"
                type="password"
                show-eye
                inlaid
                placeholder="请再次输入新密码"
                root-class="form-input"
              />
            </sar-form-item>
          </sar-form>
        </view>

        <view class="action-area">
          <sar-button
            type="default"
            theme="primary"
            root-class="save-btn"
            :loading="saving"
            @click="handleSave"
          >
            更新密码
          </sar-button>
          <view class="helper-text">
            如果遇到问题，请联系系统管理员
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #ffffff;
  color: #111827;
  line-height: 1.5;
  font-family: 'Noto Sans SC', 'Inter', sans-serif;
  --change-primary: #646cff;
  --change-primary-hover: #535bf2;
  --change-border: #e5e7eb;
  --change-text-sub: #6b7280;
  --sar-primary: var(--change-primary);
  --sar-primary-rgb: 100, 108, 255;
  --sar-navbar-bg: rgba(255, 255, 255, 0.95);
  --sar-navbar-title-color: #111827;
  --sar-navbar-item-color: #111827;
  --sar-navbar-title-font-size: 32rpx;
}

.content {
  padding: 24rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
}

:deep(.sar-navbar__fixation) {
  backdrop-filter: blur(12rpx);
  border-bottom: 1rpx solid var(--change-border);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  border: 1rpx solid var(--change-border);
  border-radius: 16rpx;
  padding: 48rpx 24rpx;
}

.login-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

:deep(.login-btn) {
  width: 60%;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.intro-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}

.intro-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--change-text-sub);
}

.form-section {
  border-top: 1rpx solid var(--change-border);
  border-bottom: 1rpx solid var(--change-border);
}

:deep(.form-root) {
  --sar-form-item-padding-x: 0;
  --sar-form-item-padding-y: 28rpx;
  --sar-form-item-border-color: var(--change-border);
  --sar-form-item-label-width: 160rpx;
  --sar-form-item-label-margin-right: 16rpx;
  --sar-form-item-label-font-size: 28rpx;
  --sar-form-item-label-line-height: 1.4;
  --sar-form-item-star-color: #ef4444;
  --sar-form-item-star-font-size: 24rpx;
  --sar-form-item-error-color: #ef4444;
}

:deep(.form-root .sar-form-item) {
  background: transparent;
}

:deep(.form-input) {
  width: 100%;
  --sar-input-bg: transparent;
  --sar-input-control-font-size: 28rpx;
  --sar-input-control-line-height: 1.5;
}

:deep(.form-input .sar-input__control) {
  color: #111827;
}

:deep(.form-input .sar-input__eye) {
  color: #9ca3af;
}

.action-area {
  margin-top: 40rpx;
}

:deep(.save-btn) {
  border-radius: 16rpx;
  font-weight: 600;
  font-size: 30rpx;
  height: 96rpx;
  box-shadow: 0 0 20rpx -6rpx rgba(100, 108, 255, 0.4);
}

.helper-text {
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #9ca3af;
  text-align: center;
}
</style>
