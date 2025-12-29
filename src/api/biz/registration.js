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

// 取消报名
export function cancelRegistration(regId) {
  return request({
    url: '/biz/registration/cancel/' + regId,
    method: 'post'
  })
}

// 提交评价反馈
export function submitFeedback(data) {
  return request({
    url: '/biz/registration/feedback',
    method: 'post',
    data: data
  })
}

// 获取活动的评价统计
export function getFeedbackStats(activityId) {
  return request({
    url: '/biz/registration/feedback/stats/' + activityId,
    method: 'get'
  })
}

// 人脸识别签到
export function checkinByFace(data) {
  return request({
    url: '/biz/registration/checkin/face',
    method: 'post',
    data: data
  })
}

// 获取报名记录详情
export function getRegistration(regId) {
  return request({
    url: '/biz/registration/' + regId,
    method: 'get'
  })
}