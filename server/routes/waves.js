const express = require('express')
const { DIRECTIONS, byDeparture, isAccepting, parseDirection, publicWave, withSyncedState } = require('../lib/waves')

const router = express.Router()

// Ближайшие открытые волны (приём заказов ещё идёт)
router.get('/waves', async (req, res) => {
    const direction = parseDirection(req.query.direction)
    const { waves } = await withSyncedState()

    res.json(
        waves
            .filter((w) => isAccepting(w) && (!direction || w.direction === direction))
            .sort(byDeparture)
            .map(publicWave)
    )
})

// Загрузка ближайших волн в обоих направлениях — для дашборда
router.get('/waves/load', async (req, res) => {
    const { waves } = await withSyncedState()
    const result = {}

    for (const direction of Object.keys(DIRECTIONS)) {
        result[direction] = waves
            .filter((w) => w.direction === direction && isAccepting(w))
            .sort(byDeparture)
            .slice(0, 3)
            .map(publicWave)
    }

    res.json(result)
})

module.exports = router
