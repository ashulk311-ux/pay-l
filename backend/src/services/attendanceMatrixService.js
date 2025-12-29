const axios = require('axios');
const logger = require('../utils/logger');
const { Attendance, Employee, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * Sync attendance from Matrix Software
 */
async function syncAttendanceFromMatrix(companyId, startDate, endDate) {
  try {
    const company = await Company.findByPk(companyId);
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      throw new Error('Matrix Software integration not configured');
    }

    // Fetch attendance from Matrix
    const response = await axios.get(
      `${company.matrixApiUrl}/api/attendance`,
      {
        params: { startDate, endDate },
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`
        }
      }
    );

    const matrixAttendance = response.data || [];

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const record of matrixAttendance) {
      try {
        const employee = await Employee.findOne({
          where: {
            companyId,
            matrixEmployeeId: record.employeeId
          }
        });

        if (!employee) {
          results.failed++;
          results.errors.push(`Employee not found for Matrix ID: ${record.employeeId}`);
          continue;
        }

        const [attendance, created] = await Attendance.findOrCreate({
          where: {
            employeeId: employee.id,
            date: record.date
          },
          defaults: {
            employeeId: employee.id,
            date: record.date,
            status: record.status || 'present',
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            hoursWorked: record.hoursWorked,
            matrixAttendanceId: record.id,
            lastSyncedWithMatrix: new Date()
          }
        });

        if (!created) {
          attendance.status = record.status || attendance.status;
          attendance.checkIn = record.checkIn || attendance.checkIn;
          attendance.checkOut = record.checkOut || attendance.checkOut;
          attendance.hoursWorked = record.hoursWorked || attendance.hoursWorked;
          attendance.matrixAttendanceId = record.id;
          attendance.lastSyncedWithMatrix = new Date();
          await attendance.save();
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error syncing record ${record.id}: ${error.message}`);
      }
    }

    logger.info(`Synced ${results.success} attendance records from Matrix`);
    return results;
  } catch (error) {
    logger.error('Sync attendance from Matrix error:', error);
    throw error;
  }
}

/**
 * Sync leave types from Matrix
 */
async function syncLeaveTypesFromMatrix(companyId) {
  try {
    const company = await Company.findByPk(companyId);
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      throw new Error('Matrix Software integration not configured');
    }

    const { LeaveType } = require('../models');
    const response = await axios.get(
      `${company.matrixApiUrl}/api/leave-types`,
      {
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`
        }
      }
    );

    const matrixLeaveTypes = response.data || [];
    const results = { success: 0, failed: 0 };

    for (const lt of matrixLeaveTypes) {
      try {
        const [leaveType, created] = await LeaveType.findOrCreate({
          where: {
            companyId,
            matrixLeaveTypeId: lt.id
          },
          defaults: {
            companyId,
            code: lt.code,
            name: lt.name,
            shortName: lt.shortName,
            maxDaysPerYear: lt.maxDaysPerYear,
            carryForward: lt.carryForward,
            matrixLeaveTypeId: lt.id
          }
        });

        if (!created) {
          await leaveType.update({
            code: lt.code,
            name: lt.name,
            shortName: lt.shortName,
            maxDaysPerYear: lt.maxDaysPerYear,
            carryForward: lt.carryForward
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        logger.error(`Error syncing leave type ${lt.id}:`, error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Sync leave types from Matrix error:', error);
    throw error;
  }
}

/**
 * Sync leave balances from Matrix
 */
async function syncLeaveBalancesFromMatrix(companyId, employeeId = null) {
  try {
    const company = await Company.findByPk(companyId);
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      throw new Error('Matrix Software integration not configured');
    }

    const { LeaveBalance, LeaveType } = require('../models');
    const where = { companyId };
    if (employeeId) {
      const employee = await Employee.findByPk(employeeId);
      if (employee && employee.matrixEmployeeId) {
        where.matrixEmployeeId = employee.matrixEmployeeId;
      }
    }

    const response = await axios.get(
      `${company.matrixApiUrl}/api/leave-balances`,
      {
        params: where,
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`
        }
      }
    );

    const matrixBalances = response.data || [];
    const results = { success: 0, failed: 0 };

    for (const balance of matrixBalances) {
      try {
        const employee = await Employee.findOne({
          where: {
            companyId,
            matrixEmployeeId: balance.employeeId
          }
        });

        if (!employee) {
          results.failed++;
          continue;
        }

        const leaveType = await LeaveType.findOne({
          where: {
            companyId,
            matrixLeaveTypeId: balance.leaveTypeId
          }
        });

        if (!leaveType) {
          results.failed++;
          continue;
        }

        const [leaveBalance, created] = await LeaveBalance.findOrCreate({
          where: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: balance.year
          },
          defaults: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: balance.year,
            allocated: balance.allocated || 0,
            used: balance.used || 0,
            balance: balance.balance || 0,
            matrixBalance: balance.balance
          }
        });

        if (!created) {
          leaveBalance.allocated = balance.allocated || leaveBalance.allocated;
          leaveBalance.used = balance.used || leaveBalance.used;
          leaveBalance.balance = balance.balance || leaveBalance.balance;
          leaveBalance.matrixBalance = balance.balance;
          leaveBalance.lastSyncedWithMatrix = new Date();
          await leaveBalance.save();
        }

        results.success++;
      } catch (error) {
        results.failed++;
        logger.error(`Error syncing leave balance:`, error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Sync leave balances from Matrix error:', error);
    throw error;
  }
}

/**
 * Sync holiday calendar from Matrix
 */
async function syncHolidayCalendarFromMatrix(companyId, year) {
  try {
    const company = await Company.findByPk(companyId);
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      throw new Error('Matrix Software integration not configured');
    }

    const { HolidayCalendar } = require('../models');
    const response = await axios.get(
      `${company.matrixApiUrl}/api/holidays`,
      {
        params: { year },
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`
        }
      }
    );

    const matrixHolidays = response.data || [];
    const results = { success: 0, failed: 0 };

    for (const holiday of matrixHolidays) {
      try {
        const [holidayRecord, created] = await HolidayCalendar.findOrCreate({
          where: {
            companyId,
            matrixHolidayId: holiday.id
          },
          defaults: {
            companyId,
            year: year || new Date().getFullYear(),
            name: holiday.name,
            date: holiday.date,
            description: holiday.description,
            isNational: holiday.isNational || true,
            matrixHolidayId: holiday.id,
            lastSyncedWithMatrix: new Date()
          }
        });

        if (!created) {
          holidayRecord.name = holiday.name;
          holidayRecord.date = holiday.date;
          holidayRecord.description = holiday.description;
          holidayRecord.lastSyncedWithMatrix = new Date();
          await holidayRecord.save();
        }

        results.success++;
      } catch (error) {
        results.failed++;
        logger.error(`Error syncing holiday:`, error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Sync holiday calendar from Matrix error:', error);
    throw error;
  }
}

module.exports = {
  syncAttendanceFromMatrix,
  syncLeaveTypesFromMatrix,
  syncLeaveBalancesFromMatrix,
  syncHolidayCalendarFromMatrix
};



