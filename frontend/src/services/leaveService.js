import api from '../config/api';

export const leaveService = {
  getAll: async (params = {}) => {
    const response = await api.get('/leave', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/leave/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/leave', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/leave/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/leave/${id}`);
    return response.data;
  },

  approve: async (id, data = {}) => {
    const response = await api.post(`/leave/${id}/approve`, data);
    return response.data;
  },

  reject: async (id, data = {}) => {
    const response = await api.post(`/leave/${id}/reject`, data);
    return response.data;
  },

  getBalance: async (employeeId) => {
    const response = await api.get(`/leave/employee/${employeeId}/balance`);
    return response.data;
  }
};

