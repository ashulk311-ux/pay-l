import api from '../config/api';

export const officeLocationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/office-locations', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/office-locations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/office-locations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/office-locations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/office-locations/${id}`);
    return response.data;
  }
};



