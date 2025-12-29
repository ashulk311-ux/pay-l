import api from '../config/api';

export const matrixService = {
  syncToMatrix: async (employeeId) => {
    const response = await api.post(`/matrix/sync-to/${employeeId}`);
    return response.data;
  },

  syncFromMatrix: async (matrixEmployeeId) => {
    const response = await api.post(`/matrix/sync-from/${matrixEmployeeId}`);
    return response.data;
  },

  removeFromMatrix: async (employeeId) => {
    const response = await api.post(`/matrix/remove/${employeeId}`);
    return response.data;
  }
};



