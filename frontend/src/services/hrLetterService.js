import api from '../config/api';

export const hrLetterService = {
  generateOfferLetter: async (data) => {
    const response = await api.post('/hr-letters/offer-letter', data);
    return response.data;
  },

  generateRelievingLetter: async (data) => {
    const response = await api.post('/hr-letters/relieving-letter', data);
    return response.data;
  },

  generateExperienceCertificate: async (data) => {
    const response = await api.post('/hr-letters/experience-certificate', data);
    return response.data;
  },

  generateSalaryCertificate: async (data) => {
    const response = await api.post('/hr-letters/salary-certificate', data);
    return response.data;
  },

  downloadLetter: async (filename) => {
    const response = await api.get(`/hr-letters/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};



