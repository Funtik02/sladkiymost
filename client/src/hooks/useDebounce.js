import { useEffect, useState } from 'react'

// Возвращает value, но обновляет его только через delay мс после последнего изменения
export function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}
