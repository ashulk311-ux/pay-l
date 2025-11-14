import api from '../config/api';

export const reportService = {
  getPFReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/pf', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getESIReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/esi', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getTDSReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/tds', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getPTReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/pt', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getSalaryRegister: async (month, year, format = 'json') => {
    const response = await api.get('/reports/payroll/register', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getPayrollSummary: async (month, year) => {
    const response = await api.get('/reports/payroll/summary', {
      params: { month, year }
    });
    return response.data;
  },

  getReconciliationReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/reconciliation', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getBankTransferReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/bank-transfer', {
      params: { month, year, format },
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  getEmployeeHistory: async (id, type = 'all') => {
    const response = await api.get(`/reports/employee-history/${id}`, {
      params: { type }
    });
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await api.get('/reports/audit-logs');
    return response.data;
  },

  downloadReport: async (filePath) => {
    const response = await api.get(`/reports/download/${filePath}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getDashboardAnalytics: async () => {
    const response = await api.get('/reports/dashboard-analytics');
    return response.data;
  }
};

