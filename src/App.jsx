import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Импорт вспомогательных компонентов и контексто
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CartProvider } from '@/lib/cartStore.jsx';
import { ThemeProvider } from '@/lib/themeStore.jsx';
import { LanguageProvider } from '@/lib/LanguageContext'; // Провайдер многоязычности

// Импорт макетов (Layouts)
import MainLayout from '@/components/layout/MainLayout';

// Импорт страниц пользователя (Public & Protected Pages)
import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Dashboard from '@/pages/Dashboard';
import Wishlist from '@/pages/Wishlist';
import AllTestimonials from '@/pages/AllTestimonials';

// Импорт страниц авторизации (Auth Pages)
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Импорт страниц панели администратора (Admin Pages)
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminPromos from '@/pages/admin/AdminPromos';

/**
 * Внутренний компонент приложения, который управляет логикой отображения маршрутов
 * и проверяет состояние загрузки данных пользователя.
 */
const AuthenticatedApp = () => {
    const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

    // Логирование состояния для отладки в консоли браузера
    console.log("[App] Текущее состояние загрузки:", {
        isLoadingPublicSettings,
        isLoadingAuth
    });

    // Если приложение еще загружает настройки или проверяет токен - показываем спиннер
    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">
                        Загрузка системы Epicurean...
                    </p>
                </div>
            </div>
        );
    }

    if (authError) {
        console.warn("[App] Ошибка доступа:", authError.type);

        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        }
    }

    return (
        <Routes>
            {/* 1. МАРШРУТЫ АВТОРИЗАЦИИ (без общего MainLayout, чистый фон) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 2. ОСНОВНЫЕ МАРШРУТЫ (внутри MainLayout с Навбаром и Футером) */}
            <Route element={<MainLayout />}>
                {/* Главная и Меню */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />

                {/* Отзывы */}
                <Route path="/testimonials" element={<AllTestimonials />} />

                {/* Заказ и Корзина */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />

                {/* Личный кабинет пользователя */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/wishlist" element={<Wishlist />} />

                {/* ПАНЕЛЬ АДМИНИСТРАТОРА (Доступна через Навбар) */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/promos" element={<AdminPromos />} />
            </Route>

            {/* 3. ОБРАБОТКА НЕСУЩЕСТВУЮЩИХ СТРАНИЦ */}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

/**
 * Главный компонент App, который оборачивает всё приложение в необходимые провайдеры.
 * Порядок провайдеров: Auth -> Language -> Theme -> Cart -> Query -> Router.
 * LanguageProvider добавлен для поддержки EN/TK/RU и валюты TMT.
 */
function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <CartProvider>
                        <QueryClientProvider client={queryClientInstance}>
                            <Router>
                                <AuthenticatedApp />
                            </Router>
                            {/* Глобальный компонент для всплывающих уведомлений (Toast) */}
                            <Toaster />
                        </QueryClientProvider>
                    </CartProvider>
                </ThemeProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}

export default App;