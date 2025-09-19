import { alova, API_DOMAINS } from '@/http/alova'

export interface Demo {
  id: number
  name: string
}

export function demo() {
  return alova.Get<Demo>('/demo', {
    params: {
      pageNumber: 1,
      pageSize: 10,
    },
    meta: { domain: API_DOMAINS.SECONDARY }, // 用于切换请求地址
  })
}
