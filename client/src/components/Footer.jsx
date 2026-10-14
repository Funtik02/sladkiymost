import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer__inner">
                <div className="footer__about">
                    <p className="footer__logo">⇄ Сладкий мост</p>
                    <p>
                        Маркетплейс кондитерских изделий Якутии и Донбасса. Доставляем сборными партиями —
                        волнами раз в 14 дней в каждом направлении.
                    </p>
                </div>

                <nav aria-label="Разделы сайта">
                    <p className="footer__heading">Разделы</p>
                    <ul className="footer__list">
                        <li><Link to="/catalog/yakutia">Сладости Якутии</Link></li>
                        <li><Link to="/catalog/donbass">Сладости Донбасса</Link></li>
                        <li><Link to="/gift-box">Набор «Север + Юг»</Link></li>
                        <li><Link to="/waves">Загрузка волн</Link></li>
                        <li><Link to="/track">Отследить заказ</Link></li>
                    </ul>
                </nav>

                <div>
                    <p className="footer__heading">Контакты</p>
                    <ul className="footer__list">
                        <li><a href="mailto:hello@sweet-bridge.example">hello@sweet-bridge.example</a></li>
                        <li><a href="tel:+78001234567">8 800 123-45-67</a></li>
                        <li><Link to="/about">О проекте и правилах доставки</Link></li>
                        <li><Link to="/admin">Вход для администратора</Link></li>
                    </ul>
                </div>
            </div>
            <div className="container footer__bottom">
                <span>© 2026 «Сладкий мост». Проект хакатона.</span>
                <span>Оплата картой на сайте — имитация.</span>
            </div>
        </footer>
    )
}
