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

  getAudit: async (id) => {
    const response = await api.get(`/increment/${id}/audit`);
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

  bulkCreateByGrade: async (data) => {
    const response = await api.post('/increment/bulk-grade', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/increment/${id}`, data);
    return response.data;
  },

  approve: async (id, remarks) => {
    const response = await api.put(`/increment/${id}/approve`, { remarks });
    return response.data;
  },

  reject: async (id, rejectionReason) => {
    const response = await api.put(`/increment/${id}/reject`, { rejectionReason });
    return response.data;
  },

  apply: async (id) => {
    const response = await api.put(`/increment/${id}/apply`);
    return response.data;
  }
};
