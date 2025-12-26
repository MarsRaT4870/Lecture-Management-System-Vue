import request from '@/utils/request'

// 查询消息列表
export function listMessage(query) {
  return request({
    url: '/biz/message/list',
    method: 'get',
    params: query
  })
}

// 获取未读数量
export function getUnreadCount() {
  return request({
    url: '/biz/message/unreadCount',
    method: 'get'
  })
}

// 标记单条已读
export function readMessage(messageId) {
  return request({
    url: '/biz/message/read/' + messageId,
    method: 'put'
  })
}

// 全部已读
export function readAllMessage() {
  return request({
    url: '/biz/message/readAll',
    method: 'put'
  })
}

// 删除消息
export function delMessage(messageId) {
  return request({
    url: '/biz/message/' + messageId,
    method: 'delete'
  })
}