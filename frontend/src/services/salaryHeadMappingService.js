import api from '../config/api';

export const salaryHeadMappingService = {
  getAll: async () => {
    const response = await api.get('/statutory/salary-heads/mappings');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/statutory/salary-heads/mappings/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/statutory/salary-heads/mappings', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/statutory/salary-heads/mappings/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/statutory/salary-heads/mappings/${id}`);
    return response.data;
  }
};



