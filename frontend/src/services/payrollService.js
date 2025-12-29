import api from '../config/api';

export const payrollService = {
  getAll: async () => {
    const response = await api.get('/payroll');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/payroll', data);
    return response.data;
  },

  lockAttendance: async (id) => {
    const response = await api.post(`/payroll/${id}/lock-attendance`);
    return response.data;
  },

  process: async (id) => {
    const response = await api.post(`/payroll/${id}/process`);
    return response.data;
  },

  finalize: async (id) => {
    const response = await api.post(`/payroll/${id}/finalize`);
    return response.data;
  },

  getPayslips: async (id) => {
    const response = await api.get(`/payroll/${id}/payslips`);
    return response.data;
  },

  generatePayslips: async (id) => {
    const response = await api.post(`/payroll/${id}/generate-payslips`);
    return response.data;
  },

  getPayslipPDF: async (id) => {
    const response = await api.get(`/payroll/payslip/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  runPreChecks: async (id) => {
    const response = await api.post(`/payroll/${id}/pre-checks`);
    return response.data;
  },

  applyEarningsDeductions: async (id) => {
    const response = await api.post(`/payroll/${id}/apply-earnings-deductions`);
    return response.data;
  },

  getPreChecks: async (id) => {
    const response = await api.get(`/payroll/${id}/pre-checks`);
    return response.data;
  }
};

