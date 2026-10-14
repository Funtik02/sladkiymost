// Общий fetch для всех запросов к API: JSON туда и обратно, единые ошибки.
// Сервер отвечает ошибками вида { error: "сообщение" } — их текст и показываем.

export class ApiError extends Error {
    constructor(message, status) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

export async function request(path, { method = 'GET', body, token, signal } = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`

    let response

    try {
        response = await fetch(`/api${path}`, {
            method,
            headers,
            signal,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
    } catch (error) {
        if (error.name === 'AbortError') throw error
        throw new ApiError('Нет связи с сервером. Проверьте подключение и попробуйте ещё раз', 0)
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        // Прокси Vite отвечает 5xx без JSON, если API не запущен
        const fallback = response.status >= 500
            ? 'Сервер недоступен. Убедитесь, что он запущен, и попробуйте ещё раз'
            : `Ошибка запроса (${response.status})`

        throw new ApiError(data?.error || fallback, response.status)
    }

    return data
}

// { a: 1, b: '', c: null } → '?a=1' (пустые значения не передаём)
export function toQuery(params) {
    const search = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            search.set(key, String(value))
        }
    })

    const query = search.toString()
    return query ? `?${query}` : ''
}
