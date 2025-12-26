import request from '@/utils/request'

// 查询场地列表 (分页)
export function listVenue(query) {
  return request({
    url: '/biz/venue/list',
    method: 'get',
    params: query
  })
}

// 【关键修复】查询所有可用场地 (下拉框用)
// 之前报错就是因为少了这段 export
export function listAllVenue() {
  return request({
    url: '/biz/venue/listAll',
    method: 'get'
  })
}

// 查询场地详细
export function getVenue(venueId) {
  return request({
    url: '/biz/venue/' + venueId,
    method: 'get'
  })
}

// 新增场地
export function addVenue(data) {
  return request({
    url: '/biz/venue',
    method: 'post',
    data: data
  })
}

// 修改场地
export function updateVenue(data) {
  return request({
    url: '/biz/venue',
    method: 'put',
    data: data
  })
}

// 删除场地
export function delVenue(venueId) {
  return request({
    url: '/biz/venue/' + venueId,
    method: 'delete'
  })
}