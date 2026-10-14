import { CARD_DESIGNS } from '../utils/gift'

// Открытка к подарку — живой предпросмотр и показ в заказе
export default function GiftCardPreview({ design = 'north', text, from, to }) {
    const info = CARD_DESIGNS.find((d) => d.id === design) ?? CARD_DESIGNS[0]

    return (
        <figure className={`gift-card gift-card--${info.id}`} aria-label={`Открытка «${info.label}»`}>
            <div className="gift-card__decor" aria-hidden="true">
                {info.emoji}
            </div>
            <figcaption className="gift-card__content">
                <p className="gift-card__to">{to ? `Для: ${to}` : 'Для: имя получателя'}</p>
                <p className={`gift-card__text ${text ? '' : 'gift-card__text--placeholder'}`}>
                    {text || 'Здесь будет текст вашего поздравления'}
                </p>
                <p className="gift-card__from">{from ? `От: ${from}` : 'От: ваше имя'}</p>
            </figcaption>
        </figure>
    )
}
