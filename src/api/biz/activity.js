import request from '@/utils/request'

// 查询活动列表
export function listActivity(query) {
  return request({
    url: '/biz/activity/list',
    method: 'get',
    params: query
  })
}

// 查询活动详细
export function getActivity(activityId) {
  return request({
    url: '/biz/activity/' + activityId,
    method: 'get'
  })
}

// 新增活动
export function addActivity(data) {
  return request({
    url: '/biz/activity',
    method: 'post',
    data: data
  })
}

// 修改活动
export function updateActivity(data) {
  return request({
    url: '/biz/activity',
    method: 'put',
    data: data
  })
}

// 删除活动
export function delActivity(activityId) {
  return request({
    url: '/biz/activity/' + activityId,
    method: 'delete'
  })
}

// 获取签到二维码 Token
export function getActivityQrCode(activityId) {
  return request({
    url: '/biz/activity/qrcode/' + activityId,
    method: 'get'
  })
}

// 【新增】获取活动统计数据 (修复白屏报错的关键)
export function getActivityStats() {
  return request({
    url: '/biz/activity/statistics',
    method: 'get'
  })
}


// [新增] 获取首页综合数据
export function getIndexData() {
  return request({
    url: '/biz/activity/index-data',
    method: 'get'
  })
}



// ... 其他接口 ...

// 审核活动
export function auditActivity(data) {
  return request({
    url: '/biz/activity/audit',
    method: 'put',
    data: data
  })
}

