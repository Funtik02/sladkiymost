// Значок 🌡 с подсказкой — она показывается при наведении и при фокусе с клавиатуры
export default function ThermoBadge() {
    return (
        <span className="thermo-badge" tabIndex={0} role="img" aria-label="Чувствителен к температуре">
            <span aria-hidden="true">🌡</span>
            <span className="thermo-badge__tip" aria-hidden="true">
                чувствителен к температуре
            </span>
        </span>
    )
}
