// Сезонные правила доставки. Сезон определяется по месяцу ОТПРАВКИ волны.
// Копия этих правил есть на сервере: server/lib/season.js — меняйте синхронно.

const SEASONS = {
    winter: {
        key: 'winter',
        label: 'Зима',
        thermoRequired: true,
        extraDays: 0,
        reason: 'защита от мороза',
    },
    summer: {
        key: 'summer',
        label: 'Лето',
        thermoRequired: true,
        extraDays: 0,
        reason: 'защита от перегрева',
    },
    offseason: {
        key: 'offseason',
        label: 'Межсезонье',
        thermoRequired: false,
        extraDays: 7,
        reason: 'межсезонье на трассе: срок доставки +7 дней',
    },
    calm: {
        key: 'calm',
        label: 'Без ограничений',
        thermoRequired: false,
        extraDays: 0,
        reason: '',
    },
}

// month — номер месяца 1–12
export function getSeason(month) {
    if ([12, 1, 2].includes(month)) return SEASONS.winter // термоупаковка обязательна
    if ([6, 7, 8].includes(month)) return SEASONS.summer // термоупаковка обязательна
    if ([5, 11].includes(month)) return SEASONS.offseason // +7 дней к сроку
    return SEASONS.calm // март–апрель, сентябрь–октябрь
}

// '2026-11-07' → 11
export function getMonthFromISO(isoDate) {
    return Number(String(isoDate).slice(5, 7))
}

export function getWaveSeason(wave) {
    return getSeason(getMonthFromISO(wave.departureDate))
}
