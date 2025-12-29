import api from '../config/api';

export const reimbursementService = {
  getAll: async (params = {}) => {
    const response = await api.get('/reimbursement', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/reimbursement/${id}`);
    return response.data;
  },

  create: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'documents' && Array.isArray(data[key])) {
        data[key].forEach((file) => {
          formData.append('documents', file);
        });
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
      }
    });
    const response = await api.post('/reimbursement', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/reimbursement/${id}`, data);
    return response.data;
  },

  approve: async (id, remarks) => {
    const response = await api.put(`/reimbursement/${id}/approve`, { remarks });
    return response.data;
  },

  reject: async (id, rejectionReason) => {
    const response = await api.put(`/reimbursement/${id}/reject`, { rejectionReason });
    return response.data;
  },

  getEmployeeReimbursements: async (employeeId, params = {}) => {
    const response = await api.get(`/reimbursement/employee/${employeeId}`, { params });
    return response.data;
  }
};
