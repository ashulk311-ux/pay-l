import api from '../config/api';

export const dynamicFieldService = {
  getAll: async () => {
    const response = await api.get('/dynamic-fields');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dynamic-fields/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/dynamic-fields', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/dynamic-fields/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dynamic-fields/${id}`);
    return response.data;
  }
};



