import type { NoticeDetail, UserMessage, UserNotice } from '../types/message'
import type { PageParams, PageResult } from '@/http/types'
import { alova } from '@/http/alova'

// 用户消息列表分页（系统消息）
export function getUserMessagePage(params: PageParams) {
  return alova.Get<PageResult<UserMessage>>('/system/message/page', { params })
}

// 用户消息未读数量
export function getUserMessageUnreadCount() {
  return alova.Get<number>('/system/message/unreadCount', {
    cacheFor: 0,
  })
}

// 用户消息未读列表（用于角标/缓存）
export function getUserMessageUnreadList() {
  return alova.Get<UserMessage[]>('/system/message/unreadList')
}

// 用户消息详情
export function getUserMessageDetail(messageId: number | string) {
  return alova.Get<UserMessage>(`/system/message/${messageId}`)
}

// 单条用户消息标记已读
export function markUserMessageRead(messageId: number | string) {
  return alova.Post<void>(`/system/message/read/${messageId}`)
}

// 用户消息全部标记已读
export function markAllUserMessageRead() {
  return alova.Post<void>('/system/message/readAll')
}

// 平台公告分页（用户侧）
export function getNoticePage(params: PageParams) {
  return alova.Get<PageResult<UserNotice>>('/system/notice/user/page', { params })
}

// 平台公告未读数量
export function getNoticeUnreadCount() {
  return alova.Get<number>('/system/notice/user/unreadCount', {
    cacheFor: 0,
  })
}

// 平台公告未读列表（用于角标/缓存）
export function getNoticeUnreadList() {
  return alova.Get<UserNotice[]>('/system/notice/user/unreadList')
}

// 平台公告详情
export function getNoticeDetail(noticeId: number | string) {
  return alova.Get<NoticeDetail>(`/system/notice/${noticeId}`)
}

// 单条平台公告标记已读
export function markNoticeRead(noticeId: number | string) {
  return alova.Post<void>(`/system/notice/user/read/${noticeId}`)
}

// 平台公告全部标记已读
export function markAllNoticeRead() {
  return alova.Post<void>('/system/notice/user/readAll')
}
