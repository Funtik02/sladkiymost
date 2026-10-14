require('./lib/env')
const express = require('express')
const path = require('path')
const catalogRouter = require('./routes/catalog')
const wavesRouter = require('./routes/waves')
const ordersRouter = require('./routes/orders')
const adminRouter = require('./routes/admin')
const { router: accountRouter } = require('./routes/account')
const HttpError = require('./lib/httpError')
const { withSyncedState } = require('./lib/waves')

const app = express()
const PORT = Number(process.env.API_PORT) || 3001

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

app.use('/images', express.static(path.join(__dirname, 'public', 'images')))

app.get('/', (req, res) => {
    res.json({ message: 'Сладкий мост API работает' })
})

app.use('/api/admin', adminRouter)
app.use('/api', accountRouter)
app.use('/api', catalogRouter)
app.use('/api', wavesRouter)
app.use('/api', ordersRouter)

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Такого адреса API нет' })
})

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)

    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message })
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Некорректный JSON в теле запроса' })
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Слишком большой запрос' })
    }

    console.error('Необработанная ошибка:', err)
    res.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте ещё раз' })
})

app.listen(PORT, async () => {
    console.log(`Сладкий мост API: http://localhost:${PORT}`)

    try {
        await withSyncedState()
    } catch (error) {
        console.error('Не удалось синхронизировать волны:', error.message)
    }
})
