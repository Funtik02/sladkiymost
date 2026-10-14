import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDebounce } from './useDebounce'

// Поле ввода, связанное с параметром URL через debounce:
// пользователь печатает — URL обновляется через delay мс после паузы;
// URL меняется снаружи (сброс фильтров, «назад») — поле подхватывает новое значение.
export function useDebouncedParam(urlValue, onCommit, delay = 300) {
    const [value, setValue] = useState(urlValue)
    const debounced = useDebounce(value, delay)
    const committed = useRef(urlValue)
    const onCommitRef = useRef(onCommit)

    useLayoutEffect(() => {
        onCommitRef.current = onCommit
    })

    // URL → поле
    useEffect(() => {
        if (urlValue !== committed.current) {
            committed.current = urlValue
            setValue(urlValue)
        }
    }, [urlValue])

    // поле → URL (после паузы)
    useEffect(() => {
        if (debounced !== committed.current) {
            committed.current = debounced
            onCommitRef.current(debounced)
        }
    }, [debounced])

    return [value, setValue]
}
