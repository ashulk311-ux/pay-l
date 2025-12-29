import api from '../config/api';

export const portalService = {
  getDashboard: async () => {
    const response = await api.get('/portal/dashboard');
    return response.data;
  },

  getPayslips: async (params = {}) => {
    const response = await api.get('/portal/payslips', { params });
    return response.data;
  },

  getPayslip: async (id) => {
    const response = await api.get(`/portal/payslip/${id}`);
    return response.data;
  },

  getPayslipPDF: async (id) => {
    const response = await api.get(`/payroll/payslip/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getAttendance: async (params = {}) => {
    const response = await api.get('/portal/attendance', { params });
    return response.data;
  },

  getLeaveBalance: async () => {
    const response = await api.get('/portal/leave-balance');
    return response.data;
  },

  applyLeave: async (data) => {
    const response = await api.post('/portal/leave', data);
    return response.data;
  },

  getLeaveHistory: async (params = {}) => {
    const response = await api.get('/portal/leave-history', { params });
    return response.data;
  },

  submitITDeclaration: async (data) => {
    const response = await api.post('/portal/it-declaration', data);
    return response.data;
  },

  getITDeclaration: async () => {
    const response = await api.get('/portal/it-declaration');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/portal/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/portal/profile', data);
    return response.data;
  },

  getQueries: async () => {
    const response = await api.get('/portal/helpdesk');
    return response.data;
  },

  raiseQuery: async (data) => {
    const response = await api.post('/portal/helpdesk', data);
    return response.data;
  }
};

