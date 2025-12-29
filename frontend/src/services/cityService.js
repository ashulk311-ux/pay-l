import api from '../config/api';

export const cityService = {
  getAll: async (countryId, stateId) => {
    const params = {};
    if (countryId) params.countryId = countryId;
    if (stateId) params.stateId = stateId;
    const response = await api.get('/cities', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/cities/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/cities', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/cities/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/cities/${id}`);
    return response.data;
  }
};


