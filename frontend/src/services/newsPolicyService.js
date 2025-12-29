import api from '../config/api';

export const newsPolicyService = {
  getAll: async (params = {}) => {
    const response = await api.get('/news-policies', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/news-policies/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/news-policies', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/news-policies/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/news-policies/${id}`);
    return response.data;
  }
};



