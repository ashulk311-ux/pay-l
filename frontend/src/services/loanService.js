import api from '../config/api';

export const loanService = {
  getAll: async (params = {}) => {
    const response = await api.get('/loan', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/loan/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/loan', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/loan/${id}`, data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/loan/${id}/approve`);
    return response.data;
  },

  getEmployeeLoans: async (employeeId) => {
    const response = await api.get(`/loan/employee/${employeeId}`);
    return response.data;
  }
};

