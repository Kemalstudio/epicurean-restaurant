import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'base44_access_token';

const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // The server translates names/descriptions and error messages by ?lang=
  config.params = { ...config.params, lang: localStorage.getItem('app_lang') || 'en' };
  return config;
});

const CLIENT_ERRORS = {
  en: { generic: 'Something went wrong. Please try again.', offline: 'Server is not reachable. Check your connection.' },
  ru: { generic: 'Что-то пошло не так. Попробуйте ещё раз.', offline: 'Сервер недоступен. Проверьте подключение к интернету.' },
  tk: { generic: 'Näsazlyk ýüze çykdy. Gaýtadan synanyşyň.', offline: 'Serwer elýeterli däl. Internet birikmesini barlaň.' },
};

/** Human-readable message from an API error. The server already translates { message } by ?lang=. */
export const apiErrorMessage = (error) => {
  const texts = CLIENT_ERRORS[localStorage.getItem('app_lang')] || CLIENT_ERRORS.en;
  if (error?.response?.data?.message) return error.response.data.message;
  return error?.request && !error?.response ? texts.offline : texts.generic;
};

const get = async (url, params) => (await apiClient.get(url, { params })).data;
const post = async (url, body) => (await apiClient.post(url, body)).data;
const put = async (url, body) => (await apiClient.put(url, body)).data;

class EntityProxy {
  constructor(entityName) {
    this.entityName = entityName;
  }

  /** @param raw true = keep {en,ru,tk} objects (for editing forms) */
  list(sortBy = '', limit = 100, raw = false) {
    return get(`/${this.entityName}`, { sort: sortBy, limit, ...(raw ? { raw: 1 } : {}) });
  }

  filter(query = {}, sortBy = '', limit = 100, raw = false) {
    return apiClient.post(`/${this.entityName}/filter`, { query, sortBy, limit }, { params: raw ? { raw: 1 } : {} }).then(r => r.data);
  }

  create(data) { return post(`/${this.entityName}`, data); }
  update(id, data) { return put(`/${this.entityName}/${id}`, data); }
  delete(id) { return apiClient.delete(`/${this.entityName}/${id}`).then(r => r.data); }
}

const ENTITY_NAMES = [
  'Cuisine', 'Restaurant', 'MenuSection', 'Product', 'Ingredient', 'Offer', 'Review',
  'PromoCode', 'Order', 'Wishlist', 'PartnerApplication', 'RiderApplication', 'Subscriber',
];

export const base44 = {
  entities: Object.fromEntries(ENTITY_NAMES.map(n => [n, new EntityProxy(n)])),

  // Marketplace
  market: {
    home: () => get('/home'),
    restaurants: (params = {}) => get('/restaurants', params),
    restaurant: (slug) => get(`/restaurants/${encodeURIComponent(slug)}`),
    ownerRestaurants: () => get('/owner/restaurants'),
    applyPartner: (data) => post('/partner-applications', data),
    decideApplication: (id, decision) => post(`/partner-applications/${id}/${decision}`),
    applyRider: (data) => post('/rider-applications', data),
    subscribe: (email) => post('/subscribe', { email }),
  },

  admin: {
    users: () => get('/admin/users'),
    setRole: (id, role) => put(`/admin/users/${id}/role`, { role }),
  },

  orders: {
    // Order is priced on the server: send only what was chosen, never prices
    place: (data) => post('/Order', data),
    track: (number, phone) => get('/orders/track', { number, phone }),
    checkPromo: (code, subtotal, restaurantId) => post('/orders/promo', { code, subtotal, restaurant_id: restaurantId }),
  },

  auth: {
    me: () => get('/auth/me'),

    loginViaEmailPassword: async (email, password) => {
      const data = await post('/auth/login', { email, password });
      if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
      return data;
    },

    register: (data) => post('/auth/register', data),

    verifyOtp: async (data) => {
      const res = await post('/auth/verify-otp', data);
      if (res.access_token) localStorage.setItem(TOKEN_KEY, res.access_token);
      return res;
    },

    resendOtp: (email) => post('/auth/resend-otp', { email }),
    forgotPassword: (email) => post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => post('/auth/reset-password', { token, password }),

    // Выход из аккаунта: сессия удаляется и на сервере
    logout: async () => {
      try {
        await post('/auth/logout');
      } catch {
        // offline — the token is removed locally anyway
      }
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    },

    redirectToLogin: () => { window.location.href = '/login'; },
    setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  },

  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => (await post('/ai/chat', { prompt })).response,
    },
  },
};

export const api = base44;
