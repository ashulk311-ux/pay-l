import api from '../config/api';

export const biometricService = {
  // Device Management
  getAllDevices: async () => {
    const response = await api.get('/biometric');
    return response.data;
  },

  getDevice: async (id) => {
    const response = await api.get(`/biometric/${id}`);
    return response.data;
  },

  registerDevice: async (data) => {
    const response = await api.post('/biometric', data);
    return response.data;
  },

  updateDevice: async (id, data) => {
    const response = await api.put(`/biometric/${id}`, data);
    return response.data;
  },

  deleteDevice: async (id) => {
    const response = await api.delete(`/biometric/${id}`);
    return response.data;
  },

  regenerateCredentials: async (id) => {
    const response = await api.post(`/biometric/${id}/regenerate-credentials`);
    return response.data;
  },

  triggerSync: async (id) => {
    const response = await api.post(`/biometric/${id}/trigger-sync`);
    return response.data;
  },

  getDeviceLogs: async (id, params = {}) => {
    const response = await api.get(`/biometric/${id}/logs`, { params });
    return response.data;
  },

  // Employee Mapping
  mapEmployee: async (data) => {
    const response = await api.post('/biometric/employee/map', data);
    return response.data;
  },

  getEmployeeMappings: async (deviceId) => {
    const response = await api.get(`/biometric/device/${deviceId}/mappings`);
    return response.data;
  },

  removeEmployeeMapping: async (id) => {
    const response = await api.delete(`/biometric/employee-mapping/${id}`);
    return response.data;
  }
};



