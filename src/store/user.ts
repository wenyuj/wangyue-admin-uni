import type { RoleInfo, UserInfo, UserProfileResponse } from '@/api/types/login'
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
  avatar: '/static/images/default-avatar.png',
  avatarFileId: null,
  password: '',
  status: '0',
  delFlag: '',
  loginIp: '',
  loginDate: '',
  roleList: [],
  permissionList: [],
}
const rolesState: RoleInfo[] = []
const permissionsState: string[] = []

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<UserInfo>({ ...userInfoState })
    const roles = ref<RoleInfo[]>([...rolesState])
    const permissions = ref<string[]>([...permissionsState])
    // 设置用户信息
    const setUserInfo = (val: UserInfo) => {
      // 若头像为空 则使用默认头像
      if (!val.avatar) {
        val.avatar = userInfoState.avatar
      }
      userInfo.value = {
        ...val,
      }
    }
    const setUserProfile = (profile: UserProfileResponse) => {
      setUserInfo(profile.user)
      roles.value = profile.roles ?? profile.user.roleList ?? []
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
