import api from '../config/api';

export const attendanceMatrixService = {
  syncAttendance: async (startDate, endDate) => {
    const response = await api.post('/attendance-matrix/sync-attendance', { startDate, endDate });
    return response.data;
  },

  syncLeaveTypes: async () => {
    const response = await api.post('/attendance-matrix/sync-leave-types');
    return response.data;
  },

  syncLeaveBalances: async (employeeId = null) => {
    const response = await api.post('/attendance-matrix/sync-leave-balances', { employeeId });
    return response.data;
  },

  syncHolidays: async (year) => {
    const response = await api.post('/attendance-matrix/sync-holidays', { year });
    return response.data;
  }
};



