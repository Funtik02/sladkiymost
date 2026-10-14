import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Загрузка данных с отменой устаревших запросов.
// fetcher(signal) → Promise; deps — когда перезапрашивать.
// reload() перезапрашивает, оставляя на экране прежние данные (для кнопок «Обновить»).
export function useFetch(fetcher, deps) {
    const [state, setState] = useState({ data: null, error: null, loading: true })
    const [reloadKey, setReloadKey] = useState(0)
    const fetcherRef = useRef(fetcher)
    const depsKey = JSON.stringify(deps)
    const lastDepsKey = useRef(depsKey)

    // Всегда вызываем свежую функцию загрузки, не перезапуская эффект на каждый рендер
    useLayoutEffect(() => {
        fetcherRef.current = fetcher
    })

    useEffect(() => {
        const controller = new AbortController()
        const depsChanged = lastDepsKey.current !== depsKey
        lastDepsKey.current = depsKey

        // Новые параметры — старые данные уже не про то, прячем их
        setState((prev) => ({ data: depsChanged ? null : prev.data, error: null, loading: true }))

        fetcherRef.current(controller.signal)
            .then((data) => setState({ data, error: null, loading: false }))
            .catch((error) => {
                if (error.name === 'AbortError') return
                setState((prev) => ({ data: prev.data, error, loading: false }))
            })

        return () => controller.abort()
    }, [depsKey, reloadKey])

    const reload = useCallback(() => setReloadKey((key) => key + 1), [])
    const setData = useCallback((updater) => {
        setState((prev) => ({
            ...prev,
            data: typeof updater === 'function' ? updater(prev.data) : updater,
        }))
    }, [])

    return { ...state, reload, setData }
}
