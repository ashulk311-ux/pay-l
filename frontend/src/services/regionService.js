import api from '../config/api';

export const regionService = {
  getAll: async () => {
    const response = await api.get('/regions');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/regions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/regions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/regions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/regions/${id}`);
    return response.data;
  }
};



