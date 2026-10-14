// Сезонные правила — копия client/src/utils/season.js.
// Меняете правила — меняйте в обоих файлах.

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

// month — номер месяца ОТПРАВКИ волны, 1–12
function getSeason(month) {
    if ([12, 1, 2].includes(month)) return SEASONS.winter
    if ([6, 7, 8].includes(month)) return SEASONS.summer
    if ([5, 11].includes(month)) return SEASONS.offseason
    return SEASONS.calm
}

// '2026-11-07' → 11
function getMonthFromISO(isoDate) {
    return Number(String(isoDate).slice(5, 7))
}

module.exports = {
    getSeason,
    getMonthFromISO,
}
