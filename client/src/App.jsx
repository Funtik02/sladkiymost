import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import RequireAdmin from './components/RequireAdmin'
import ScrollToTop from './components/ScrollToTop'
import Toast from './components/Toast'
import { AdminProvider } from './context/AdminContext'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'
import About from './pages/About'
import Cart from './pages/Cart'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import Favorites from './pages/Favorites'
import GiftBox from './pages/GiftBox'
import Home from './pages/Home'
import LoadDashboard from './pages/LoadDashboard'
import NotFound from './pages/NotFound'
import Order from './pages/Order'
import OrderSuccess from './pages/OrderSuccess'
import Product from './pages/Product'
import Track from './pages/Track'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminWaves from './pages/admin/AdminWaves'

// Флаги v7 включают будущее поведение React Router и убирают предупреждения в консоли
const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true }

export default function App() {
    return (
        <BrowserRouter future={ROUTER_FUTURE}>
            <ToastProvider>
                <FavoritesProvider>
                    <CartProvider>
                        <AdminProvider>
                            <ScrollToTop />
                            <a className="skip-link" href="#main">
                                Перейти к содержимому
                            </a>
                            <div className="app">
                                <Header />
                                <main id="main" className="main" tabIndex={-1}>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/catalog/:region" element={<Catalog />} />
                                        <Route path="/product/:id" element={<Product />} />
                                        <Route path="/cart" element={<Cart />} />
                                        <Route path="/checkout" element={<Checkout />} />
                                        <Route path="/order/:id" element={<Order />} />
                                        <Route path="/order/:id/success" element={<OrderSuccess />} />
                                        <Route path="/track" element={<Track />} />
                                        <Route path="/favorites" element={<Favorites />} />
                                        <Route path="/gift-box" element={<GiftBox />} />
                                        <Route path="/waves" element={<LoadDashboard />} />
                                        <Route path="/about" element={<About />} />
                                        <Route path="/admin">
                                            <Route index element={<AdminLogin />} />
                                            <Route element={<RequireAdmin />}>
                                                <Route path="products" element={<AdminProducts />} />
                                                <Route path="waves" element={<AdminWaves />} />
                                                <Route path="orders" element={<AdminOrders />} />
                                            </Route>
                                        </Route>
                                        <Route path="*" element={<NotFound />} />
                                    </Routes>
                                </main>
                                <Footer />
                            </div>
                            <Toast />
                        </AdminProvider>
                    </CartProvider>
                </FavoritesProvider>
            </ToastProvider>
        </BrowserRouter>
    )
}
