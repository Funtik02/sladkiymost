import { request, toQuery } from './client'

// Ближайшие открытые волны направления (YKT_DNR | DNR_YKT)
export function getWaves(direction, signal) {
    return request(`/waves${toQuery({ direction })}`, { signal })
}

// { YKT_DNR: [...], DNR_YKT: [...] } — для главной и дашборда
export function getWavesLoad(signal) {
    return request('/waves/load', { signal })
}

// Пункты выдачи в городе назначения направления
export function getPickupPoints(direction, signal) {
    return request(`/pickup-points${toQuery({ direction })}`, { signal })
}
