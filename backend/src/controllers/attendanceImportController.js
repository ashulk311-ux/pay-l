const { Attendance, Employee } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Upload daily attendance Excel
 */
exports.uploadDailyAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const row of data) {
      try {
        const employeeCode = row['Employee Code'] || row['EmployeeCode'] || row['employee_code'];
        const date = row['Date'] || row['date'];
        const status = row['Status'] || row['status'];
        const checkIn = row['Check In'] || row['CheckIn'] || row['check_in'];
        const checkOut = row['Check Out'] || row['CheckOut'] || row['check_out'];
        const hoursWorked = row['Hours Worked'] || row['HoursWorked'] || row['hours_worked'];
        const remarks = row['Remarks'] || row['remarks'];

        if (!employeeCode || !date || !status) {
          results.failed++;
          results.errors.push(`Row ${data.indexOf(row) + 2}: Missing required fields`);
          continue;
        }

        const employee = await Employee.findOne({
          where: {
            employeeCode,
            companyId: req.user.companyId
          }
        });

        if (!employee) {
          results.failed++;
          results.errors.push(`Row ${data.indexOf(row) + 2}: Employee not found: ${employeeCode}`);
          continue;
        }

        // Parse date
        let attendanceDate;
        if (typeof date === 'number') {
          attendanceDate = XLSX.SSF.parse_date_code(date);
          attendanceDate = new Date(attendanceDate.y, attendanceDate.m - 1, attendanceDate.d);
        } else {
          attendanceDate = new Date(date);
        }

        const [attendance, created] = await Attendance.findOrCreate({
          where: {
            employeeId: employee.id,
            date: attendanceDate.toISOString().split('T')[0]
          },
          defaults: {
            employeeId: employee.id,
            date: attendanceDate.toISOString().split('T')[0],
            status: status.toLowerCase(),
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
            remarks: remarks || null,
            isManual: false,
            uploadedBy: req.user.id
          }
        });

        if (!created) {
          await attendance.update({
            status: status.toLowerCase(),
            checkIn: checkIn || attendance.checkIn,
            checkOut: checkOut || attendance.checkOut,
            hoursWorked: hoursWorked ? parseFloat(hoursWorked) : attendance.hoursWorked,
            remarks: remarks || attendance.remarks,
            uploadedBy: req.user.id
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'bulk_upload',
      description: `Daily attendance uploaded: ${results.success} success, ${results.failed} failed`
    });

    res.json({
      success: true,
      message: `Upload completed: ${results.success} records processed, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    logger.error('Upload daily attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload attendance', error: error.message });
  }
};

/**
 * Upload monthly attendance Excel
 */
exports.uploadMonthlyAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // First row should contain dates
    const dateRow = data[0];
    const dates = Object.keys(dateRow).filter(key => {
      const dateValue = dateRow[key];
      if (typeof dateValue === 'number') {
        const parsed = XLSX.SSF.parse_date_code(dateValue);
        return parsed.y === parseInt(year) && parsed.m === parseInt(month);
      }
      return false;
    });

    // Process each employee row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const employeeCode = row['Employee Code'] || row['EmployeeCode'] || row['employee_code'] || Object.values(row)[0];

      if (!employeeCode) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: Missing employee code`);
        continue;
      }

      const employee = await Employee.findOne({
        where: {
          employeeCode,
          companyId: req.user.companyId
        }
      });

      if (!employee) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: Employee not found: ${employeeCode}`);
        continue;
      }

      // Process each date column
      for (const dateKey of dates) {
        try {
          const status = row[dateKey];
          if (!status) continue;

          const dateValue = dateRow[dateKey];
          let attendanceDate;
          if (typeof dateValue === 'number') {
            const parsed = XLSX.SSF.parse_date_code(dateValue);
            attendanceDate = new Date(parsed.y, parsed.m - 1, parsed.d);
          } else {
            attendanceDate = new Date(dateValue);
          }

          const [attendance, created] = await Attendance.findOrCreate({
            where: {
              employeeId: employee.id,
              date: attendanceDate.toISOString().split('T')[0]
            },
            defaults: {
              employeeId: employee.id,
              date: attendanceDate.toISOString().split('T')[0],
              status: status.toString().toLowerCase(),
              isManual: false,
              uploadedBy: req.user.id
            }
          });

          if (!created) {
            await attendance.update({
              status: status.toString().toLowerCase(),
              uploadedBy: req.user.id
            });
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 2}, Date ${dateKey}: ${error.message}`);
        }
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'bulk_upload',
      description: `Monthly attendance uploaded for ${month}/${year}: ${results.success} records processed`
    });

    res.json({
      success: true,
      message: `Upload completed: ${results.success} records processed, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    logger.error('Upload monthly attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload attendance', error: error.message });
  }
};

/**
 * Update attendance record
 */
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!attendance || attendance.employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (attendance.isLocked) {
      return res.status(400).json({ success: false, message: 'Attendance record is locked and cannot be edited' });
    }

    const { status, checkIn, checkOut, hoursWorked, remarks } = req.body;

    await attendance.update({
      status: status || attendance.status,
      checkIn: checkIn !== undefined ? checkIn : attendance.checkIn,
      checkOut: checkOut !== undefined ? checkOut : attendance.checkOut,
      hoursWorked: hoursWorked !== undefined ? parseFloat(hoursWorked) : attendance.hoursWorked,
      remarks: remarks !== undefined ? remarks : attendance.remarks,
      isManual: true
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'update',
      entityType: 'Attendance',
      entityId: attendance.id
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance' });
  }
};



