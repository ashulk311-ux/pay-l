import api from '../config/api';

export const gpsAttendanceService = {
  // Mobile App APIs
  checkIn: async (data) => {
    const response = await api.post('/gps-attendance/check-in', data);
    return response.data;
  },

  checkOut: async (data) => {
    const response = await api.post('/gps-attendance/check-out', data);
    return response.data;
  },

  getTodayAttendance: async (employeeId) => {
    const response = await api.get('/gps-attendance/today', {
      params: { employeeId }
    });
    return response.data;
  },

  verifyLocation: async (data) => {
    const response = await api.post('/gps-attendance/verify-location', data);
    return response.data;
  },

  getOfficeLocations: async (employeeId) => {
    const response = await api.get('/gps-attendance/office-locations', {
      params: { employeeId }
    });
    return response.data;
  }
};



