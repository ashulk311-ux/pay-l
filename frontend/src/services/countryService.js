import api from '../config/api';

export const countryService = {
  getAll: async () => {
    const response = await api.get('/countries');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/countries/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/countries', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/countries/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/countries/${id}`);
    return response.data;
  }
};


