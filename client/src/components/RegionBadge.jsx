import { REGIONS } from '../utils/regions'

export default function RegionBadge({ region, small = false }) {
    const info = REGIONS[region]
    if (!info) return null

    return (
        <span className={`region-badge region-badge--${info.theme} ${small ? 'region-badge--small' : ''}`}>
            <span aria-hidden="true">{info.theme === 'yakutia' ? '❄' : '☀'}</span> {region}
        </span>
    )
}
