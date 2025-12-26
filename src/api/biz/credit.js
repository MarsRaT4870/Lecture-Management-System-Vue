import request from '@/utils/request'

// 查询列表
export function listCredit(query) {
  return request({
    url: '/biz/credit/list',
    method: 'get',
    params: query
  })
}

// 生成学分
export function generateCredit(activityId) {
  return request({
    url: '/biz/credit/generate/' + activityId,
    method: 'post'
  })
}