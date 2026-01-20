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
})

const rules = {
  oldPassword: [{ required: true, message: '请输入旧密码' }],
  newPassword: [{ required: true, message: '请输入新密码' }],
}

function handleLogin() {
  uni.navigateTo({
    url: `${LOGIN_PAGE}?redirect=${encodeURIComponent('/pages/profile/change-password')}`,
  })
}

function resetForm() {
  form.oldPassword = ''
  form.newPassword = ''
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
    <sar-navbar status-bar show-back fixed title="修改密码" @back="handleBack" />

    <view class="content">
      <view v-if="!tokenStore.hasLogin" class="card login-card">
        <view class="login-title">
          请先登录
        </view>
        <sar-button type="primary" root-class="login-btn" @click="handleLogin">
          登录
        </sar-button>
      </view>

      <view v-else class="card">
        <view class="section-head">
          <view class="section-title">
            安全设置
          </view>
          <view class="section-desc">
            请妥善保管新密码
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
          <sar-form-item name="oldPassword" label="旧密码" required>
            <sar-input v-model="form.oldPassword" type="password" show-eye placeholder="请输入旧密码" />
          </sar-form-item>
          <sar-form-item name="newPassword" label="新密码" required>
            <sar-input v-model="form.newPassword" type="password" show-eye placeholder="请输入新密码" />
          </sar-form-item>
        </sar-form>

        <sar-button
          type="primary"
          root-class="section-action"
          :loading="saving"
          @click="handleSave"
        >
          更新密码
        </sar-button>
      </view>
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

:deep(.section-action) {
  margin-top: 16rpx;
}
</style>
