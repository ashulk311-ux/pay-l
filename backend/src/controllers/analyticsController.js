const { Payroll, Payslip, Employee, Attendance, LeaveRequest, Loan, Reimbursement } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get comprehensive payroll analytics
 */
exports.getPayrollAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (year) {
      dateFilter = {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31`)
      };
    } else {
      // Default to current year
      const currentYear = new Date().getFullYear();
      dateFilter = {
        [Op.gte]: new Date(`${currentYear}-01-01`),
        [Op.lte]: new Date(`${currentYear}-12-31`)
      };
    }

    // Get all payrolls in the date range
    const payrolls = await Payroll.findAll({
      where: {
        companyId: req.user.companyId,
        status: { [Op.in]: ['finalized', 'paid'] },
        createdAt: dateFilter
      },
      include: [
        {
          model: Payslip,
          as: 'payslips',
          include: [{ model: Employee, as: 'employee' }]
        }
      ],
      order: [['year', 'ASC'], ['month', 'ASC']]
    });

    // Calculate analytics
    const analytics = {
      overview: {
        totalPayrolls: payrolls.length,
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        averageGrossSalary: 0,
        averageNetSalary: 0
      },
      monthlyTrend: [],
      departmentWise: {},
      designationWise: {},
      statutoryBreakdown: {
        pf: { employee: 0, employer: 0, total: 0 },
        esi: { employee: 0, employer: 0, total: 0 },
        tds: 0,
        pt: 0,
        lwf: 0
      },
      costAnalysis: {
        ctc: 0,
        grossSalary: 0,
        statutoryContributions: 0,
        otherBenefits: 0
      },
      employeeMetrics: {
        activeEmployees: 0,
        newJoinings: 0,
        exits: 0,
        averageTenure: 0
      }
    };

    const employeeSet = new Set();
    const departmentStats = {};
    const designationStats = {};

    payrolls.forEach(payroll => {
      analytics.overview.totalGrossSalary += parseFloat(payroll.totalGrossSalary || 0);
      analytics.overview.totalDeductions += parseFloat(payroll.totalDeductions || 0);
      analytics.overview.totalNetSalary += parseFloat(payroll.totalNetSalary || 0);

      // Monthly trend
      const monthKey = `${payroll.year}-${String(payroll.month).padStart(2, '0')}`;
      const existingMonth = analytics.monthlyTrend.find(m => m.month === monthKey);
      if (existingMonth) {
        existingMonth.grossSalary += parseFloat(payroll.totalGrossSalary || 0);
        existingMonth.netSalary += parseFloat(payroll.totalNetSalary || 0);
        existingMonth.employeeCount = payroll.payslips?.length || 0;
      } else {
        analytics.monthlyTrend.push({
          month: monthKey,
          year: payroll.year,
          monthNumber: payroll.month,
          grossSalary: parseFloat(payroll.totalGrossSalary || 0),
          netSalary: parseFloat(payroll.totalNetSalary || 0),
          employeeCount: payroll.payslips?.length || 0
        });
      }

      // Process payslips
      if (payroll.payslips) {
        payroll.payslips.forEach(payslip => {
          employeeSet.add(payslip.employeeId);

          const employee = payslip.employee;
          if (employee) {
            // Department wise
            const dept = employee.department || 'Unassigned';
            if (!departmentStats[dept]) {
              departmentStats[dept] = { gross: 0, net: 0, count: 0 };
            }
            departmentStats[dept].gross += parseFloat(payslip.grossSalary || 0);
            departmentStats[dept].net += parseFloat(payslip.netSalary || 0);
            departmentStats[dept].count++;

            // Designation wise
            const desig = employee.designation || 'Unassigned';
            if (!designationStats[desig]) {
              designationStats[desig] = { gross: 0, net: 0, count: 0 };
            }
            designationStats[desig].gross += parseFloat(payslip.grossSalary || 0);
            designationStats[desig].net += parseFloat(payslip.netSalary || 0);
            designationStats[desig].count++;

            // Statutory breakdown
            const deductions = payslip.deductions || {};
            const pfDetails = deductions.details?.pf || {};
            analytics.statutoryBreakdown.pf.employee += parseFloat(deductions.pf || 0);
            analytics.statutoryBreakdown.pf.employer += parseFloat(pfDetails.employer || 0);
            analytics.statutoryBreakdown.pf.total += parseFloat(deductions.pf || 0) + parseFloat(pfDetails.employer || 0);

            const esiDetails = deductions.details?.esi || {};
            analytics.statutoryBreakdown.esi.employee += parseFloat(deductions.esi || 0);
            analytics.statutoryBreakdown.esi.employer += parseFloat(esiDetails.employer || 0);
            analytics.statutoryBreakdown.esi.total += parseFloat(deductions.esi || 0) + parseFloat(esiDetails.employer || 0);

            analytics.statutoryBreakdown.tds += parseFloat(deductions.tds || 0);
            analytics.statutoryBreakdown.pt += parseFloat(deductions.pt || 0);
            analytics.statutoryBreakdown.lwf += parseFloat(deductions.lwf || 0);
          }
        });
      }
    });

    analytics.overview.totalEmployees = employeeSet.size;
    analytics.overview.averageGrossSalary = analytics.overview.totalEmployees > 0 
      ? analytics.overview.totalGrossSalary / analytics.overview.totalEmployees 
      : 0;
    analytics.overview.averageNetSalary = analytics.overview.totalEmployees > 0 
      ? analytics.overview.totalNetSalary / analytics.overview.totalEmployees 
      : 0;

    // Convert department and designation stats
    analytics.departmentWise = Object.keys(departmentStats).map(dept => ({
      department: dept,
      totalGross: departmentStats[dept].gross,
      totalNet: departmentStats[dept].net,
      employeeCount: departmentStats[dept].count,
      averageGross: departmentStats[dept].gross / departmentStats[dept].count,
      averageNet: departmentStats[dept].net / departmentStats[dept].count
    }));

    analytics.designationWise = Object.keys(designationStats).map(desig => ({
      designation: desig,
      totalGross: designationStats[desig].gross,
      totalNet: designationStats[desig].net,
      employeeCount: designationStats[desig].count,
      averageGross: designationStats[desig].gross / designationStats[desig].count,
      averageNet: designationStats[desig].net / designationStats[desig].count
    }));

    // Cost analysis
    analytics.costAnalysis.grossSalary = analytics.overview.totalGrossSalary;
    analytics.costAnalysis.statutoryContributions = 
      analytics.statutoryBreakdown.pf.employer +
      analytics.statutoryBreakdown.esi.employer;
    analytics.costAnalysis.ctc = 
      analytics.costAnalysis.grossSalary +
      analytics.costAnalysis.statutoryContributions;

    // Employee metrics
    const activeEmployees = await Employee.count({
      where: { companyId: req.user.companyId, isActive: true }
    });
    analytics.employeeMetrics.activeEmployees = activeEmployees;

    // Get new joinings and exits in the period
    const newJoinings = await Employee.count({
      where: {
        companyId: req.user.companyId,
        dateOfJoining: dateFilter
      }
    });
    analytics.employeeMetrics.newJoinings = newJoinings;

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get payroll analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
};

/**
 * Get attendance analytics
 */
exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      dateFilter = {
        [Op.between]: [start, end]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: {
        date: dateFilter,
        employeeId: {
          [Op.in]: await Employee.findAll({
            where: { companyId: req.user.companyId },
            attributes: ['id']
          }).then(emps => emps.map(e => e.id))
        }
      },
      include: [{ model: Employee, as: 'employee' }]
    });

    const analytics = {
      totalDays: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      averageAttendance: 0,
      departmentWise: {},
      employeeWise: {}
    };

    attendanceRecords.forEach(record => {
      analytics.totalDays++;
      if (record.status === 'present') analytics.present++;
      else if (record.status === 'absent') analytics.absent++;
      else if (record.status === 'half-day') analytics.halfDay++;

      const dept = record.employee?.department || 'Unassigned';
      if (!analytics.departmentWise[dept]) {
        analytics.departmentWise[dept] = { present: 0, absent: 0, total: 0 };
      }
      analytics.departmentWise[dept].total++;
      if (record.status === 'present') analytics.departmentWise[dept].present++;
      else if (record.status === 'absent') analytics.departmentWise[dept].absent++;
    });

    analytics.averageAttendance = analytics.totalDays > 0 
      ? (analytics.present / analytics.totalDays) * 100 
      : 0;

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get attendance analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance analytics', error: error.message });
  }
};



