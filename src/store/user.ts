import type { UserInfo, UserProfileResponse } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo } from '@/api/methods/auth'

// 初始化状态
const userInfoState: UserInfo = {
  remark: '',
  userId: -1,
  userName: '',
  nickName: '',
  email: '',
  phoneNumber: '',
  sex: '0',
  avatar: '',
  avatarFileId: null,
  password: '',
  status: '0',
  delFlag: '',
  loginIp: '',
  loginDate: '',
  roleList: [],
  permissionList: [],
}
const rolesState: string[] = []
const permissionsState: string[] = []

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<UserInfo>({ ...userInfoState })
    const roles = ref<string[]>([...rolesState])
    const permissions = ref<string[]>([...permissionsState])
    // 设置用户信息
    const setUserInfo = (val: UserInfo) => {
      userInfo.value = {
        ...val,
        avatar: val.avatar || '',
      }
    }
    const setUserProfile = (profile: UserProfileResponse) => {
      setUserInfo(profile.user)
      roles.value = profile.roles ?? []
      permissions.value = profile.permissions ?? profile.user.permissionList ?? []
    }
    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar
      console.log('userInfo', userInfo.value)
    }
    // 删除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
      roles.value = [...rolesState]
      permissions.value = [...permissionsState]
      uni.removeStorageSync('user')
    }

    /**
     * 获取用户信息
     */
    const refreshUserInfo = async () => {
      const res = await getUserInfo()
      setUserProfile(res)
      return res
    }

    const hasPermission = (permissionCode: string) => {
      if (!permissionCode)
        return false
      if (permissions.value.includes('*:*:*'))
        return true
      return permissions.value.includes(permissionCode)
    }

    return {
      userInfo,
      roles,
      permissions,
      clearUserInfo,
      refreshUserInfo,
      hasPermission,
      setUserInfo,
      setUserProfile,
      setUserAvatar,
    }
  },
  {
    persist: true,
  },
)
