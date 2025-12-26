import request from '@/utils/request'

// 查询列表
export function listEvaluation(query) {
  return request({
    url: '/biz/evaluation/list',
    method: 'get',
    params: query
  })
}

// 提交评价
export function addEvaluation(data) {
  return request({
    url: '/biz/evaluation',
    method: 'post',
    data: data
  })
}

// 删除评价
export function delEvaluation(evalId) {
  return request({
    url: '/biz/evaluation/' + evalId,
    method: 'delete'
  })
}