// Простые SVG-иконки. Декоративные: aria-hidden, подпись даёт кнопка или текст рядом.

function Icon({ children, size = 22, ...props }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {children}
        </svg>
    )
}

export function HeartIcon({ filled = false, ...props }) {
    return (
        <Icon {...props} fill={filled ? 'currentColor' : 'none'}>
            <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
        </Icon>
    )
}

export function CartIcon(props) {
    return (
        <Icon {...props}>
            <path d="M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8z" />
            <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </Icon>
    )
}

export function MenuIcon(props) {
    return (
        <Icon {...props}>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </Icon>
    )
}

export function CloseIcon(props) {
    return (
        <Icon {...props}>
            <path d="M6 6l12 12M18 6L6 18" />
        </Icon>
    )
}

export function TrashIcon(props) {
    return (
        <Icon {...props}>
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </Icon>
    )
}

export function CopyIcon(props) {
    return (
        <Icon {...props}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h8" />
        </Icon>
    )
}

export function TruckIcon(props) {
    return (
        <Icon {...props}>
            <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
        </Icon>
    )
}

export function CheckIcon(props) {
    return (
        <Icon {...props}>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </Icon>
    )
}

export function RefreshIcon(props) {
    return (
        <Icon {...props}>
            <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
        </Icon>
    )
}

export function SearchIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
        </Icon>
    )
}
