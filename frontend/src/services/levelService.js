import api from '../config/api';

export const levelService = {
  getAll: async () => {
    const response = await api.get('/levels');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/levels/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/levels', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/levels/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/levels/${id}`);
    return response.data;
  }
};


