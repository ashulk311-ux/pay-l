import api from '../config/api';

export const supplementaryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/supplementary', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/supplementary/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/supplementary', data);
    return response.data;
  },

  bulkCreate: async (entries) => {
    const response = await api.post('/supplementary/bulk', { entries });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/supplementary/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/supplementary/${id}`);
    return response.data;
  }
};

