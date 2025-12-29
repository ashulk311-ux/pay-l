import api from '../config/api';

export const onboardingService = {
  getForm: async (token) => {
    const response = await api.get(`/onboarding/form/${token}`);
    return response.data;
  },

  submitStep: async (token, step, data) => {
    const response = await api.post(`/onboarding/submit/${token}`, { step, data });
    return response.data;
  },

  sendInvite: async (employeeId) => {
    const response = await api.post(`/onboarding/invite/${employeeId}`);
    return response.data;
  },

  getStatus: async (employeeId) => {
    const response = await api.get(`/onboarding/status/${employeeId}`);
    return response.data;
  }
};



