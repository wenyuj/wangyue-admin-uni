import type { IUpdateInfo, IUpdatePassword, IUserInfoRes, TokenInfo } from '../types/login'
import { alova } from '@/http/alova'

/**
 * 登录表单
 */
export interface ILoginForm {
  username: string
  password: string
  code?: string
  uuid?: string
}

/**
 * 用户登录
 * @param loginForm 登录表单
 */
export function auth(loginForm: ILoginForm) {
  return alova.Post<TokenInfo>('/auth/login', loginForm)
}

/**
 * 刷新token
 * @param refreshToken 刷新token
 */
export function refreshToken(refreshToken: string) {
  return alova.Post<TokenInfo>('/auth/refreshToken', { refreshToken })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return alova.Get<IUserInfoRes>('/auth/userinfo')
}

/**
 * 退出登录
 */
export function logout() {
  return alova.Get<void>('/auth/logout')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return alova.Post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return alova.Post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return alova.Post<TokenInfo>('/auth/wxLogin', data)
}
