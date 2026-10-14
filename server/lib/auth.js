const crypto = require('crypto')
const HttpError = require('./httpError')

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000

const tokens = new Map()

function getAdminPassword() {
    return process.env.ADMIN_PASSWORD || 'admin'
}

function safeEqual(a, b) {
    const hash = (value) => crypto.createHash('sha256').update(String(value)).digest()
    return crypto.timingSafeEqual(hash(a), hash(b))
}

function login(password) {
    if (typeof password !== 'string' || !safeEqual(password, getAdminPassword())) {
        return null
    }

    const token = crypto.randomBytes(32).toString('hex')
    tokens.set(token, Date.now() + TOKEN_TTL_MS)

    return token
}

function logout(token) {
    tokens.delete(token)
}

function requireAdmin(req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '')
    const token = match ? match[1] : null
    const expiresAt = token ? tokens.get(token) : undefined

    if (!token) {
        return next(new HttpError(401, 'Требуется вход администратора'))
    }

    if (!expiresAt || expiresAt < Date.now()) {
        tokens.delete(token)
        return next(new HttpError(401, 'Сессия администратора истекла. Войдите снова'))
    }

    req.adminToken = token
    next()
}

module.exports = {
    login,
    logout,
    requireAdmin,
}
