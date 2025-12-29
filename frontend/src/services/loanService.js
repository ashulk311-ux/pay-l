import api from '../config/api';

export const loanService = {
  getAll: async (params = {}) => {
    const response = await api.get('/loan', { params });
    return response.data;
  },

  getOutstanding: async (params = {}) => {
    const response = await api.get('/loan/outstanding', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/loan/${id}`);
    return response.data;
  },

  requestLoan: async (data) => {
    const response = await api.post('/loan/request', data);
    return response.data;
  },

  approveLoan: async (id) => {
    const response = await api.put(`/loan/${id}/approve`);
    return response.data;
  },

  rejectLoan: async (id, rejectionReason) => {
    const response = await api.put(`/loan/${id}/reject`, { rejectionReason });
    return response.data;
  },

  configureEMI: async (id, data) => {
    const response = await api.put(`/loan/${id}/configure-emi`, data);
    return response.data;
  },

  recordEMIPayment: async (emiId, data) => {
    const response = await api.post(`/loan/emi/${emiId}/payment`, data);
    return response.data;
  },

  getEmployeeLoans: async (employeeId, params = {}) => {
    const response = await api.get(`/loan/employee/${employeeId}`, { params });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/loan/${id}`, data);
    return response.data;
  }
};
