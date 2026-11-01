import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Guards nested routes.
 *  - Guests are sent to /login and come back to the requested page after logging in.
 *  - With adminOnly, logged-in non-admins are sent to the home page.
 * The server enforces the same rules on every API call; this only keeps the UI honest.
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/** Only allows same-site relative paths, so ?redirect= can't send users to another website. */
export function safeRedirectPath(value, fallback = '/') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : fallback;
}
