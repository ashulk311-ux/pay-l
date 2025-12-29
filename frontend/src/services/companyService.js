import api from '../config/api';

export const companyService = {
  getAll: async () => {
    const response = await api.get('/company');
    return response.data;
  },

  getMyCompany: async () => {
    const response = await api.get('/company/my-company');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/company/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/company', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/company/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/company/${id}`);
    return response.data;
  },

  updateSMTPConfig: async (id, data) => {
    const response = await api.put(`/company/${id}/smtp-config`, data);
    return response.data;
  },

  updateWhatsAppConfig: async (id, data) => {
    const response = await api.put(`/company/${id}/whatsapp-config`, data);
    return response.data;
  },

  updateEmployeeCodeSettings: async (id, data) => {
    const response = await api.put(`/company/${id}/employee-code-settings`, data);
    return response.data;
  },

  getCompanySettings: async (id) => {
    const response = await api.get(`/company/${id}/settings`);
    return response.data;
  },

  updateCompanySettings: async (id, data) => {
    const response = await api.put(`/company/${id}/settings`, data);
    return response.data;
  },

  updateCustomMessages: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/custom-messages`, data);
    return response.data;
  },

  updateEmployeeParameters: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/employee-parameters`, data);
    return response.data;
  },

  updateMailParameters: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/mail-parameters`, data);
    return response.data;
  },

  updateAttendanceParameters: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/attendance-parameters`, data);
    return response.data;
  },

  updateSalaryParameters: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/salary-parameters`, data);
    return response.data;
  },

  updateOtherSettings: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/other-settings`, data);
    return response.data;
  },

  updatePasswordPolicy: async (id, data) => {
    const response = await api.put(`/company/${id}/settings/password-policy`, data);
    return response.data;
  },

  updateBankDetails: async (id, data) => {
    const response = await api.put(`/company/${id}/bank-details`, data);
    return response.data;
  }
};


