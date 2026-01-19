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
  <view class="min-h-screen bg-white">
    <sar-navbar status-bar fixed title="登录" />
    <view class="px-4 pt-6">
      <view class="text-center text-2xl text-gray-900 font-semibold">
        账号登录
      </view>
      <view class="mt-6 space-y-4">
        <view class="border border-gray-200 rounded-lg px-3 py-2">
          <input v-model="form.userName" class="w-full text-base" placeholder="请输入账号">
        </view>
        <view class="border border-gray-200 rounded-lg px-3 py-2">
          <input v-model="form.password" class="w-full text-base" placeholder="请输入密码" password>
        </view>
      </view>
      <sar-button class="mt-6 w-full" :loading="loading" @click="doLogin">
        登录
      </sar-button>
    </view>
  </view>
</template>
