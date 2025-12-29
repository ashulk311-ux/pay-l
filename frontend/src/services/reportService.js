import api from '../config/api';

export const reportService = {
  // Statutory Reports
  getPFReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/pf', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  getESIReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/esi', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  getTDSReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/tds', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  getPTReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/statutory/pt', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Payroll Reports
  getSalaryRegister: async (month, year, format = 'json') => {
    const response = await api.get('/reports/payroll/register', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  getPayrollSummary: async (month, year, format = 'json') => {
    const response = await api.get('/reports/payroll/summary', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  getPayslip: async (id) => {
    const response = await api.get(`/reports/payslip/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Reconciliation Reports
  getReconciliationReport: async (month, year, format = 'json') => {
    const response = await api.get('/reports/reconciliation', {
      params: { month, year, format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Bank Transfer Reports
  getBankTransferReport: async (month, year, format = 'json', bankName = null) => {
    const response = await api.get('/reports/bank-transfer', {
      params: { month, year, format, bankName },
      responseType: format === 'excel' || format === 'csv' || format === 'neft' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Employee History
  getEmployeeHistory: async (id, params = {}) => {
    const response = await api.get(`/reports/employee-history/${id}`, { params });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/reports/audit-logs', { params });
    return response.data;
  },

  exportAuditLogs: async (params = {}, format = 'excel') => {
    const response = await api.get('/reports/audit-logs/export', {
      params: { ...params, format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Custom Reports
  getCustomReports: async () => {
    const response = await api.get('/reports/custom');
    return response.data;
  },

  createCustomReport: async (data) => {
    const response = await api.post('/reports/custom', data);
    return response.data;
  },

  updateCustomReport: async (id, data) => {
    const response = await api.put(`/reports/custom/${id}`, data);
    return response.data;
  },

  deleteCustomReport: async (id) => {
    const response = await api.delete(`/reports/custom/${id}`);
    return response.data;
  },

  executeCustomReport: async (id, params = {}, format = 'json') => {
    const response = await api.post(`/reports/custom/${id}/execute`, params, {
      params: { format },
      responseType: format === 'excel' || format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Utility
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
