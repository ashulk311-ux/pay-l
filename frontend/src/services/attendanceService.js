import api from '../config/api';

export const attendanceService = {
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  bulkUpload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/attendance/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getEmployeeSummary: async (employeeId, params = {}) => {
    const response = await api.get(`/attendance/employee/${employeeId}/summary`, { params });
    return response.data;
  },

  exportTemplate: async () => {
    const response = await api.get('/attendance/export-template', {
      responseType: 'blob'
    });
    return response.data;
  }
};

