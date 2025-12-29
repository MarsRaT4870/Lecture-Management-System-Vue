import request from '@/utils/request'

// 查询列表
export function listCredit(query) {
  return request({
    url: '/biz/credit/list',
    method: 'get',
    params: query
  })
}

// 获取我的总学分
export function getMyTotalCredits() {
  return request({
    url: '/biz/credit/myTotal',
    method: 'get'
  })
}

// 获取学分排行榜
export function getCreditRanking(limit = 10) {
  return request({
    url: '/biz/credit/ranking',
    method: 'get',
    params: { limit }
  })
}

// 手动发放学分（管理员）
export function grantCredits(activityId) {
  return request({
    url: '/biz/credit/grant/' + activityId,
    method: 'post'
  })
}