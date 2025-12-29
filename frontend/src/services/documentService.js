import api from '../config/api';

export const documentService = {
  getEmployeeDocuments: async (employeeId) => {
    const response = await api.get(`/documents/employee/${employeeId}`);
    return response.data;
  },

  uploadDocument: async (employeeId, file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    const response = await api.post(`/documents/upload/${employeeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  downloadDocument: async (documentId) => {
    const response = await api.get(`/documents/download/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  verifyDocument: async (documentId, isVerified, remarks) => {
    const response = await api.post(`/documents/verify/${documentId}`, {
      isVerified,
      remarks
    });
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }
};



