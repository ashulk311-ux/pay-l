import api from '../config/api';

export const incrementPolicyService = {
  getAll: async () => {
    const response = await api.get('/increment-policy');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/increment-policy', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/increment-policy/${id}`, data);
    return response.data;
  }
};



