import api from '../config/api';

export const salaryService = {
  getSalaryStructure: async (employeeId) => {
    const response = await api.get(`/salary/structure/${employeeId}`);
    return response.data;
  },

  createSalaryStructure: async (data) => {
    const response = await api.post('/salary/structure', data);
    return response.data;
  },

  updateSalaryStructure: async (id, data) => {
    const response = await api.put(`/salary/structure/${id}`, data);
    return response.data;
  }
};



