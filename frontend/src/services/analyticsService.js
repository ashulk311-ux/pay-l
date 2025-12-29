import api from '../config/api';

export const analyticsService = {
  getPayrollAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/payroll', { params });
    return response.data;
  },

  getAttendanceAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/attendance', { params });
    return response.data;
  }
};



