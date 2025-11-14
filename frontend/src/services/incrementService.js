import api from '../config/api';

export const incrementService = {
  getAll: async (params = {}) => {
    const response = await api.get('/increment', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/increment/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/increment', data);
    return response.data;
  },

  bulkCreate: async (entries) => {
    const response = await api.post('/increment/bulk', { entries });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/increment/${id}`, data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/increment/${id}/approve`);
    return response.data;
  }
};

