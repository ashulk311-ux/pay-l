import api from '../config/api';

export const reimbursementMasterService = {
  // Categories
  getCategories: async () => {
    const response = await api.get('/reimbursement-master/categories');
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/reimbursement-master/categories', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/reimbursement-master/categories/${id}`, data);
    return response.data;
  },

  // Policies
  getPolicies: async () => {
    const response = await api.get('/reimbursement-master/policies');
    return response.data;
  },

  createPolicy: async (data) => {
    const response = await api.post('/reimbursement-master/policies', data);
    return response.data;
  },

  updatePolicy: async (id, data) => {
    const response = await api.put(`/reimbursement-master/policies/${id}`, data);
    return response.data;
  },

  // Workflow Configs
  getWorkflowConfigs: async () => {
    const response = await api.get('/reimbursement-master/workflow-configs');
    return response.data;
  },

  createWorkflowConfig: async (data) => {
    const response = await api.post('/reimbursement-master/workflow-configs', data);
    return response.data;
  },

  updateWorkflowConfig: async (id, data) => {
    const response = await api.put(`/reimbursement-master/workflow-configs/${id}`, data);
    return response.data;
  }
};



