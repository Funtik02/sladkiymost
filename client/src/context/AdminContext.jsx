import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as adminApi from '../api/admin'
import { readJSON, removeKey, writeJSON } from '../utils/storage'

// Токен администратора живёт в sessionStorage: закрыли вкладку — нужно войти снова
const STORAGE_KEY = 'sweet-bridge:admin-token'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
    const [token, setToken] = useState(() => {
        const saved = readJSON(sessionStorage, STORAGE_KEY, null)
        return typeof saved === 'string' ? saved : null
    })
    const [sessionExpired, setSessionExpired] = useState(false)

    const login = useCallback(async (password) => {
        const { token: newToken } = await adminApi.login(password)
        writeJSON(sessionStorage, STORAGE_KEY, newToken)
        setSessionExpired(false)
        setToken(newToken)
    }, [])

    const forget = useCallback(() => {
        removeKey(sessionStorage, STORAGE_KEY)
        setToken(null)
    }, [])

    const logout = useCallback(async () => {
        const current = token
        forget()
        if (current) {
            // Сервер забудет токен; если он недоступен — ничего страшного
            await adminApi.logout(current).catch(() => {})
        }
    }, [token, forget])

    // Обёртка для запросов админки: при 401 сбрасываем токен,
    // и защищённый маршрут сам отправит на страницу входа
    const call = useCallback(
        async (fn, ...args) => {
            try {
                return await fn(token, ...args)
            } catch (error) {
                if (error.status === 401) {
                    setSessionExpired(true)
                    forget()
                }
                throw error
            }
        },
        [token, forget]
    )

    const value = useMemo(
        () => ({ token, isAuthenticated: Boolean(token), sessionExpired, login, logout, call }),
        [token, sessionExpired, login, logout, call]
    )

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
    const context = useContext(AdminContext)
    if (!context) throw new Error('useAdmin должен использоваться внутри AdminProvider')
    return context
}
