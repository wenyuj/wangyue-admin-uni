// 通用响应格式
export interface IResponse<T = any> {
  code: number | string
  data: T
  msg: string
}

// 分页请求参数
export interface PageParams {
  pageNumber: number
  pageSize: number
  [key: string]: any
}

// 分页响应数据
export interface PageResult<T> {
  records: T[]
  totalPage: number
  totalRow: number
  pageNumber: number
  pageSize: number
}
