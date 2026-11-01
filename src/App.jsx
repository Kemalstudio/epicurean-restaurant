import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CartProvider } from '@/lib/cartStore.jsx';
import { LocationProvider } from '@/lib/locationStore.jsx';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';

import MainLayout from '@/components/layout/MainLayout';

// Public pages
import Home from '@/pages/Home';
import Restaurants from '@/pages/Restaurants';
import RestaurantPage from '@/pages/Restaurant';
import Dishes from '@/pages/Dishes';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Orders from '@/pages/Orders';
import Wishlist from '@/pages/Wishlist';
import { PartnerPage, RiderPage, LegalPage } from '@/pages/JoinPages';

// Auth
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import LottieAnim from '@/components/ember/LottieAnim';

// Management pages are loaded on demand (they include charts and editors customers never need)
const OwnerDashboard = lazy(() => import('@/pages/OwnerDashboard'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));

const PageSpinner = () => (
    <div className="flex min-h-[50vh] items-center justify-center">
        <LottieAnim name="loader" size={80} />
    </div>
);

function LegalRoute() {
    const { doc } = useParams();
    return <LegalPage doc={doc} />;
}

const AppRoutes = () => {
    const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
    const { t } = useLanguage();

    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-5">
                    <img src="/brand/ember-logo.svg" alt="Ember" className="h-12 w-auto" />
                    <LottieAnim name="loader" size={80} label={t('app_loading')} />
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Auth pages — no header/footer */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/offers" element={<Restaurants mode="offers" />} />
                <Route path="/dishes" element={<Dishes />} />
                <Route path="/r/:slug" element={<RestaurantPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/partner" element={<PartnerPage />} />
                <Route path="/rider" element={<RiderPage />} />
                <Route path="/legal/:doc" element={<LegalRoute />} />

                {/* Old addresses of the single-restaurant site */}
                <Route path="/menu" element={<Navigate to="/dishes" replace />} />
                <Route path="/dashboard" element={<Navigate to="/orders" replace />} />
                <Route path="/testimonials" element={<Navigate to="/restaurants" replace />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/wishlist" element={<Wishlist />} />
                </Route>
                <Route element={<ProtectedRoute ownerOnly />}>
                    <Route path="/owner" element={<Suspense fallback={<PageSpinner />}><OwnerDashboard /></Suspense>} />
                </Route>
                <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="/admin/*" element={<Suspense fallback={<PageSpinner />}><AdminPanel /></Suspense>} />
                </Route>

                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};

/**
 * Provider order: Auth -> Language -> Location -> Cart -> Query -> Router.
 */
function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <LocationProvider>
                    <CartProvider>
                        <QueryClientProvider client={queryClientInstance}>
                            <Router>
                                <AppRoutes />
                            </Router>
                            <Toaster />
                        </QueryClientProvider>
                    </CartProvider>
                </LocationProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}

export default App;
