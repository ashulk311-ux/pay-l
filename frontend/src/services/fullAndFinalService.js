import api from '../config/api';

export const fullAndFinalService = {
  getAll: async (params = {}) => {
    const response = await api.get('/full-and-final', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/full-and-final/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/full-and-final', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/full-and-final/${id}`, data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/full-and-final/${id}/approve`);
    return response.data;
  },

  markAsPaid: async (id) => {
    const response = await api.put(`/full-and-final/${id}/mark-paid`);
    return response.data;
  }
};



