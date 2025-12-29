import api from '../config/api';

export const statutoryService = {
  getConfigurations: async (companyId, params = {}) => {
    const response = await api.get(`/statutory/${companyId}`, { params });
    return response.data;
  },

  getConfiguration: async (id) => {
    const response = await api.get(`/statutory/config/${id}`);
    return response.data;
  },

  createConfiguration: async (data) => {
    const response = await api.post('/statutory', data);
    return response.data;
  },

  updateConfiguration: async (id, data) => {
    const response = await api.put(`/statutory/${id}`, data);
    return response.data;
  },

  deleteConfiguration: async (id) => {
    const response = await api.delete(`/statutory/${id}`);
    return response.data;
  },

  getTDSSlabs: async (regime = 'new') => {
    const response = await api.get('/statutory/tds/slabs', { params: { regime } });
    return response.data;
  },

  updateTDSSlabs: async (data) => {
    const response = await api.post('/statutory/tds/slabs', data);
    return response.data;
  },

  getExemptions: async (params = {}) => {
    const response = await api.get('/statutory/tds/exemptions', { params });
    return response.data;
  },

  updateExemptions: async (data) => {
    const response = await api.post('/statutory/tds/exemptions', data);
    return response.data;
  },

  // Income Tax Slabs
  getIncomeTaxSlabs: async (params = {}) => {
    const response = await api.get('/statutory/income-tax/slabs', { params });
    return response.data;
  },

  getIncomeTaxSlab: async (id) => {
    const response = await api.get(`/statutory/income-tax/slabs/${id}`);
    return response.data;
  },

  createIncomeTaxSlab: async (data) => {
    const response = await api.post('/statutory/income-tax/slabs', data);
    return response.data;
  },

  updateIncomeTaxSlab: async (id, data) => {
    const response = await api.put(`/statutory/income-tax/slabs/${id}`, data);
    return response.data;
  },

  deleteIncomeTaxSlab: async (id) => {
    const response = await api.delete(`/statutory/income-tax/slabs/${id}`);
    return response.data;
  },

  // Professional Tax Slabs
  getProfessionalTaxSlabs: async (params = {}) => {
    const response = await api.get('/statutory/professional-tax/slabs', { params });
    return response.data;
  },

  getProfessionalTaxSlab: async (id) => {
    const response = await api.get(`/statutory/professional-tax/slabs/${id}`);
    return response.data;
  },

  createProfessionalTaxSlab: async (data) => {
    const response = await api.post('/statutory/professional-tax/slabs', data);
    return response.data;
  },

  updateProfessionalTaxSlab: async (id, data) => {
    const response = await api.put(`/statutory/professional-tax/slabs/${id}`, data);
    return response.data;
  },

  deleteProfessionalTaxSlab: async (id) => {
    const response = await api.delete(`/statutory/professional-tax/slabs/${id}`);
    return response.data;
  },

  // Labour Welfare Fund Slabs
  getLWFSlabs: async (params = {}) => {
    const response = await api.get('/statutory/labour-welfare-fund/slabs', { params });
    return response.data;
  },

  getLWFSlab: async (id) => {
    const response = await api.get(`/statutory/labour-welfare-fund/slabs/${id}`);
    return response.data;
  },

  createLWFSlab: async (data) => {
    const response = await api.post('/statutory/labour-welfare-fund/slabs', data);
    return response.data;
  },

  updateLWFSlab: async (id, data) => {
    const response = await api.put(`/statutory/labour-welfare-fund/slabs/${id}`, data);
    return response.data;
  },

  deleteLWFSlab: async (id) => {
    const response = await api.delete(`/statutory/labour-welfare-fund/slabs/${id}`);
    return response.data;
  },

  // PF Groups
  getPFGroups: async () => {
    const response = await api.get('/statutory/pf/groups');
    return response.data;
  },

  getPFGroup: async (id) => {
    const response = await api.get(`/statutory/pf/groups/${id}`);
    return response.data;
  },

  createPFGroup: async (data) => {
    const response = await api.post('/statutory/pf/groups', data);
    return response.data;
  },

  updatePFGroup: async (id, data) => {
    const response = await api.put(`/statutory/pf/groups/${id}`, data);
    return response.data;
  },

  deletePFGroup: async (id) => {
    const response = await api.delete(`/statutory/pf/groups/${id}`);
    return response.data;
  },

  // ESI Groups
  getESIGroups: async () => {
    const response = await api.get('/statutory/esi/groups');
    return response.data;
  },

  getESIGroup: async (id) => {
    const response = await api.get(`/statutory/esi/groups/${id}`);
    return response.data;
  },

  createESIGroup: async (data) => {
    const response = await api.post('/statutory/esi/groups', data);
    return response.data;
  },

  updateESIGroup: async (id, data) => {
    const response = await api.put(`/statutory/esi/groups/${id}`, data);
    return response.data;
  },

  deleteESIGroup: async (id) => {
    const response = await api.delete(`/statutory/esi/groups/${id}`);
    return response.data;
  },

  // PT Groups
  getPTGroups: async () => {
    const response = await api.get('/statutory/pt/groups');
    return response.data;
  },

  getPTGroup: async (id) => {
    const response = await api.get(`/statutory/pt/groups/${id}`);
    return response.data;
  },

  createPTGroup: async (data) => {
    const response = await api.post('/statutory/pt/groups', data);
    return response.data;
  },

  updatePTGroup: async (id, data) => {
    const response = await api.put(`/statutory/pt/groups/${id}`, data);
    return response.data;
  },

  deletePTGroup: async (id) => {
    const response = await api.delete(`/statutory/pt/groups/${id}`);
    return response.data;
  },

  // TDS Deductors
  getTDSDeductors: async () => {
    const response = await api.get('/statutory/tds/deductors');
    return response.data;
  },

  getTDSDeductor: async (id) => {
    const response = await api.get(`/statutory/tds/deductors/${id}`);
    return response.data;
  },

  createTDSDeductor: async (data) => {
    const response = await api.post('/statutory/tds/deductors', data);
    return response.data;
  },

  updateTDSDeductor: async (id, data) => {
    const response = await api.put(`/statutory/tds/deductors/${id}`, data);
    return response.data;
  },

  deleteTDSDeductor: async (id) => {
    const response = await api.delete(`/statutory/tds/deductors/${id}`);
    return response.data;
  },

  // Location Mappings
  getLocationMappings: async (params = {}) => {
    const response = await api.get('/statutory/location-mappings', { params });
    return response.data;
  },

  createLocationMapping: async (data) => {
    const response = await api.post('/statutory/location-mappings', data);
    return response.data;
  },

  updateLocationMapping: async (id, data) => {
    const response = await api.put(`/statutory/location-mappings/${id}`, data);
    return response.data;
  },

  deleteLocationMapping: async (id) => {
    const response = await api.delete(`/statutory/location-mappings/${id}`);
    return response.data;
  },

  // Statutory Summary
  getStatutorySummary: async () => {
    const response = await api.get('/statutory/summary');
    return response.data;
  }
};


