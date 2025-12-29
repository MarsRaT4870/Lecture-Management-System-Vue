import request from '@/utils/request'

// 获取统计数据（使用activity的statistics接口）
export function getStatsData() {
  return request({
    url: '/biz/activity/statistics',
    method: 'get'
  })
}