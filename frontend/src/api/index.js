import request from '@/utils/request'

export function getMembers(params) {
  return request({
    url: '/members',
    method: 'get',
    params
  })
}

export function getMember(id) {
  return request({
    url: `/members/${id}`,
    method: 'get'
  })
}

export function getMemberByQr(qrCode) {
  return request({
    url: `/members/qr/${qrCode}`,
    method: 'get'
  })
}

export function createMember(data) {
  return request({
    url: '/members',
    method: 'post',
    data
  })
}

export function updateMember(id, data) {
  return request({
    url: `/members/${id}`,
    method: 'put',
    data
  })
}

export function getCardTypes() {
  return request({
    url: '/cards/types',
    method: 'get'
  })
}

export function getCardType(id) {
  return request({
    url: `/cards/types/${id}`,
    method: 'get'
  })
}

export function createCardType(data) {
  return request({
    url: '/cards/types',
    method: 'post',
    data
  })
}

export function updateCardType(id, data) {
  return request({
    url: `/cards/types/${id}`,
    method: 'put',
    data
  })
}

export function getMemberCards(params) {
  return request({
    url: '/cards',
    method: 'get',
    params
  })
}

export function createMemberCard(data) {
  return request({
    url: '/cards',
    method: 'post',
    data
  })
}

export function consumeCard(id, data) {
  return request({
    url: `/cards/${id}/consume`,
    method: 'post',
    data
  })
}

export function getTodaySessions() {
  return request({
    url: '/sessions/today',
    method: 'get'
  })
}

export function getSessionsByDate(date) {
  return request({
    url: `/sessions/${date}`,
    method: 'get'
  })
}

export function updateSession(id, data) {
  return request({
    url: `/sessions/${id}`,
    method: 'put',
    data
  })
}

export function walkInPurchase(data) {
  return request({
    url: '/sessions/walk-in',
    method: 'post',
    data
  })
}

export function getProducts(params) {
  return request({
    url: '/products',
    method: 'get',
    params
  })
}

export function createProduct(data) {
  return request({
    url: '/products',
    method: 'post',
    data
  })
}

export function updateProduct(id, data) {
  return request({
    url: `/products/${id}`,
    method: 'put',
    data
  })
}

export function getConsumptionRecords(params) {
  return request({
    url: '/consumptions',
    method: 'get',
    params
  })
}

export function createProductConsumption(data) {
  return request({
    url: '/consumptions/product',
    method: 'post',
    data
  })
}

export function getEmployees(params) {
  return request({
    url: '/employees',
    method: 'get',
    params
  })
}

export function createEmployee(data) {
  return request({
    url: '/employees',
    method: 'post',
    data
  })
}

export function updateEmployee(id, data) {
  return request({
    url: `/employees/${id}`,
    method: 'put',
    data
  })
}

export function getCommissionSettings() {
  return request({
    url: '/commissions/settings',
    method: 'get'
  })
}

export function createCommissionSetting(data) {
  return request({
    url: '/commissions/settings',
    method: 'post',
    data
  })
}

export function updateCommissionSetting(id, data) {
  return request({
    url: `/commissions/settings/${id}`,
    method: 'put',
    data
  })
}

export function getDailyCommissions(date) {
  return request({
    url: `/commissions/daily/${date}`,
    method: 'get'
  })
}

export function generateSalary(month) {
  return request({
    url: '/commissions/salary/generate',
    method: 'post',
    data: { month }
  })
}

export function getSalaryRecords(month) {
  return request({
    url: `/commissions/salary/records/${month}`,
    method: 'get'
  })
}

export function updateSalary(id, data) {
  return request({
    url: `/commissions/salary/${id}`,
    method: 'put',
    data
  })
}

export function lockSalary(id) {
  return request({
    url: `/commissions/salary/${id}/lock`,
    method: 'post'
  })
}

export function getOverview() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

export function getSessionTraffic(params) {
  return request({
    url: '/statistics/session-traffic',
    method: 'get',
    params
  })
}

export function getCardSales(params) {
  return request({
    url: '/statistics/card-sales',
    method: 'get',
    params
  })
}

export function getProductSales(params) {
  return request({
    url: '/statistics/product-sales',
    method: 'get',
    params
  })
}

export function getDailySales(params) {
  return request({
    url: '/statistics/daily-sales',
    method: 'get',
    params
  })
}

export function getPromotions() {
  return request({
    url: '/statistics/promotions',
    method: 'get'
  })
}

export function createPromotion(data) {
  return request({
    url: '/statistics/promotions',
    method: 'post',
    data
  })
}

export function updatePromotion(id, data) {
  return request({
    url: `/statistics/promotions/${id}`,
    method: 'put',
    data
  })
}
