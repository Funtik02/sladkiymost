import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField from '../components/TextField'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDateTime } from '../utils/format'
import { forgetRecentOrders, getRecentOrders } from '../utils/storage'

export default function Track() {
    useDocumentTitle('Отследить заказ')
    const navigate = useNavigate()
    const [number, setNumber] = useState('')
    const [error, setError] = useState('')
    const [recent, setRecent] = useState(getRecentOrders)

    const handleSubmit = (event) => {
        event.preventDefault()
        const id = number.replace(/\D/g, '')

        if (!/^\d{6}$/.test(id)) {
            setError('Номер заказа — 6 цифр, например 204817')
            return
        }

        navigate(`/order/${id}`)
    }

    return (
        <div className="container section narrow">
            <h1 className="page-title">Где мой заказ?</h1>
            <p className="page-lead">Введите номер заказа — покажем статус, волну и пункт выдачи.</p>

            <form className="card track-form" onSubmit={handleSubmit} noValidate>
                <TextField
                    id="order-number"
                    label="Номер заказа"
                    value={number}
                    error={error}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="например, 204817"
                    onChange={(event) => {
                        setNumber(event.target.value)
                        setError('')
                    }}
                />
                <button type="submit" className="btn btn--primary">
                    Найти заказ
                </button>
            </form>

            <section className="section-sm" aria-labelledby="recent-title">
                <h2 id="recent-title" className="section-subtitle">
                    Ваши последние заказы
                </h2>
                {recent.length === 0 ? (
                    <p className="muted">
                        Здесь появятся номера заказов, оформленных или открытых на этом устройстве.
                    </p>
                ) : (
                    <>
                        <ul className="recent-orders">
                            {recent.map((entry) => (
                                <li key={entry.id}>
                                    <Link to={`/order/${entry.id}`} className="recent-orders__link">
                                        <strong>№{entry.id}</strong>
                                        {entry.savedAt && <span className="muted">{formatDateTime(entry.savedAt)}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => {
                                forgetRecentOrders()
                                setRecent([])
                            }}
                        >
                            Очистить список
                        </button>
                    </>
                )}
            </section>
        </div>
    )
}
