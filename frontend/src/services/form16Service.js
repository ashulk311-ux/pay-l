import api from '../config/api';

export const form16Service = {
  getAll: async (params = {}) => {
    const response = await api.get('/form16', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/form16/${id}`);
    return response.data;
  },

  generate: async (data) => {
    const response = await api.post('/form16/generate', data);
    return response.data;
  },

  downloadPDF: async (id) => {
    const response = await api.get(`/form16/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};



