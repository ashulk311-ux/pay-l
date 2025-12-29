const { Employee, Payslip, Payroll, Attendance, Leave, SalaryStructure, GlobalPolicy, ITDeclaration } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Helper function to get employee by user
 */
async function getEmployeeByUser(user) {
  // Try to find employee by email (common pattern)
  const employee = await Employee.findOne({
    where: {
      email: user.email,
      companyId: user.companyId
    }
  });
  return employee;
}

/**
 * Get employee dashboard data
 */
exports.getDashboard = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    // Get recent payslips
    const recentPayslips = await Payslip.findAll({
      where: { employeeId },
      include: [{ model: Payroll, as: 'payroll' }],
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    // Get attendance summary for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const attendanceRecords = await Attendance.findAll({
      where: {
        employeeId,
        date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
    const totalDays = attendanceRecords.length;

    // Get leave balance
    const leaveBalance = await calculateLeaveBalance(employeeId);

    // Get pending leaves
    const pendingLeaves = await Leave.count({
      where: {
        employeeId,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`,
          designation: employee.designation,
          department: employee.department
        },
        recentPayslips: recentPayslips.map(p => ({
          id: p.id,
          month: p.month,
          year: p.year,
          netSalary: parseFloat(p.netSalary) || 0,
          status: p.payroll?.status
        })),
        attendance: {
          presentDays,
          absentDays,
          totalDays,
          attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0
        },
        leaveBalance: leaveBalance.data || {},
        pendingLeaves
      }
    });
  } catch (error) {
    logger.error('Get employee dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message });
  }
};

/**
 * Get employee payslips
 */
exports.getPayslips = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const { month, year } = req.query;

    const whereClause = { employeeId };
    if (month && year) {
      whereClause.month = parseInt(month);
      whereClause.year = parseInt(year);
    }

    const payslips = await Payslip.findAll({
      where: whereClause,
      include: [{ model: Payroll, as: 'payroll' }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json({
      success: true,
      data: payslips.map(p => ({
        id: p.id,
        month: p.month,
        year: p.year,
        grossSalary: parseFloat(p.grossSalary) || 0,
        totalDeductions: parseFloat(p.totalDeductions) || 0,
        netSalary: parseFloat(p.netSalary) || 0,
        status: p.payroll?.status,
        pdfPath: p.pdfPath
      }))
    });
  } catch (error) {
    logger.error('Get employee payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payslips', error: error.message });
  }
};

/**
 * Get single payslip
 */
exports.getPayslip = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;
    const { id } = req.params;

    const payslip = await Payslip.findOne({
      where: { id, employeeId },
      include: [
        { model: Employee, as: 'employee' },
        { model: Payroll, as: 'payroll' }
      ]
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    logger.error('Get employee payslip error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payslip', error: error.message });
  }
};

/**
 * Get employee attendance
 */
exports.getAttendance = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const { startDate, endDate, month, year } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0);
      dateFilter = {
        [Op.between]: [start, end]
      };
    } else {
      // Default to current month
      const currentDate = new Date();
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      dateFilter = {
        [Op.between]: [start, end]
      };
    }

    const attendance = await Attendance.findAll({
      where: {
        employeeId,
        date: dateFilter
      },
      order: [['date', 'DESC']]
    });

    // Calculate summary
    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      holiday: attendance.filter(a => a.status === 'holiday').length,
      weekend: attendance.filter(a => a.status === 'weekend').length
    };

    res.json({
      success: true,
      data: attendance,
      summary
    });
  } catch (error) {
    logger.error('Get employee attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

/**
 * Calculate leave balance for employee
 */
async function calculateLeaveBalance(employeeId) {
  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get leave policy from global policy
    const policy = await GlobalPolicy.findOne({
      where: { companyId: employee.companyId, moduleName: 'leave' }
    });

    const leaveAllocation = policy?.settings?.leaveAllocation || {
      CL: 12,
      SL: 12,
      PL: 0,
      EL: 0,
      ML: 0
    };

    // Get current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);

    // Get approved leaves for current year
    const approvedLeaves = await Leave.findAll({
      where: {
        employeeId,
        status: 'approved',
        startDate: { [Op.gte]: yearStart },
        endDate: { [Op.lte]: yearEnd }
      }
    });

    // Calculate used leaves by type
    const leaveUsed = {};
    approvedLeaves.forEach(leave => {
      const type = leave.leaveType;
      leaveUsed[type] = (leaveUsed[type] || 0) + parseFloat(leave.days || 0);
    });

    // Calculate balance
    const leaveBalance = {};
    Object.keys(leaveAllocation).forEach(type => {
      leaveBalance[type] = {
        allocated: leaveAllocation[type] || 0,
        used: leaveUsed[type] || 0,
        balance: (leaveAllocation[type] || 0) - (leaveUsed[type] || 0)
      };
    });

    return { data: leaveBalance };
  } catch (error) {
    logger.error('Calculate leave balance error:', error);
    throw error;
  }
}

/**
 * Get leave balance
 */
exports.getLeaveBalance = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const balance = await calculateLeaveBalance(employeeId);
    res.json(balance);
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
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Leave type, start date, and end date are required' });
    }

    // Check for overlapping leaves
    const overlappingLeaves = await Leave.findAll({
      where: {
        employeeId,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.lte]: new Date(endDate) },
            endDate: { [Op.gte]: new Date(startDate) }
          }
        ]
      }
    });

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have an overlapping leave request'
      });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'pending'
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'Leave',
      entityId: leave.id,
      module: 'leave',
      description: `Employee applied for ${leaveType} leave`
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
 * Get leave history
 */
exports.getLeaveHistory = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const { status, year } = req.query;

    const whereClause = { employeeId };
    if (status) {
      whereClause.status = status;
    }
    if (year) {
      whereClause[Op.or] = [
        { startDate: { [Op.gte]: new Date(`${year}-01-01`) } },
        { endDate: { [Op.lte]: new Date(`${year}-12-31`) } }
      ];
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    logger.error('Get leave history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave history', error: error.message });
  }
};

/**
 * Submit IT declaration
 */
exports.submitITDeclaration = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const { financialYear, declarations, documents } = req.body;

    if (!financialYear || !declarations) {
      return res.status(400).json({ success: false, message: 'Financial year and declarations are required' });
    }

    // Get or create salary structure
    let salaryStructure = await SalaryStructure.findOne({
      where: { employeeId, isActive: true }
    });

    if (!salaryStructure) {
      return res.status(404).json({ success: false, message: 'Salary structure not found' });
    }

    // Update IT declaration in salary structure
    const extraFields = salaryStructure.extraFields || {};
    extraFields.itDeclaration = {
      financialYear,
      declarations,
      documents: documents || [],
      submittedAt: new Date(),
      status: 'submitted'
    };

    await salaryStructure.update({ extraFields });

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      entityType: 'SalaryStructure',
      entityId: salaryStructure.id,
      module: 'salary',
      description: `IT declaration submitted for FY ${financialYear}`
    });

    res.json({
      success: true,
      message: 'IT declaration submitted successfully',
      data: extraFields.itDeclaration
    });
  } catch (error) {
    logger.error('Submit IT declaration error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit IT declaration', error: error.message });
  }
};

/**
 * Get IT declaration
 */
exports.getITDeclaration = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    // First try to get from ITDeclaration table
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const financialYear = currentMonth >= 4 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    let itDeclaration = await ITDeclaration.findOne({
      where: {
        employeeId,
        financialYear
      }
    });

    // If not found in ITDeclaration table, check salary structure
    if (!itDeclaration) {
      const salaryStructure = await SalaryStructure.findOne({
        where: { employeeId, isActive: true }
      });

      if (salaryStructure && salaryStructure.extraFields?.itDeclaration) {
        itDeclaration = salaryStructure.extraFields.itDeclaration;
      }
    }

    res.json({
      success: true,
      data: itDeclaration
    });
  } catch (error) {
    logger.error('Get IT declaration error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IT declaration', error: error.message });
  }
};

/**
 * Get employee profile
 */
exports.getProfile = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

/**
 * Update employee profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    // Allow only certain fields to be updated by employee
    const allowedFields = ['phone', 'address', 'photo'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await employee.update(updateData);

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      entityType: 'Employee',
      entityId: employee.id,
      module: 'employee',
      description: 'Employee updated profile'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: employee
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

/**
 * Get helpdesk queries
 */
exports.getQueries = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    // Get queries from audit logs (temporary solution until proper helpdesk model is created)
    const AuditLog = require('../models').AuditLog;
    const { getPaginationParams, createPaginatedResponse } = require('../utils/pagination');
    const { page, limit, offset } = getPaginationParams(req, { defaultLimit: 20, maxLimit: 100 });
    
    const { count, rows: queries } = await AuditLog.findAndCountAll({
      where: {
        userId: req.user.id,
        module: 'helpdesk',
        entityType: 'Helpdesk'
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Transform audit logs to query format
    const queryData = queries.map(log => ({
      id: log.id,
      ticketId: `TKT-${log.id.toString().slice(-6).toUpperCase()}`,
      subject: log.metadata?.subject || 'N/A',
      description: log.description || '',
      category: log.metadata?.category || 'other',
      status: log.metadata?.status || 'open',
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    }));

    res.json(createPaginatedResponse(queryData, count, page, limit));
  } catch (error) {
    logger.error('Get queries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queries', error: error.message });
  }
};

/**
 * Raise helpdesk query
 */
exports.raiseQuery = async (req, res) => {
  try {
    const employee = await getEmployeeByUser(req.user);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    const employeeId = employee.id;

    const { subject, description, category } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    // Create an audit log entry for the helpdesk query
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'Helpdesk',
      entityId: employeeId,
      module: 'helpdesk',
      description: `Helpdesk query: ${subject} - ${description}`,
      metadata: { category, subject, description, status: 'open' }
    });

    res.json({
      success: true,
      message: 'Query raised successfully. Our team will get back to you soon.'
    });
  } catch (error) {
    logger.error('Raise query error:', error);
    res.status(500).json({ success: false, message: 'Failed to raise query', error: error.message });
  }
};
