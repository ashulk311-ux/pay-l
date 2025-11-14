const XLSX = require('xlsx');
const logger = require('../utils/logger');
const { Employee } = require('../models');

/**
 * Parse attendance Excel file
 * Expected format:
 * Employee Code | Date | Status | Check In | Check Out | Hours Worked | Remarks
 * @param {String} filePath - Path to Excel file
 * @param {String} companyId - Company ID
 * @returns {Array} Parsed attendance records
 */
async function parseAttendanceExcel(filePath, companyId) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const records = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Get employee by code
        const employeeCode = row['Employee Code'] || row['EmployeeCode'] || row['employee_code'] || row['employeeCode'];
        if (!employeeCode) {
          errors.push({ row: rowNum, error: 'Employee Code is required' });
          continue;
        }

        const employee = await Employee.findOne({
          where: {
            companyId: companyId,
            employeeCode: String(employeeCode).trim(),
            isActive: true
          }
        });

        if (!employee) {
          errors.push({ row: rowNum, error: `Employee not found: ${employeeCode}` });
          continue;
        }

        // Parse date
        let date;
        const dateValue = row['Date'] || row['date'];
        if (dateValue) {
          if (dateValue instanceof Date) {
            date = dateValue;
          } else if (typeof dateValue === 'number') {
            // Excel date serial number
            date = XLSX.SSF.parse_date_code(dateValue);
            date = new Date(date.y, date.m - 1, date.d);
          } else {
            date = new Date(dateValue);
          }
        } else {
          errors.push({ row: rowNum, error: 'Date is required' });
          continue;
        }

        // Parse status
        const statusValue = (row['Status'] || row['status'] || 'present').toString().toLowerCase();
        let status = 'present';
        if (statusValue.includes('present') || statusValue === 'p') {
          status = 'present';
        } else if (statusValue.includes('absent') || statusValue === 'a') {
          status = 'absent';
        } else if (statusValue.includes('half') || statusValue === 'h') {
          status = 'half-day';
        } else if (statusValue.includes('holiday')) {
          status = 'holiday';
        } else if (statusValue.includes('weekend')) {
          status = 'weekend';
        }

        // Parse check-in/check-out times
        let checkIn = null;
        let checkOut = null;
        const checkInValue = row['Check In'] || row['CheckIn'] || row['check_in'] || row['checkIn'];
        const checkOutValue = row['Check Out'] || row['CheckOut'] || row['check_out'] || row['checkOut'];

        if (checkInValue) {
          if (checkInValue instanceof Date) {
            checkIn = checkInValue.toTimeString().substring(0, 5);
          } else {
            checkIn = String(checkInValue).substring(0, 5);
          }
        }

        if (checkOutValue) {
          if (checkOutValue instanceof Date) {
            checkOut = checkOutValue.toTimeString().substring(0, 5);
          } else {
            checkOut = String(checkOutValue).substring(0, 5);
          }
        }

        // Parse hours worked
        let hoursWorked = null;
        const hoursValue = row['Hours Worked'] || row['HoursWorked'] || row['hours_worked'] || row['hoursWorked'];
        if (hoursValue) {
          hoursWorked = parseFloat(hoursValue) || null;
        } else if (checkIn && checkOut) {
          // Calculate hours from check-in/check-out
          const [inHour, inMin] = checkIn.split(':').map(Number);
          const [outHour, outMin] = checkOut.split(':').map(Number);
          const inTime = inHour * 60 + inMin;
          const outTime = outHour * 60 + outMin;
          hoursWorked = (outTime - inTime) / 60;
        }

        // Remarks
        const remarks = row['Remarks'] || row['remarks'] || null;

        records.push({
          employeeId: employee.id,
          employeeCode: employeeCode,
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          status: status,
          checkIn: checkIn,
          checkOut: checkOut,
          hoursWorked: hoursWorked,
          remarks: remarks,
          isManual: true
        });
      } catch (error) {
        errors.push({ row: rowNum, error: error.message });
        logger.error(`Error parsing row ${rowNum}:`, error);
      }
    }

    return {
      records,
      errors,
      totalRows: data.length,
      successCount: records.length,
      errorCount: errors.length
    };
  } catch (error) {
    logger.error('Error parsing attendance Excel:', error);
    throw error;
  }
}

/**
 * Export attendance data to Excel
 * @param {Array} attendanceRecords - Array of attendance records
 * @param {String} filePath - Path to save Excel file
 * @returns {String} Path to generated Excel file
 */
function exportAttendanceToExcel(attendanceRecords, filePath) {
  try {
    const data = attendanceRecords.map(record => ({
      'Employee Code': record.employee?.employeeCode || record.employeeCode,
      'Employee Name': record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : '',
      'Date': record.date,
      'Status': record.status,
      'Check In': record.checkIn || '',
      'Check Out': record.checkOut || '',
      'Hours Worked': record.hoursWorked || '',
      'Remarks': record.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Auto-size columns
    const maxWidth = 20;
    worksheet['!cols'] = [
      { wch: 15 }, // Employee Code
      { wch: 25 }, // Employee Name
      { wch: 12 }, // Date
      { wch: 12 }, // Status
      { wch: 10 }, // Check In
      { wch: 10 }, // Check Out
      { wch: 12 }, // Hours Worked
      { wch: maxWidth } // Remarks
    ];

    XLSX.writeFile(workbook, filePath);
    return filePath;
  } catch (error) {
    logger.error('Error exporting attendance to Excel:', error);
    throw error;
  }
}

/**
 * Parse leave Excel file
 * Expected format:
 * Employee Code | Leave Type | Start Date | End Date | Reason
 * @param {String} filePath - Path to Excel file
 * @param {String} companyId - Company ID
 * @returns {Array} Parsed leave records
 */
async function parseLeaveExcel(filePath, companyId) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const records = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const employeeCode = row['Employee Code'] || row['EmployeeCode'] || row['employee_code'] || row['employeeCode'];
        if (!employeeCode) {
          errors.push({ row: rowNum, error: 'Employee Code is required' });
          continue;
        }

        const employee = await Employee.findOne({
          where: {
            companyId: companyId,
            employeeCode: String(employeeCode).trim(),
            isActive: true
          }
        });

        if (!employee) {
          errors.push({ row: rowNum, error: `Employee not found: ${employeeCode}` });
          continue;
        }

        // Parse dates
        let startDate, endDate;
        const startDateValue = row['Start Date'] || row['StartDate'] || row['start_date'] || row['startDate'];
        const endDateValue = row['End Date'] || row['EndDate'] || row['end_date'] || row['endDate'];

        if (startDateValue) {
          if (startDateValue instanceof Date) {
            startDate = startDateValue;
          } else if (typeof startDateValue === 'number') {
            const date = XLSX.SSF.parse_date_code(startDateValue);
            startDate = new Date(date.y, date.m - 1, date.d);
          } else {
            startDate = new Date(startDateValue);
          }
        } else {
          errors.push({ row: rowNum, error: 'Start Date is required' });
          continue;
        }

        if (endDateValue) {
          if (endDateValue instanceof Date) {
            endDate = endDateValue;
          } else if (typeof endDateValue === 'number') {
            const date = XLSX.SSF.parse_date_code(endDateValue);
            endDate = new Date(date.y, date.m - 1, date.d);
          } else {
            endDate = new Date(endDateValue);
          }
        } else {
          endDate = startDate; // Single day leave
        }

        // Parse leave type
        const leaveTypeValue = (row['Leave Type'] || row['LeaveType'] || row['leave_type'] || row['leaveType'] || 'CL').toString().toUpperCase();
        const validLeaveTypes = ['CL', 'SL', 'PL', 'EL', 'ML', 'LWP'];
        const leaveType = validLeaveTypes.includes(leaveTypeValue) ? leaveTypeValue : 'CL';

        // Calculate days
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const reason = row['Reason'] || row['reason'] || '';

        records.push({
          employeeId: employee.id,
          employeeCode: employeeCode,
          leaveType: leaveType,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days: days,
          reason: reason,
          status: 'pending'
        });
      } catch (error) {
        errors.push({ row: rowNum, error: error.message });
        logger.error(`Error parsing leave row ${rowNum}:`, error);
      }
    }

    return {
      records,
      errors,
      totalRows: data.length,
      successCount: records.length,
      errorCount: errors.length
    };
  } catch (error) {
    logger.error('Error parsing leave Excel:', error);
    throw error;
  }
}

module.exports = {
  parseAttendanceExcel,
  exportAttendanceToExcel,
  parseLeaveExcel
};

