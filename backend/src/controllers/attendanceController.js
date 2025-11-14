const { Attendance, Employee, Leave } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const excelService = require('../services/excelService');
const path = require('path');
const fs = require('fs');

/**
 * Get attendance records with filters
 */
exports.getAttendance = async (req, res) => {
  try {
    const { 
      employeeId, 
      startDate, 
      endDate, 
      status, 
      month, 
      year,
      page = 1, 
      limit = 100 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Employee filter
    if (employeeId) {
      whereClause.employeeId = employeeId;
    } else {
      // If no employeeId, filter by company employees
      const employees = await Employee.findAll({
        where: { companyId: req.user.companyId, isActive: true },
        attributes: ['id']
      });
      whereClause.employeeId = { [Op.in]: employees.map(e => e.id) };
    }

    // Date range filter
    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      whereClause.date = { [Op.between]: [start, end] };
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

/**
 * Get employee attendance summary
 */
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.findAll({
      where: {
        employeeId: id,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    });

    // Calculate summary
    const summary = {
      totalDays: endDate.getDate(),
      presentDays: 0,
      absentDays: 0,
      halfDays: 0,
      leaveDays: 0,
      holidays: 0,
      weekends: 0,
      totalHours: 0
    };

    attendanceRecords.forEach(record => {
      if (record.status === 'present') {
        summary.presentDays++;
        summary.totalHours += parseFloat(record.hoursWorked) || 8;
      } else if (record.status === 'absent') {
        summary.absentDays++;
      } else if (record.status === 'half-day') {
        summary.halfDays++;
        summary.totalHours += parseFloat(record.hoursWorked) || 4;
      } else if (record.status === 'holiday') {
        summary.holidays++;
      } else if (record.status === 'weekend') {
        summary.weekends++;
      }
    });

    // Get leave records for the month
    const leaveRecords = await Leave.findAll({
      where: {
        employeeId: id,
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
        status: 'approved'
      }
    });

    leaveRecords.forEach(leave => {
      summary.leaveDays += parseFloat(leave.days) || 0;
    });

    res.json({
      success: true,
      data: {
        employeeId: id,
        month: parseInt(month),
        year: parseInt(year),
        records: attendanceRecords,
        summary: summary
      }
    });
  } catch (error) {
    logger.error('Get employee attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee attendance', error: error.message });
  }
};

/**
 * Create single attendance record
 */
exports.createAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, hoursWorked, remarks } = req.body;

    // Validate required fields
    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, date, and status are required'
      });
    }

    // Check if employee exists and belongs to company
    const employee = await Employee.findOne({
      where: { id: employeeId, companyId: req.user.companyId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if attendance already exists
    const existing = await Attendance.findOne({
      where: { employeeId, date }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this date'
      });
    }

    // Check if locked
    if (existing && existing.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is locked and cannot be modified'
      });
    }

    const attendance = await Attendance.create({
      employeeId,
      date,
      status,
      checkIn,
      checkOut,
      hoursWorked,
      remarks,
      isManual: true,
      uploadedBy: req.user.id
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'create',
      entityType: 'Attendance',
      entityId: attendance.id,
      description: `Attendance created for ${employee.employeeCode} on ${date}`
    });

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Create attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to create attendance', error: error.message });
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

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Check if locked
    if (attendance.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is locked and cannot be modified'
      });
    }

    // Check company access
    if (attendance.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await attendance.update({
      ...req.body,
      isManual: true
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'update',
      entityType: 'Attendance',
      entityId: attendance.id,
      description: `Attendance updated for ${attendance.employee.employeeCode} on ${attendance.date}`
    });

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance', error: error.message });
  }
};

/**
 * Bulk upload attendance from Excel
 */
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const parseResult = await excelService.parseAttendanceExcel(filePath, req.user.companyId);

    if (parseResult.errors.length > 0 && parseResult.records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse Excel file',
        errors: parseResult.errors
      });
    }

    // Create/update attendance records
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const record of parseResult.records) {
      try {
        // Check if record already exists
        const existing = await Attendance.findOne({
          where: {
            employeeId: record.employeeId,
            date: record.date
          }
        });

        if (existing) {
          // Skip if locked
          if (existing.isLocked) {
            results.skipped++;
            continue;
          }
          // Update existing
          await existing.update({
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            hoursWorked: record.hoursWorked,
            remarks: record.remarks,
            isManual: true,
            uploadedBy: req.user.id
          });
          results.updated++;
        } else {
          // Create new
          await Attendance.create({
            ...record,
            uploadedBy: req.user.id
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          employeeCode: record.employeeCode,
          date: record.date,
          error: error.message
        });
        logger.error(`Error processing attendance record:`, error);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'create',
      entityType: 'Attendance',
      description: `Bulk attendance upload: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`
    });

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      logger.warn('Failed to delete uploaded file:', error);
    }

    res.json({
      success: true,
      message: `Attendance upload completed. ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      data: {
        ...results,
        parseErrors: parseResult.errors
      }
    });
  } catch (error) {
    logger.error('Bulk upload attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload attendance', error: error.message });
  }
};

/**
 * Get leave balance for employee
 */
exports.getLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get all approved leaves for the year
    const leaves = await Leave.findAll({
      where: {
        employeeId: id,
        status: 'approved',
        startDate: { [Op.gte]: new Date(currentYear, 0, 1) },
        endDate: { [Op.lte]: new Date(currentYear, 11, 31) }
      }
    });

    // Calculate leave balance (assuming standard leave allocation)
    // This can be configured per company/employee
    const leaveAllocation = {
      CL: 12, // Casual Leave
      SL: 12, // Sick Leave
      PL: 15, // Privilege Leave
      EL: 5,  // Earned Leave
      ML: 0,  // Maternity Leave
      LWP: 0  // Leave Without Pay
    };

    const leaveBalance = {};
    const leaveUsed = {};

    Object.keys(leaveAllocation).forEach(type => {
      leaveUsed[type] = leaves
        .filter(l => l.leaveType === type)
        .reduce((sum, l) => sum + parseFloat(l.days || 0), 0);
      leaveBalance[type] = leaveAllocation[type] - leaveUsed[type];
    });

    res.json({
      success: true,
      data: {
        employeeId: id,
        year: currentYear,
        allocation: leaveAllocation,
        used: leaveUsed,
        balance: leaveBalance,
        leaves: leaves
      }
    });
  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave balance', error: error.message });
  }
};

/**
 * Apply for leave
 */
exports.applyLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !leaveType || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, leave type, and start date are required'
      });
    }

    const employee = await Employee.findOne({
      where: { id: employeeId, companyId: req.user.companyId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const end = endDate || startDate;
    const start = new Date(startDate);
    const endD = new Date(end);
    const days = Math.ceil((endD - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      where: {
        employeeId,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, end] },
            endDate: { [Op.between]: [startDate, end] }
          },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: end }
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Leave application overlaps with existing approved/pending leave'
      });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate,
      endDate: end,
      days,
      reason,
      status: 'pending'
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'create',
      entityType: 'Leave',
      entityId: leave.id,
      description: `Leave application submitted: ${leaveType} for ${days} days`
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error) {
    logger.error('Apply leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply for leave', error: error.message });
  }
};

/**
 * Update leave status (approve/reject)
 */
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or cancelled'
      });
    }

    const leave = await Leave.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    // Check company access
    if (leave.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    if (remarks) {
      leave.remarks = remarks;
    }
    await leave.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'Leave',
      entityId: leave.id,
      description: `Leave ${status}: ${leave.leaveType} for ${leave.days} days`
    });

    res.json({
      success: true,
      message: `Leave application ${status} successfully`,
      data: leave
    });
  } catch (error) {
    logger.error('Update leave status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave status', error: error.message });
  }
};

