import request from '@/utils/request'

// 查询列表
export function listEvaluation(query) {
  return request({
    url: '/biz/evaluation/list',
    method: 'get',
    params: query
  })
}

// 提交评价 (学生)
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

// 【新增】官方回复评价（后端未实现，暂时注释）
// export function replyEvaluation(data) {
//   return request({
//     url: '/biz/evaluation/reply',
//     method: 'put',
//     data: data
//   })
// }

// 临时实现：使用占位，提示后端未实现
export function replyEvaluation(data) {
  return Promise.reject({
    msg: '该功能后端尚未实现，请联系管理员'
  })
}