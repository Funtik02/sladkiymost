import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// При переходе на другую страницу прокручиваем к началу (смена фильтров в URL не в счёт)
export default function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}
