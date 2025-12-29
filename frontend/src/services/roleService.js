import api from '../config/api';

export const roleService = {
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  }
};



