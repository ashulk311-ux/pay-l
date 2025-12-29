import api from '../config/api';

export const attendanceService = {
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getEmployeeAttendance: async (employeeId, params = {}) => {
    const response = await api.get(`/attendance/employee/${employeeId}`, { params });
    return response.data;
  },

  uploadDaily: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/attendance/upload-daily', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadMonthly: async (file, month, year) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', month);
    formData.append('year', year);
    const response = await api.post('/attendance/upload-monthly', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  }
};
