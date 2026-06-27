import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      console.log("[AuthContext] Инициализация состояния приложения...");
      setIsLoadingPublicSettings(true);
          setAuthError(null);
      
      const localToken = appParams.token || localStorage.getItem('base44_access_token');
      
      try {
        const response = await axios.get('http://192.168.200.207:5000/api/settings/public', {
          headers: {
            'X-App-Id': appParams.appId || 'epicurean-app',
            ...(localToken ? { 'Authorization': `Bearer ${localToken}` } : {})
          }
        }).catch((err) => {
          console.warn("[AuthContext] Роут /api/settings/public не найден, использую настройки по умолчанию");
          return { data: { id: 'default', public_settings: { auth_required: false } } };
        });

        console.log("[AuthContext] Публичные настройки загружены:", response.data);
        setAppPublicSettings(response.data);
        
        if (localToken) {
          console.log("[AuthContext] Токен найден, проверяю профиль пользователя...");
          await checkUserAuth();
        } else {
          console.log("[AuthContext] Токен не найден, пользователь считается гостем");
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('[AuthContext] Ошибка при проверке состояния:', appError);
        
        const status = appError.response?.status;
        const errorData = appError.response?.data;

        if (status === 403 && errorData?.extra_data?.reason) {
          const reason = errorData.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Требуется авторизация' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'Доступ ограничен: пользователь не зарегистрирован' });
          } else {
            setAuthError({ type: reason, message: errorData.message || appError.message });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Ошибка загрузки приложения'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('[AuthContext] Непредвиденная ошибка:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'Произошла системная ошибка'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      
      const currentUser = await base44.auth.me();
      
      console.log("[AuthContext] Пользователь успешно авторизован:", currentUser.email);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.warn('[AuthContext] Ошибка авторизации пользователя:', error.message);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      const status = error.response?.status || error.status;
      if (status === 401 || status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Сессия истекла или требуется вход'
        });
      }
    }
  };

  /**
   * Выход из системы
   */
  const logout = (shouldRedirect = true) => {
    console.log("[AuthContext] Выход пользователя...");
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  /**
   * Перенаправление на страницу входа
   */
  const navigateToLogin = () => {
    console.log("[AuthContext] Перенаправление на страницу логина");
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}