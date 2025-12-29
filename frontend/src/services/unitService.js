import api from '../config/api';

export const unitService = {
  getAll: async () => {
    const response = await api.get('/units');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/units/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/units', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/units/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/units/${id}`);
    return response.data;
  }
};


