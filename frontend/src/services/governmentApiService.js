import api from '../config/api';

export const governmentApiService = {
  submitPFChallan: async (data) => {
    const response = await api.post('/government/pf/submit-challan', data);
    return response.data;
  },

  submitESIChallan: async (data) => {
    const response = await api.post('/government/esi/submit-challan', data);
    return response.data;
  },

  verifyUAN: async (uan) => {
    const response = await api.post('/government/pf/verify-uan', { uan });
    return response.data;
  },

  verifyESINumber: async (esiNumber) => {
    const response = await api.post('/government/esi/verify-number', { esiNumber });
    return response.data;
  },

  getPFContributionHistory: async (params) => {
    const response = await api.get('/government/pf/contribution-history', { params });
    return response.data;
  },

  getESIContributionHistory: async (params) => {
    const response = await api.get('/government/esi/contribution-history', { params });
    return response.data;
  },

  downloadPFChallan: async (challanNumber) => {
    const response = await api.get(`/government/pf/challan/${challanNumber}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  downloadESIChallan: async (challanNumber) => {
    const response = await api.get(`/government/esi/challan/${challanNumber}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};



