import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getMyOrders } from '../api/account'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import OrderCard from '../components/OrderCard'
import TextField from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFetch } from '../hooks/useFetch'
import { formatPhone, isValidEmail, isValidPhone, normalizePhone } from '../utils/validation'

const PASSWORD_MIN = 8

const REASONS = {
    cart: 'Войдите или зарегистрируйтесь, чтобы добавлять товары в корзину. После входа товар сразу окажется в корзине.',
    checkout: 'Чтобы оформить заказ, войдите в личный кабинет или зарегистрируйтесь.',
    track: 'Отслеживание заказов доступно после входа в личный кабинет.',
}

export default function Account() {
    const { isLoggedIn, checking } = useAuth()
    useDocumentTitle('Личный кабинет')

    if (checking) {
        return (
            <div className="container section">
                <Loader label="Проверяем вход…" />
            </div>
        )
    }

    return isLoggedIn ? <Cabinet /> : <AuthScreen />
}

function safeNext(value) {
    return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

function AuthScreen() {
    const [searchParams] = useSearchParams()
    const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
    const next = safeNext(searchParams.get('next'))
    const reason = REASONS[searchParams.get('reason')]

    return (
        <div className="container section auth">
            <h1 className="page-title">Личный кабинет</h1>
            <p className="page-lead">
                Войдите, чтобы покупать сладости и видеть статусы своих заказов. Заказы сохраняются здесь — и только у
                вас.
            </p>

            {reason && (
                <p className="account-note" role="status">
                    {reason}
                </p>
            )}

            <div className="card auth__card">
                <div className="segmented auth__tabs" role="tablist" aria-label="Вход или регистрация">
                    {[
                        ['login', 'Вход'],
                        ['register', 'Регистрация'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={mode === value}
                            className={`segmented__option ${mode === value ? 'segmented__option--active' : ''}`}
                            onClick={() => setMode(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {mode === 'login' ? <LoginForm next={next} /> : <RegisterForm next={next} />}
            </div>
        </div>
    )
}

function useAfterAuth(next) {
    const navigate = useNavigate()
    return () => navigate(next ?? '/account', { replace: true })
}

function LoginForm({ next }) {
    const { login } = useAuth()
    const done = useAfterAuth(next)
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!form.email.trim() || !form.password) {
            setError('Введите email и пароль')
            return
        }

        setSubmitting(true)
        setError(null)
        try {
            await login(form.email.trim(), form.password)
            done()
        } catch (err) {
            setError(err.message)
            setSubmitting(false)
        }
    }

    return (
        <form className="auth__form" onSubmit={onSubmit} noValidate>
            <TextField
                id="login-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
            />
            <TextField
                id="login-password"
                label="Пароль"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
            />
            {error && (
                <p className="field__error" role="alert">
                    {error}
                </p>
            )}
            <button type="submit" className="btn btn--primary btn--large btn--block" disabled={submitting}>
                {submitting ? 'Входим…' : 'Войти'}
            </button>
        </form>
    )
}

function validateRegister(form) {
    const errors = {}
    if (form.name.trim().length < 2) errors.name = 'Укажите имя'
    if (!isValidEmail(form.email)) errors.email = 'Проверьте email: пример — name@mail.ru'
    if (form.phone.trim() && !isValidPhone(form.phone)) errors.phone = 'Телефон в формате +7 XXX XXX-XX-XX'
    if (form.password.length < PASSWORD_MIN) errors.password = `Не короче ${PASSWORD_MIN} символов`
    if (form.repeat !== form.password) errors.repeat = 'Пароли не совпадают'
    return errors
}

function RegisterForm({ next }) {
    const { register } = useAuth()
    const done = useAfterAuth(next)
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', repeat: '' })
    const [attempted, setAttempted] = useState(false)
    const [serverError, setServerError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const errors = attempted ? validateRegister(form) : {}
    const field = (key) => ({
        value: form[key],
        error: errors[key],
        onChange: (event) => setForm({ ...form, [key]: event.target.value }),
    })

    const onSubmit = async (event) => {
        event.preventDefault()
        setAttempted(true)
        setServerError(null)
        if (Object.keys(validateRegister(form)).length > 0) return

        setSubmitting(true)
        try {
            await register({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() ? normalizePhone(form.phone) : '',
                password: form.password,
            })
            done()
        } catch (err) {
            setServerError(err.message)
            setSubmitting(false)
        }
    }

    return (
        <form className="auth__form" onSubmit={onSubmit} noValidate>
            <TextField id="register-name" label="Имя" autoComplete="name" required {...field('name')} />
            <TextField id="register-email" label="Email" type="email" autoComplete="email" required {...field('email')} />
            <TextField
                id="register-phone"
                label="Телефон"
                type="tel"
                autoComplete="tel"
                placeholder="+7 900 000-00-00"
                hint="Необязательно — подставим при оформлении заказа"
                {...field('phone')}
            />
            <TextField
                id="register-password"
                label="Пароль"
                type="password"
                autoComplete="new-password"
                hint={`Не короче ${PASSWORD_MIN} символов`}
                required
                {...field('password')}
            />
            <TextField id="register-repeat" label="Пароль ещё раз" type="password" autoComplete="new-password" required {...field('repeat')} />
            {serverError && (
                <p className="field__error" role="alert">
                    {serverError}
                </p>
            )}
            <button type="submit" className="btn btn--primary btn--large btn--block" disabled={submitting}>
                {submitting ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
            </button>
            <p className="muted auth__note">
                Регистрируясь, вы соглашаетесь с{' '}
                <Link to="/privacy" className="link" target="_blank">
                    политикой конфиденциальности
                </Link>
                .
            </p>
        </form>
    )
}

const FILTERS = [
    ['active', 'Текущие'],
    ['done', 'Полученные'],
]

function Cabinet() {
    const { user, token, logout, forget } = useAuth()
    const navigate = useNavigate()
    const [filter, setFilter] = useState('active')

    const { data, error, loading, reload } = useFetch(
        (signal) =>
            getMyOrders(token, signal).catch((err) => {
                if (err.status === 401) forget()
                throw err
            }),
        [token]
    )

    const orders = data ?? []
    const groups = {
        active: orders.filter((o) => o.status !== 'received'),
        done: orders.filter((o) => o.status === 'received'),
    }
    const visible = groups[filter]

    return (
        <div className="container section cabinet">
            <div className="cabinet__head">
                <div>
                    <h1 className="page-title">Личный кабинет</h1>
                    <p className="cabinet__user">
                        <strong>{user.name}</strong> · {user.email}
                        {user.phone && ` · ${formatPhone(user.phone)}`}
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={async () => {
                        await logout()
                        navigate('/account', { replace: true })
                    }}
                >
                    Выйти
                </button>
            </div>

            <section aria-labelledby="my-orders-title">
                <div className="cabinet__orders-head">
                    <h2 id="my-orders-title" className="section-title">
                        Мои заказы
                    </h2>
                    {orders.length > 0 && (
                        <div className="segmented segmented--compact" role="tablist" aria-label="Какие заказы показать">
                            {FILTERS.map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === value}
                                    className={`segmented__option ${filter === value ? 'segmented__option--active' : ''}`}
                                    onClick={() => setFilter(value)}
                                >
                                    {label} ({groups[value].length})
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading && !data && <Loader label="Загружаем ваши заказы…" />}
                {error && !data && <ErrorMessage error={error} onRetry={reload} />}

                {data && orders.length === 0 && (
                    <div className="state">
                        <p className="state__title">Заказов пока нет</p>
                        <p className="state__text">Здесь появятся заказы, которые вы оформите, войдя в этот аккаунт.</p>
                        <div className="state__actions">
                            <Link to="/catalog/yakutia" className="btn btn--primary">
                                Сладости Якутии
                            </Link>
                            <Link to="/catalog/donbass" className="btn btn--primary">
                                Сладости Донбасса
                            </Link>
                        </div>
                    </div>
                )}

                {data && orders.length > 0 && visible.length === 0 && (
                    <p className="muted">{filter === 'active' ? 'Все заказы уже получены.' : 'Полученных заказов пока нет.'}</p>
                )}

                <ul className="my-orders">
                    {visible.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </ul>
            </section>
        </div>
    )
}
