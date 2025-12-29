import api from '../config/api';

export const leaveMasterService = {
  // Leave Types
  getLeaveTypes: async () => {
    const response = await api.get('/leave-master/types');
    return response.data;
  },

  createLeaveType: async (data) => {
    const response = await api.post('/leave-master/types', data);
    return response.data;
  },

  updateLeaveType: async (id, data) => {
    const response = await api.put(`/leave-master/types/${id}`, data);
    return response.data;
  },

  // Leave Balance
  getLeaveBalance: async (params = {}) => {
    const response = await api.get('/leave-master/balance', { params });
    return response.data;
  },

  updateLeaveBalance: async (data) => {
    const response = await api.post('/leave-master/balance', data);
    return response.data;
  },

  // Holidays
  getHolidays: async (year) => {
    const response = await api.get('/leave-master/holidays', { params: { year } });
    return response.data;
  },

  createHoliday: async (data) => {
    const response = await api.post('/leave-master/holidays', data);
    return response.data;
  },

  updateHoliday: async (id, data) => {
    const response = await api.put(`/leave-master/holidays/${id}`, data);
    return response.data;
  },

  deleteHoliday: async (id) => {
    const response = await api.delete(`/leave-master/holidays/${id}`);
    return response.data;
  },

  // Encashment
  getEncashmentRules: async () => {
    const response = await api.get('/leave-master/encashment');
    return response.data;
  },

  createEncashmentRule: async (data) => {
    const response = await api.post('/leave-master/encashment', data);
    return response.data;
  },

  updateEncashmentRule: async (id, data) => {
    const response = await api.put(`/leave-master/encashment/${id}`, data);
    return response.data;
  }
};



