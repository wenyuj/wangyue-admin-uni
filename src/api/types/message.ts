export type ReadStatus = '0' | '1'

export interface UserMessage {
  messageId: number
  title: string
  /** content preview (may exist in list response) */
  content?: string | null
  bizType: string
  bizId: number | string
  /** dict: read_status */
  readFlag: ReadStatus
  readTime?: string | null
  createBy?: string | null
  createByName?: string | null
  createTime?: string
}

export interface UserNotice {
  noticeId: number
  noticeTitle: string
  noticeType: string
  status: string
  createBy?: string | null
  createByName?: string | null
  createTime?: string
  readTime?: string | null
  readFlag: ReadStatus
}

export interface NoticeDetail {
  noticeId: number
  noticeTitle: string
  noticeType: string
  noticeContent: string
  status: string
  createBy: string
  createByName?: string
  createTime: string
  updateBy: string
  updateByName?: string
  updateTime: string
  remark: string
}
