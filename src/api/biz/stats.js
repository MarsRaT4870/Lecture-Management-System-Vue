import request from '@/utils/request'

// 获取统计数据
export function getStatsData() {
  return request({
    url: '/biz/stats/dashboard',
    method: 'get'
  })
}