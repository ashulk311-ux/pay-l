import api from '../config/api';

export const emailTemplateService = {
  getAll: async (params = {}) => {
    const response = await api.get('/email-templates', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/email-templates/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/email-templates', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/email-templates/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/email-templates/${id}`);
    return response.data;
  }
};



