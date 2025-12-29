import api from '../config/api';

export const designationService = {
  getAll: async () => {
    const response = await api.get('/designations');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/designations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/designations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/designations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/designations/${id}`);
    return response.data;
  }
};



