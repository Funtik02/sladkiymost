// Расчёт доставки «волной» — чистые функции без побочных эффектов.
//
// Клиент считает здесь для мгновенного показа в корзине, а сервер повторяет
// тот же расчёт при создании заказа (server/lib/delivery.js) и сумме с клиента
// не доверяет. Меняете формулу — меняйте в обоих файлах.
//
// Правила (из ТЗ):
//   доставка = вес_заказа_кг × 500 ₽ × (1 − скидка) + термоупаковка 150 ₽
//   заполненность = (текущий вес волны + вес заказа) / 300 кг
//   скидка: заполненность > 50 % → 20 %, > 80 % → 35 %
//   все суммы округляются до целых рублей

import { formatKg } from './format.js'
import { getMonthFromISO, getSeason } from './season.js'

export const TARIFF_PER_KG = 500
export const MIN_WAVE_KG = 50
export const MAX_WAVE_KG = 300
export const THERMO_PRICE = 150
export const BASE_DELIVERY_DAYS = { min: 10, max: 14 }
export const SHELF_LIFE_RESERVE_DAYS = 7

// От большей скидки к меньшей; порог сравнивается строго («больше 50 %»)
export const DISCOUNT_TIERS = [
    { fill: 0.8, discount: 0.35 },
    { fill: 0.5, discount: 0.2 },
]

const roundTo = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits

// items: [{ weight_g, qty }] → вес в кг (с точностью до грамма)
export function calcWeightKg(items) {
    const grams = items.reduce((sum, item) => sum + item.weight_g * item.qty, 0)
    return roundTo(grams / 1000, 3)
}

// fillRatio: 0…1 → доля скидки (0, 0.2 или 0.35)
export function getDiscount(fillRatio) {
    const tier = DISCOUNT_TIERS.find((t) => fillRatio > t.fill)
    return tier ? tier.discount : 0
}

// Термоупаковка обязательна зимой и летом, если в заказе есть термочувствительные товары
export function isThermoRequired(items, month) {
    return getSeason(month).thermoRequired && items.some((item) => item.temp_sensitive)
}

// Срок доставки 10–14 дней, в межсезонье (май, ноябрь) +7 дней
export function getDeliveryDays(month) {
    const extra = getSeason(month).extraDays
    return {
        min: BASE_DELIVERY_DAYS.min + extra,
        max: BASE_DELIVERY_DAYS.max + extra,
    }
}

// Допущение команды: срок годности должен покрывать максимальный срок доставки + 7 дней запаса
export function getRequiredShelfLifeDays(month) {
    return getDeliveryDays(month).max + SHELF_LIFE_RESERVE_DAYS
}

export function isShelfLifeOk(shelfLifeDays, month) {
    return shelfLifeDays >= getRequiredShelfLifeDays(month)
}

export function calcDelivery({ items, wave, thermoChosen = false }) {
    const month = getMonthFromISO(wave.departureDate)
    const maxKg = wave.maxWeightKg || MAX_WAVE_KG
    const weightKg = calcWeightKg(items)
    const waveWeightAfterKg = roundTo(wave.currentWeightKg + weightKg, 3)
    const fillRatio = waveWeightAfterKg / maxKg
    const discount = getDiscount(fillRatio)

    const baseCost = Math.round(weightKg * TARIFF_PER_KG)
    const discountAmount = Math.round(baseCost * discount)
    const thermoRequired = isThermoRequired(items, month)
    const thermoApplied = thermoRequired || Boolean(thermoChosen)
    const thermoCost = thermoApplied ? THERMO_PRICE : 0

    return {
        weightKg,
        tariffPerKg: TARIFF_PER_KG,
        baseCost,
        waveWeightAfterKg,
        fillRatio,
        fillPercent: Math.round(fillRatio * 100),
        discount,
        discountAmount,
        shippingCost: baseCost - discountAmount,
        thermoRequired,
        thermoApplied,
        thermoCost,
        total: baseCost - discountAmount + thermoCost,
        fits: waveWeightAfterKg <= maxKg,
        freeCapacityKg: roundTo(Math.max(0, maxKg - wave.currentWeightKg), 3),
        deliveryDays: getDeliveryDays(month),
    }
}

// --- Помощники для интерфейса ----------------------------------------------

// Текущий тариф за кг при данной загрузке волны
export function getTariffPerKg(fillRatio) {
    return Math.round(TARIFF_PER_KG * (1 - getDiscount(fillRatio)))
}

// Следующий порог скидки: сколько кг ещё нужно волне, чтобы доставка подешевела.
// Порог строгий («больше 150 кг»), поэтому считаем в граммах: нужно перешагнуть
// порог хотя бы на 1 г, а ответ округляем вверх до 0,1 кг (при 140 кг — 10,1 кг).
export function getNextDiscountTier(totalWaveKg, maxKg = MAX_WAVE_KG) {
    const fill = totalWaveKg / maxKg
    const next = [...DISCOUNT_TIERS].reverse().find((t) => fill <= t.fill)
    if (!next) return null

    const thresholdKg = next.fill * maxKg
    const neededGrams = Math.round(thresholdKg * 1000) - Math.round(totalWaveKg * 1000) + 1
    const neededKg = Math.ceil(neededGrams / 100) / 10

    return { discount: next.discount, thresholdKg, neededKg }
}

// Ожидаемые даты прибытия: дата отправки + 10…14 дней (в межсезонье 17…21)
export function getExpectedArrival(wave) {
    const days = getDeliveryDays(getMonthFromISO(wave.departureDate))
    return {
        from: addDaysISO(wave.departureDate, days.min),
        to: addDaysISO(wave.departureDate, days.max),
    }
}

// Позиции, которые не доедут волной из-за срока годности
export function getExpiringItems(items, wave) {
    const month = getMonthFromISO(wave.departureDate)
    return items.filter((item) => !isShelfLifeOk(item.shelf_life_days, month))
}

// Почему волна недоступна для этого заказа (или null, если доступна)
export function getWaveBlocker(items, wave) {
    const calc = calcDelivery({ items, wave })
    if (!calc.fits) {
        return `Не помещается: свободно ${formatKg(calc.freeCapacityKg)}, а заказ весит ${formatKg(calc.weightKg)}`
    }

    const expiring = getExpiringItems(items, wave)
    if (expiring.length > 0) {
        return `Не доедет по сроку годности: ${expiring.map((i) => `«${i.name}»`).join(', ')}`
    }

    return null
}

// Проверка срока годности по открытым волнам направления (waves — по возрастанию даты).
//   canAdd    — есть хотя бы одна волна, с которой товар успеет доехать;
//   nearestOk — успевает ли с ближайшей волной.
// Без данных о волнах проверяем по базовому сроку (14 дней + 7 дней запаса).
export function checkShelfLife(shelfLifeDays, waves = []) {
    if (waves.length === 0) {
        const requiredDays = BASE_DELIVERY_DAYS.max + SHELF_LIFE_RESERVE_DAYS
        const ok = shelfLifeDays >= requiredDays
        return { canAdd: ok, nearestOk: ok, requiredDays, nearestWave: null, firstOkWave: null }
    }

    const nearestWave = waves[0]
    const requiredDays = getRequiredShelfLifeDays(getMonthFromISO(nearestWave.departureDate))
    const firstOkWave = waves.find((w) => isShelfLifeOk(shelfLifeDays, getMonthFromISO(w.departureDate))) ?? null

    return {
        canAdd: Boolean(firstOkWave),
        nearestOk: shelfLifeDays >= requiredDays,
        requiredDays,
        nearestWave,
        firstOkWave,
    }
}

export function addDaysISO(iso, days) {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d + days))
    return date.toISOString().slice(0, 10)
}
