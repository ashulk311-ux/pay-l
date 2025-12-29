import api from '../config/api';

export const stateService = {
  getAll: async (countryId) => {
    const params = countryId ? { countryId } : {};
    const response = await api.get('/states', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/states/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/states', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/states/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/states/${id}`);
    return response.data;
  }
};


