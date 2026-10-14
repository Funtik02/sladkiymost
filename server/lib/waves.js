const db = require('../db')
const HttpError = require('./httpError')
const { addDays, nowISO, todayISO } = require('./dates')
const { MIN_WAVE_KG, MAX_WAVE_KG, roundTo } = require('./delivery')

const WAVE_INTERVAL_DAYS = 14
const CUTOFF_DAYS_BEFORE = 3
// Сколько открытых волн держать в расписании на каждое направление
const OPEN_WAVES_AHEAD = 4
const FIRST_WAVE_OFFSET_DAYS = 7

const DIRECTIONS = {
    YKT_DNR: {
        code: 'YKT_DNR',
        label: 'Якутия → ДНР',
        fromRegion: 'Якутия',
        toRegion: 'ДНР',
        fromCity: 'Якутск',
        toCity: 'Донецк',
    },
    DNR_YKT: {
        code: 'DNR_YKT',
        label: 'ДНР → Якутия',
        fromRegion: 'ДНР',
        toRegion: 'Якутия',
        fromCity: 'Донецк',
        toCity: 'Якутск',
    },
}

const ORDER_STATUSES = ['accepted', 'assembling', 'in_transit', 'at_pickup', 'received']

const ORDER_STATUS_LABELS = {
    accepted: 'Принят',
    assembling: 'В сборке',
    in_transit: 'В пути',
    at_pickup: 'На пункте выдачи',
    received: 'Получен',
}

// Товар едет волной из своего региона
function directionFromRegion(region) {
    return Object.values(DIRECTIONS).find((d) => d.fromRegion === region)?.code ?? null
}

// Подарочный набор едет волной в регион назначения
function directionToRegion(region) {
    return Object.values(DIRECTIONS).find((d) => d.toRegion === region)?.code ?? null
}

function isAccepting(wave, today = todayISO()) {
    return wave.status === 'open' && today <= wave.cutoffDate
}

function uniqueWaveId(waves, direction, departureDate) {
    const base = `${direction}-${departureDate}`
    let id = base

    for (let n = 2; waves.some((w) => w.id === id); n += 1) {
        id = `${base}-${n}`
    }

    return id
}

function createWave(waves, direction, departureDate, note = 'Волна создана') {
    const at = nowISO()
    const wave = {
        id: uniqueWaveId(waves, direction, departureDate),
        direction,
        departureDate,
        cutoffDate: addDays(departureDate, -CUTOFF_DAYS_BEFORE),
        currentWeightKg: 0,
        maxWeightKg: MAX_WAVE_KG,
        minWeightKg: MIN_WAVE_KG,
        status: 'open',
        postponedFrom: [],
        mergedInto: null,
        createdAt: at,
        history: [{ at, note }],
    }

    waves.push(wave)
    return wave
}

function pushOrderStatus(order, status, at, note) {
    order.status = status
    order.statusHistory.push({ status, at, ...(note ? { note } : {}) })
}

// Закрыть приём: заказы волны уходят в сборку
function closeWave(wave, orders, note) {
    const at = nowISO()

    wave.status = 'closed'
    wave.closedAt = at
    wave.history.push({ at, note })

    orders
        .filter((o) => o.waveId === wave.id && o.status === 'accepted')
        .forEach((o) => pushOrderStatus(o, 'assembling', at, 'Приём в волну закрыт, заказ собирается'))
}

// Отправить волну: все её заказы переходят в «в пути»
function departWave(wave, orders) {
    const at = nowISO()

    wave.status = 'departed'
    wave.departedAt = at
    wave.history.push({ at, note: 'Волна отправлена' })

    orders
        .filter((o) => o.waveId === wave.id && ['accepted', 'assembling'].includes(o.status))
        .forEach((o) => {
            if (o.status === 'accepted') pushOrderStatus(o, 'assembling', at)
            pushOrderStatus(o, 'in_transit', at, 'Волна отправлена')
        })
}

// Перенос волны, не набравшей минимум 50 кг, на следующую дату по расписанию (+14 дней).
// Если на эту дату уже есть открытая волна и вес помещается — заказы переезжают в неё,
// иначе сама волна сдвигается на новую дату.
function postponeWave(wave, waves, orders, reason, today = todayISO()) {
    const at = nowISO()
    const fromDate = wave.departureDate
    const ownOrders = orders.filter((o) => o.waveId === wave.id)
    let toDate = addDays(fromDate, WAVE_INTERVAL_DAYS)
    let target = null

    for (let guard = 0; guard < 52; guard += 1) {
        const cutoffOk = addDays(toDate, -CUTOFF_DAYS_BEFORE) >= today
        const sameDate = waves.find(
            (w) => w !== wave && w.direction === wave.direction && w.departureDate === toDate && w.status !== 'merged'
        )

        if (cutoffOk && !sameDate) break

        if (
            cutoffOk &&
            sameDate.status === 'open' &&
            sameDate.currentWeightKg + wave.currentWeightKg <= sameDate.maxWeightKg
        ) {
            target = sameDate
            break
        }

        toDate = addDays(toDate, WAVE_INTERVAL_DAYS)
    }

    ownOrders.forEach((o) => {
        o.postponements.push({ from: fromDate, to: toDate, at, reason })
    })

    if (target) {
        ownOrders.forEach((o) => {
            o.waveId = target.id
        })
        target.currentWeightKg = roundTo(target.currentWeightKg + wave.currentWeightKg, 3)
        target.history.push({
            at,
            note: `Присоединены заказы перенесённой волны от ${fromDate} (${wave.currentWeightKg} кг)`,
        })
        wave.history.push({ at, note: `Перенесена: ${reason}. Заказы переданы в волну от ${toDate}` })
        wave.status = 'merged'
        wave.mergedInto = target.id
        wave.currentWeightKg = 0
    } else {
        wave.postponedFrom.push(fromDate)
        wave.departureDate = toDate
        wave.cutoffDate = addDays(toDate, -CUTOFF_DAYS_BEFORE)
        wave.status = 'open'
        wave.history.push({ at, note: `Перенесена с ${fromDate} на ${toDate}: ${reason}` })
    }

    return { fromDate, toDate, mergedInto: target ? target.id : null }
}

// Приводит волны в актуальное состояние на сегодня:
// 1) у открытых волн с прошедшим дедлайном закрывает приём или переносит их;
// 2) достраивает расписание, чтобы в каждом направлении было OPEN_WAVES_AHEAD открытых волн.
// Возвращает true, если что-то изменилось и данные нужно сохранить.
function syncWaves(waves, orders, today = todayISO()) {
    let changed = false

    const overdue = waves
        .filter((w) => w.status === 'open' && w.cutoffDate < today)
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate))

    for (const wave of overdue) {
        if (wave.currentWeightKg >= wave.minWeightKg) {
            closeWave(wave, orders, 'Приём закрыт автоматически: наступил дедлайн')
        } else {
            postponeWave(wave, waves, orders, `к закрытию приёма набрано меньше ${wave.minWeightKg} кг`, today)
        }
        changed = true
    }

    for (const direction of Object.keys(DIRECTIONS)) {
        for (let guard = 0; guard < 20; guard += 1) {
            const accepting = waves.filter((w) => w.direction === direction && isAccepting(w, today))
            if (accepting.length >= OPEN_WAVES_AHEAD) break

            const lastDate = waves
                .filter((w) => w.direction === direction && w.status !== 'merged')
                .map((w) => w.departureDate)
                .sort()
                .pop()

            let next = lastDate
                ? addDays(lastDate, WAVE_INTERVAL_DAYS)
                : addDays(today, FIRST_WAVE_OFFSET_DAYS)

            while (addDays(next, -CUTOFF_DAYS_BEFORE) < today) {
                next = addDays(next, WAVE_INTERVAL_DAYS)
            }

            createWave(waves, direction, next, 'Волна создана автоматически по расписанию')
            changed = true
        }
    }

    return changed
}

// Читает волны и заказы, синхронизирует их и сохраняет, если были изменения.
// Если передан fn — он выполняется в той же транзакции.
function withSyncedState(fn) {
    return db.transaction(async ({ read, write }) => {
        const [waves, orders] = await Promise.all([read('waves'), read('orders')])

        if (syncWaves(waves, orders)) {
            await Promise.all([write('waves', waves), write('orders', orders)])
        }

        return fn ? fn({ waves, orders, read, write }) : { waves, orders }
    })
}

function publicWave(wave) {
    return {
        id: wave.id,
        direction: wave.direction,
        directionLabel: DIRECTIONS[wave.direction]?.label ?? wave.direction,
        departureDate: wave.departureDate,
        cutoffDate: wave.cutoffDate,
        currentWeightKg: wave.currentWeightKg,
        maxWeightKg: wave.maxWeightKg,
        minWeightKg: wave.minWeightKg,
        status: wave.status,
        postponedFrom: wave.postponedFrom,
        mergedInto: wave.mergedInto,
    }
}

function parseDirection(value, { required = false } = {}) {
    if (value === undefined || value === '') {
        if (required) throw new HttpError(400, 'Укажите направление: YKT_DNR или DNR_YKT')
        return null
    }

    if (!DIRECTIONS[value]) {
        throw new HttpError(400, 'Неизвестное направление. Допустимо: YKT_DNR или DNR_YKT')
    }

    return value
}

const byDeparture = (a, b) => a.departureDate.localeCompare(b.departureDate)

module.exports = {
    DIRECTIONS,
    ORDER_STATUSES,
    ORDER_STATUS_LABELS,
    CUTOFF_DAYS_BEFORE,
    directionFromRegion,
    directionToRegion,
    isAccepting,
    createWave,
    closeWave,
    departWave,
    postponeWave,
    pushOrderStatus,
    syncWaves,
    withSyncedState,
    publicWave,
    parseDirection,
    byDeparture,
}
