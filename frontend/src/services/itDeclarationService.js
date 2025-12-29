import api from '../config/api';

export const itDeclarationService = {
  getSections: async () => {
    const response = await api.get('/it-declaration/sections');
    return response.data;
  },

  getITDeclaration: async (employeeId, financialYear) => {
    const response = await api.get('/it-declaration', {
      params: { employeeId, financialYear }
    });
    return response.data;
  },

  submitITDeclaration: async (data) => {
    const response = await api.post('/it-declaration', data);
    return response.data;
  },

  uploadDocument: async (declarationId, file, sectionCode) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sectionCode', sectionCode);
    
    const response = await api.post(`/it-declaration/upload/${declarationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  reviewITDeclaration: async (id, status, remarks) => {
    const response = await api.post(`/it-declaration/review/${id}`, {
      status,
      remarks
    });
    return response.data;
  },

  getAllITDeclarations: async (params = {}) => {
    const response = await api.get('/it-declaration/all', { params });
    return response.data;
  }
};



