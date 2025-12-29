import api from '../config/api';

export const subDepartmentService = {
  getAll: async (departmentId) => {
    const params = departmentId ? { departmentId } : {};
    const response = await api.get('/sub-departments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sub-departments/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/sub-departments', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/sub-departments/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/sub-departments/${id}`);
    return response.data;
  }
};


