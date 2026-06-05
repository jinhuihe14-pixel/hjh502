import request from '@/utils/request'

export function getMemberByQr(qrCode) {
  return request({
    url: `/members/qr/${qrCode}`,
    method: 'get'
  })
}

export function getMember(id) {
  return request({
    url: `/members/${id}`,
    method: 'get'
  })
}

export function getPromotions() {
  return request({
    url: '/statistics/promotions',
    method: 'get'
  })
}
