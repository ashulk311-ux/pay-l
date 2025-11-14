const { Employee, Payroll, Payslip, Attendance, Leave, Loan, Reimbursement } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get dashboard analytics data
 */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Get employees by department
    const employees = await Employee.findAll({
      where: { companyId, isActive: true },
      attributes: ['id', 'department', 'isActive']
    });

    const departmentDistribution = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
    });

    // Get payrolls for last 6 months
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const payrolls = await Payroll.findAll({
      where: {
        companyId,
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      order: [['year', 'ASC'], ['month', 'ASC']]
    });

    const monthlyPayrollData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const payroll = payrolls.find(p => p.month === month && p.year === year);
      monthlyPayrollData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year,
        grossSalary: payroll ? parseFloat(payroll.totalGrossSalary) || 0 : 0,
        netSalary: payroll ? parseFloat(payroll.totalNetSalary) || 0 : 0,
        employees: payroll ? payroll.totalEmployees || 0 : 0
      });
    }

    // Payroll status distribution
    const allPayrolls = await Payroll.findAll({
      where: { companyId }
    });

    const statusDistribution = {
      draft: 0,
      processing: 0,
      locked: 0,
      finalized: 0,
      paid: 0
    };

    allPayrolls.forEach(p => {
      if (statusDistribution.hasOwnProperty(p.status)) {
        statusDistribution[p.status]++;
      }
    });

    // Employee status breakdown
    const employeeStatus = {
      active: employees.filter(e => e.isActive).length,
      inactive: employees.filter(e => !e.isActive).length
    };

    // Recent activity counts
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Get employee IDs for the company
    const employeeIds = employees.map(e => e.id);

    const recentLoans = await Loan.count({
      where: {
        employeeId: { [Op.in]: employeeIds },
        createdAt: { [Op.gte]: last30Days }
      }
    });

    const recentReimbursements = await Reimbursement.count({
      where: {
        employeeId: { [Op.in]: employeeIds },
        createdAt: { [Op.gte]: last30Days }
      }
    });

    const pendingLeaves = await Leave.count({
      where: {
        employeeId: { [Op.in]: employeeIds },
        status: 'pending'
      }
    });

    // Current month attendance summary
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const currentMonthAttendance = await Attendance.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        date: { [Op.between]: [currentMonthStart, currentMonthEnd] }
      }
    });

    const attendanceSummary = {
      present: currentMonthAttendance.filter(a => a.status === 'present').length,
      absent: currentMonthAttendance.filter(a => a.status === 'absent').length,
      halfDay: currentMonthAttendance.filter(a => a.status === 'half-day').length,
      total: currentMonthAttendance.length
    };

    res.json({
      success: true,
      data: {
        departmentDistribution,
        monthlyPayrollData,
        statusDistribution,
        employeeStatus,
        recentActivity: {
          loans: recentLoans,
          reimbursements: recentReimbursements,
          pendingLeaves
        },
        attendanceSummary
      }
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics', error: error.message });
  }
};

