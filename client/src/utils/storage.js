// Безопасная работа с localStorage / sessionStorage: битые данные, переполнение
// или запрет хранилища (приватный режим) не должны ломать приложение.

export function readJSON(storage, key, fallback) {
    try {
        const raw = storage.getItem(key)
        return raw === null ? fallback : JSON.parse(raw)
    } catch {
        return fallback
    }
}

export function writeJSON(storage, key, value) {
    try {
        storage.setItem(key, JSON.stringify(value))
    } catch {
        // хранилище недоступно — работаем без сохранения
    }
}

export function removeKey(storage, key) {
    try {
        storage.removeItem(key)
    } catch {
        // ничего страшного
    }
}

// --- Последние заказы пользователя (для страницы /track) ---------------------

const RECENT_ORDERS_KEY = 'sweet-bridge:recent-orders'
const RECENT_ORDERS_LIMIT = 10

export function getRecentOrders() {
    const list = readJSON(localStorage, RECENT_ORDERS_KEY, [])
    if (!Array.isArray(list)) return []

    return list.filter((entry) => entry && typeof entry.id === 'string' && /^\d{6}$/.test(entry.id))
}

export function rememberOrder(id) {
    const rest = getRecentOrders().filter((entry) => entry.id !== id)
    writeJSON(localStorage, RECENT_ORDERS_KEY, [{ id, savedAt: new Date().toISOString() }, ...rest].slice(0, RECENT_ORDERS_LIMIT))
}

export function forgetRecentOrders() {
    removeKey(localStorage, RECENT_ORDERS_KEY)
}
