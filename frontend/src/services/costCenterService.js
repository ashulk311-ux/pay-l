import api from '../config/api';

export const costCenterService = {
  getAll: async () => {
    const response = await api.get('/cost-centers');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/cost-centers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/cost-centers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/cost-centers/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/cost-centers/${id}`);
    return response.data;
  }
};


