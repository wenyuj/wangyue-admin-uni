import type { uniappRequestAdapter } from '@alova/adapter-uniapp'
import type { IResponse } from './types'
import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'
import { createServerTokenAuthentication } from 'alova/client'
import VueHook from 'alova/vue'
import { toast } from 'sard-uniapp'
import { LOGIN_PAGE } from '@/router/config'
import { useTokenStore } from '@/store'
import { isDoubleTokenMode } from '@/utils'
import { ContentTypeEnum, ResultEnum, ShowMessage } from './tools/enum'

// 配置动态Tag
export const API_DOMAINS = {
  DEFAULT: import.meta.env.VITE_SERVER_BASEURL,
  SECONDARY: import.meta.env.VITE_API_SECONDARY_URL,
}

/**
 * 创建请求实例
 */
const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<
  typeof VueHook,
  typeof uniappRequestAdapter
>({
  assignToken: (method) => {
    const tokenStore = useTokenStore()
    const token = tokenStore.validToken
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`
    }
  },
  refreshTokenOnSuccess: {
    isExpired: (response, method) => {
      const data = (response as UniNamespace.RequestSuccessCallbackResult).data as IResponse
      return data?.code === ResultEnum.Unauthorized
    },
    handler: async (response, method) => {
      const tokenStore = useTokenStore()
      // 判断是否为双 token 模式
      const data = (response as UniNamespace.RequestSuccessCallbackResult).data as IResponse
      tokenStore.clearTokenInfo()
      uni.reLaunch({ url: LOGIN_PAGE })
      if (isDoubleTokenMode) {
        // refreshToken 预留，暂不处理刷新逻辑
        throw new Error(data.msg)
      }
      // 单 token 模式
      throw new Error(data.msg)
    },
  },
})

/**
 * alova 请求实例
 */
const alovaInstance = createAlova({
  baseURL: API_DOMAINS.DEFAULT,
  ...AdapterUniapp(),
  timeout: 10000,
  statesHook: VueHook,

  beforeRequest: onAuthRequired((method) => {
    // 设置默认 Content-Type
    method.config.headers = {
      ContentType: ContentTypeEnum.JSON,
      Accept: 'application/json, text/plain, */*',
      ...method.config.headers,
    }
    const { config } = method

    // 处理动态域名
    if (config.meta?.domain) {
      method.baseURL = config.meta.domain
    }
  }),

  responded: onResponseRefreshToken({
    onSuccess: (response, method) => {
      const { config } = method
      const { requestType } = config
      const {
        statusCode,
        data: rawData,
        errMsg,
      } = response as UniNamespace.RequestSuccessCallbackResult

      // 处理特殊请求类型（上传/下载）
      if (requestType === 'upload' || requestType === 'download') {
        return response
      }

      // 处理 HTTP 状态码错误
      if (statusCode !== 200) {
        const errorMessage = ShowMessage(statusCode) || `HTTP请求错误[${statusCode}]`
        toast.fail(errorMessage)
        throw new Error(`${errorMessage}：${errMsg}`)
      }

      // 处理业务逻辑错误
      const { code, msg, data } = rawData as IResponse
      if (code !== ResultEnum.Success) {
        if (config.meta?.toast !== false) {
          toast.fail(msg)
        }
        throw new Error(`请求错误[${code}]：${msg}`)
      }
      // 处理成功响应，返回业务数据
      return data
    },
    onError: () => {
      toast.fail('网络异常，请检查网络')
      throw new Error('网络异常，请检查网络')
    },
  }),
})

export const alova = alovaInstance
