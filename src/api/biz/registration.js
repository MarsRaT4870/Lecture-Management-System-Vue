import request from '@/utils/request'

// 查询报名列表 (学生查自己，管理员查所有)
export function listRegistration(query) {
  return request({
    url: '/biz/registration/list',
    method: 'get',
    params: query
  })
}

// [重构] 学生报名活动
export function applyActivity(data) {
  return request({
    url: '/biz/registration/apply',
    method: 'post',
    data: data // { activityId: 1001 }
  })
}

// [重构] 扫码/手动签到
export function checkinActivity(data) {
  return request({
    url: '/biz/registration/checkin',
    method: 'post',
    data: data // { activityId: 1001, remark: "tokenString" }
  })
}

// 取消报名 (逻辑删除或状态更新)
export function cancelRegistration(regId) {
  return request({
    url: '/biz/registration/' + regId,
    method: 'delete'
  })
}