import api from '../config/api';

export const gradeService = {
  getAll: async () => {
    const response = await api.get('/grades');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/grades', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/grades/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  }
};


