import { request } from './client'

// Проверка и пересчёт заказа на сервере без сохранения (перед оплатой картой)
export function quoteOrder(payload) {
    return request('/orders/quote', { method: 'POST', body: payload })
}

export function createOrder(payload) {
    return request('/orders', { method: 'POST', body: payload })
}

export function getOrder(id, signal) {
    return request(`/orders/${encodeURIComponent(id)}`, { signal })
}
