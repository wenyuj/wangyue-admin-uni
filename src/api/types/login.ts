// 认证模式类型
export type AuthMode = 'single' | 'double'

/**
 * 登录返回的信息，其实就是 token 信息
 */
export interface TokenInfo {
  token: string
  expireTime: number // 访问令牌有效期(秒)
  refreshToken?: string
  refreshExpireTime?: number // 刷新令牌有效期(秒)
}

/** user gender */
export type UserGender = '0' | '1'

/** enable status */
export type EnableStatus = '0' | '1'

export type RoleInfo = Record<string, any> | string

/**
 * 用户信息
 */
export interface UserInfo {
  remark: string
  userId: number
  userName: string
  nickName: string
  email: string
  phoneNumber: string
  sex: UserGender
  avatar: string
  avatarFileId: number | null
  password: string
  status: EnableStatus
  delFlag: string
  loginIp: string
  loginDate: string
  roleList: RoleInfo[]
  permissionList: any[]
  [key: string]: any // 允许其他扩展字段
}

/**
 * 用户信息响应结构
 */
export interface UserProfileResponse {
  user: UserInfo
  roles?: string[]
  permissions?: string[]
}

/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
