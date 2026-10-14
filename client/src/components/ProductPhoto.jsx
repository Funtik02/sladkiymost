import { useState } from 'react'
import { photoUrl } from '../utils/format'
import { REGIONS } from '../utils/regions'

// Фото товара; если файл не загрузился — аккуратная заглушка вместо «битой» картинки
export default function ProductPhoto({ product, className = '', eager = false }) {
    const src = photoUrl(product.photo)
    const [failedSrc, setFailedSrc] = useState(null)
    const theme = REGIONS[product.region]?.theme ?? 'yakutia'

    if (!src || failedSrc === src) {
        return (
            <div className={`photo-fallback photo-fallback--${theme} ${className}`} role="img" aria-label={product.name}>
                <span aria-hidden="true">🍬</span>
            </div>
        )
    }

    return (
        <img
            className={className}
            src={src}
            alt={product.name}
            width="400"
            height="300"
            loading={eager ? 'eager' : 'lazy'}
            onError={() => setFailedSrc(src)}
        />
    )
}
