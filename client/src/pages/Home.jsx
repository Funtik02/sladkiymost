import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { getWavesLoad } from '../api/waves'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import ProductCard from '../components/ProductCard'
import WaveInfo from '../components/WaveInfo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFetch } from '../hooks/useFetch'
import { DIRECTION_CODES, REGIONS } from '../utils/regions'

const STEPS = [
    { icon: '🛒', title: 'Выбираете сладости', text: 'Конфеты ЯХК из Якутска или вафли и мармелад из Донецка — в одной корзине товары одного региона.' },
    { icon: '📦', title: 'Заказ попадает в волну', text: 'Волна — сборная партия, которая уходит раз в 14 дней. Приём заказов закрывается за 3 дня до отправки.' },
    { icon: '📉', title: 'Чем полнее волна — тем дешевле', text: 'Базовый тариф 500 ₽/кг. Волна заполнена больше чем на 50 % — скидка 20 %, больше чем на 80 % — 35 %.' },
    { icon: '🎁', title: 'Забираете на пункте выдачи', text: 'Через 10–14 дней после отправки заказ ждёт вас в пункте выдачи в Якутске или Донецке.' },
]

function PopularProducts() {
    const { data, error, loading, reload } = useFetch(
        (signal) =>
            Promise.all([
                getProducts({ region: 'Якутия', sort: 'popular', limit: 4 }, signal),
                getProducts({ region: 'ДНР', sort: 'popular', limit: 4 }, signal),
                getWavesLoad(signal),
            ]),
        []
    )

    if (loading && !data) return <Loader label="Загружаем популярные товары…" />
    if (error && !data) return <ErrorMessage error={error} onRetry={reload} />

    const [yakutia, donbass, load] = data

    return (
        <div className="popular">
            {[
                { region: REGIONS['Якутия'], products: yakutia },
                { region: REGIONS['ДНР'], products: donbass },
            ].map(({ region, products }) => (
                <div key={region.slug} className={`popular__group theme-${region.theme}`}>
                    <div className="section-head">
                        <h3 className="section-head__title">{region.title}</h3>
                        <Link to={`/catalog/${region.slug}`} className="link">
                            Вся витрина →
                        </Link>
                    </div>
                    <div className="product-grid">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} waves={load[region.direction]} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function NearestWaves() {
    const { data, error, loading, reload } = useFetch((signal) => getWavesLoad(signal), [])

    if (loading && !data) return <Loader label="Загружаем расписание волн…" />
    if (error && !data) return <ErrorMessage error={error} onRetry={reload} />

    return (
        <div className="nearest-waves">
            {DIRECTION_CODES.map((direction) => (
                <WaveInfo key={direction} direction={direction} wave={data[direction][0]} />
            ))}
        </div>
    )
}

export default function Home() {
    useDocumentTitle(null)

    return (
        <>
            <section className="hero">
                <div className="container hero__inner">
                    <p className="hero__eyebrow">Маркетплейс сладостей двух регионов</p>
                    <h1 className="hero__title">
                        Сладкий мост: <span className="hero__north">Якутия</span> ⇄{' '}
                        <span className="hero__south">Донбасс</span>
                    </h1>
                    <p className="hero__text">
                        Конфеты, пряники и торты из Якутска едут в Донецк, а вафли, мармелад и шоколад из Донецка — в
                        Якутск. Заказы собираются в общие партии-волны: вместе везти дешевле, а чем полнее волна, тем
                        ниже цена доставки для каждого.
                    </p>
                    <div className="hero__actions">
                        <Link to="/waves" className="btn btn--light">
                            Как загружены волны
                        </Link>
                        <Link to="/gift-box" className="btn btn--outline-light">
                            Собрать набор «Север + Юг»
                        </Link>
                    </div>
                </div>
            </section>

            <section className="container section" aria-labelledby="showcases-title">
                <h2 id="showcases-title" className="visually-hidden">
                    Витрины регионов
                </h2>
                <div className="showcases">
                    <Link to="/catalog/yakutia" className="showcase showcase--yakutia">
                        <span className="showcase__emoji" aria-hidden="true">
                            ❄🍫
                        </span>
                        <span className="showcase__title">Сладости Якутии</span>
                        <span className="showcase__text">
                            Конфеты, шоколад, пряники, зефир и торты фабрики ЯХК. Едут волной «Якутия → ДНР».
                        </span>
                        <span className="showcase__cta">Открыть витрину →</span>
                    </Link>
                    <Link to="/catalog/donbass" className="showcase showcase--donbass">
                        <span className="showcase__emoji" aria-hidden="true">
                            ☀🧇
                        </span>
                        <span className="showcase__title">Сладости Донбасса</span>
                        <span className="showcase__text">
                            Вафли, мармелад, печенье и конфеты донецких производителей. Едут волной «ДНР → Якутия».
                        </span>
                        <span className="showcase__cta">Открыть витрину →</span>
                    </Link>
                </div>
            </section>

            <section className="container section" aria-labelledby="waves-title">
                <div className="section-head">
                    <h2 id="waves-title" className="section-title">
                        Ближайшие отправки
                    </h2>
                    <Link to="/waves" className="link">
                        Дашборд загрузки →
                    </Link>
                </div>
                <NearestWaves />
            </section>

            <section className="container section" aria-labelledby="how-title">
                <h2 id="how-title" className="section-title">
                    Как это работает
                </h2>
                <ol className="steps">
                    {STEPS.map((step, index) => (
                        <li key={step.title} className="step">
                            <span className="step__number">{index + 1}</span>
                            <span className="step__icon" aria-hidden="true">
                                {step.icon}
                            </span>
                            <h3 className="step__title">{step.title}</h3>
                            <p className="step__text">{step.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="container section" aria-labelledby="popular-title">
                <h2 id="popular-title" className="section-title">
                    Популярное в обоих регионах
                </h2>
                <PopularProducts />
            </section>
        </>
    )
}
