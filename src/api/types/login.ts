// 认证模式类型
export type AuthMode = 'single' | 'double'

/**
 * 登录返回的信息，其实就是 token 信息
 */
export interface TokenInfo {
  accessToken: string
  accessExpireTime: number // 访问令牌有效期(秒)
  refreshToken?: string
  refreshExpireTime?: number // 刷新令牌有效期(秒)
}

/**
 * 用户信息
 */
export interface IUserInfoRes {
  userId: number
  username: string
  nickname: string
  avatar?: string
  [key: string]: any // 允许其他扩展字段
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
