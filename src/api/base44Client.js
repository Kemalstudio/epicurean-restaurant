import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('base44_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const lang = localStorage.getItem('app_lang') || 'en';

  config.params = { ...config.params, lang: lang };

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

class EntityProxy {
  constructor(entityName) {
    this.entityName = entityName;
  }

  async list(sortBy = '', limit = 100) {
    const res = await apiClient.get(`/${this.entityName}`, {
      params: { sort: sortBy, limit }
    });
    return res.data;
  }

  async filter(query = {}, sortBy = '', limit = 100) {
    const res = await apiClient.post(`/${this.entityName}/filter`, {
      query,
      sortBy,
      limit
    });
    return res.data;
  }

  async create(data) {
    const res = await apiClient.post(`/${this.entityName}`, data);
    return res.data;
  }

  async update(id, data) {
    const res = await apiClient.put(`/${this.entityName}/${id}`, data);
    return res.data;
  }

  // Удалить запись
  async delete(id) {
    const res = await apiClient.delete(`/${this.entityName}/${id}`);
    return res.data;
  }
}

export const base44 = {
  entities: {
    Category: new EntityProxy('Category'),
    Product: new EntityProxy('Product'),
    Order: new EntityProxy('Order'),
    PromoCode: new EntityProxy('PromoCode'),
    Wishlist: new EntityProxy('Wishlist'),
    Ingredient: new EntityProxy('Ingredient'),
    Review: new EntityProxy('Review'),
  },

  orders: {
    // Order is priced on the server: send only what was chosen, never prices
    place: async (data) => {
      const res = await apiClient.post('/Order', data);
      return res.data;
    },
    checkPromo: async (code, subtotal) => {
      const res = await apiClient.post('/orders/promo', { code, subtotal });
      return res.data;
    },
  },

  auth: {
    me: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    },

    loginViaEmailPassword: async (email, password) => {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.access_token) {
        localStorage.setItem('base44_access_token', res.data.access_token);
      }
      return res.data;
    },

    register: async (data) => {
      const res = await apiClient.post('/auth/register', data);
      return res.data;
    },

    verifyOtp: async (data) => {
      const res = await apiClient.post('/auth/verify-otp', data);
      if (res.data.access_token) {
        localStorage.setItem('base44_access_token', res.data.access_token);
      }
      return res.data;
    },

    resendOtp: async (email) => {
      const res = await apiClient.post('/auth/resend-otp', { email });
      return res.data;
    },

    // Выход из аккаунта: сессия удаляется и на сервере
    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // offline — the token is removed locally anyway
      }
      localStorage.removeItem('base44_access_token');
      window.location.href = '/login';
    },

    redirectToLogin: () => {
      window.location.href = '/login';
    },

    setToken: (token) => {
      localStorage.setItem('base44_access_token', token);
    },

    loginWithProvider: (provider, redirectUrl) => {
      console.log(`[AUTH] Переход к провайдеру: ${provider}`);
    }
  },

  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        const res = await apiClient.post('/ai/chat', { prompt });
        return res.data.response;
      }
    }
  }
};