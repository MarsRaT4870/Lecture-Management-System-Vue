import request from '@/utils/request'

// 查询报名列表
export function listRegistration(query) {
  return request({
    url: '/biz/registration/list',
    method: 'get',
    params: query
  })
}

// 查询报名详细
export function getRegistration(regId) {
  return request({
    url: '/biz/registration/' + regId,
    method: 'get'
  })
}

// 新增报名 (学生报名)
export function addRegistration(data) {
  return request({
    url: '/biz/registration',
    method: 'post',
    data: data
  })
}

// 删除报名
export function delRegistration(regId) {
  return request({
    url: '/biz/registration/' + regId,
    method: 'delete'
  })
}

// 活动签到
export function checkInUser(data) {
  return request({
    url: '/biz/registration/checkin',
    method: 'post',
    data: data
  })
}