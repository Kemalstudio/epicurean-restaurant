import axios from 'axios';

const API_URL = 'http://192.168.200.207:5000/api'; 

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

    // Выход из аккаунта
    logout: () => {
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