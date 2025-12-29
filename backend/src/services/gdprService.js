const { Employee, User, Payslip, Attendance, Leave, Loan, Reimbursement, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const encryptionService = require('./encryptionService');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

/**
 * GDPR Compliance Service
 * Handles data subject rights: access, portability, erasure (right to be forgotten)
 */

/**
 * Export all personal data for a user/employee (Right to Access & Data Portability)
 */
async function exportPersonalData(employeeId, userId = null) {
  try {
    const employee = await Employee.findByPk(employeeId, {
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'email', 'roleId', 'isActive', 'lastLogin'] }
      ]
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Collect all personal data
    const personalData = {
      employee: {
        basicInfo: {
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          dateOfBirth: employee.dateOfBirth,
          gender: employee.gender,
          maritalStatus: employee.maritalStatus
        },
        address: {
          currentAddress: employee.currentAddress,
          permanentAddress: employee.permanentAddress,
          city: employee.city,
          state: employee.state,
          pincode: employee.pincode,
          country: employee.country
        },
        identification: {
          pan: employee.pan ? encryptionService.mask(employee.pan) : null,
          aadhaar: employee.aadhaar ? encryptionService.mask(employee.aadhaar) : null,
          passport: employee.passport,
          uan: employee.uan
        },
        employment: {
          dateOfJoining: employee.dateOfJoining,
          designation: employee.designation,
          department: employee.department,
          branch: employee.branch,
          employmentType: employee.employmentType,
          status: employee.status
        },
        bankDetails: {
          bankName: employee.bankName,
          accountNumber: employee.accountNumber ? encryptionService.mask(employee.accountNumber) : null,
          ifscCode: employee.ifscCode,
          accountHolderName: employee.accountHolderName
        }
      },
      payslips: [],
      attendance: [],
      leaves: [],
      loans: [],
      reimbursements: []
    };

    // Get payslips
    const payslips = await Payslip.findAll({
      where: { employeeId },
      order: [['payrollMonth', 'DESC']],
      limit: 100 // Last 100 payslips
    });
    personalData.payslips = payslips.map(p => ({
      month: p.payrollMonth,
      year: p.payrollYear,
      grossSalary: p.grossSalary,
      netSalary: p.netSalary,
      deductions: p.deductions,
      earnings: p.earnings
    }));

    // Get attendance (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const attendance = await Attendance.findAll({
      where: {
        employeeId,
        date: { [Op.gte]: twelveMonthsAgo }
      },
      order: [['date', 'DESC']]
    });
    personalData.attendance = attendance.map(a => ({
      date: a.date,
      status: a.status,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      hoursWorked: a.hoursWorked
    }));

    // Get leaves
    const leaves = await Leave.findAll({
      where: { employeeId },
      order: [['startDate', 'DESC']]
    });
    personalData.leaves = leaves.map(l => ({
      type: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      days: l.days,
      status: l.status,
      reason: l.reason
    }));

    // Get loans
    const loans = await Loan.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']]
    });
    personalData.loans = loans.map(l => ({
      loanType: l.loanType,
      amount: l.amount,
      emiAmount: l.emiAmount,
      outstandingAmount: l.outstandingAmount,
      status: l.status,
      startDate: l.startDate
    }));

    // Get reimbursements
    const reimbursements = await Reimbursement.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']]
    });
    personalData.reimbursements = reimbursements.map(r => ({
      category: r.category,
      amount: r.amount,
      status: r.status,
      submittedDate: r.submittedDate,
      approvedDate: r.approvedDate
    }));

    // Log the export
    await createAuditLog({
      userId: userId || employee.user?.id,
      companyId: employee.companyId,
      module: 'gdpr',
      action: 'export',
      entityType: 'Employee',
      entityId: employeeId,
      description: `Personal data export requested for ${employee.employeeCode}`
    });

    return personalData;
  } catch (error) {
    logger.error('GDPR export error:', error);
    throw error;
  }
}

/**
 * Export personal data as JSON file
 */
async function exportPersonalDataAsFile(employeeId, userId = null) {
  try {
    const data = await exportPersonalData(employeeId, userId);
    const employee = await Employee.findByPk(employeeId);
    
    const exportDir = path.join(__dirname, '../../exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    const filename = `personal_data_${employee.employeeCode}_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    return { filepath, filename };
  } catch (error) {
    logger.error('GDPR export file error:', error);
    throw error;
  }
}

/**
 * Anonymize/Delete personal data (Right to be Forgotten)
 * Note: Some data may need to be retained for legal/compliance reasons
 */
async function anonymizePersonalData(employeeId, userId, reason = 'GDPR Right to be Forgotten') {
  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Anonymize employee data
    await employee.update({
      firstName: 'ANONYMIZED',
      lastName: 'USER',
      email: `anonymized_${employee.id}@deleted.local`,
      phone: null,
      pan: null,
      aadhaar: null,
      passport: null,
      currentAddress: null,
      permanentAddress: null,
      city: null,
      state: null,
      pincode: null,
      bankAccountNumber: null,
      ifscCode: null,
      isAnonymized: true,
      anonymizedAt: new Date(),
      anonymizedBy: userId,
      anonymizationReason: reason
    });

    // Anonymize user account if exists
    if (employee.userId) {
      const user = await User.findByPk(employee.userId);
      if (user) {
        await user.update({
          email: `anonymized_${user.id}@deleted.local`,
          isActive: false,
          isAnonymized: true
        });
      }
    }

    // Log the anonymization
    await createAuditLog({
      userId,
      companyId: employee.companyId,
      module: 'gdpr',
      action: 'delete',
      entityType: 'Employee',
      entityId: employeeId,
      description: `Personal data anonymized for ${employee.employeeCode}. Reason: ${reason}`
    });

    return { success: true, message: 'Personal data anonymized successfully' };
  } catch (error) {
    logger.error('GDPR anonymization error:', error);
    throw error;
  }
}

/**
 * Check if data can be deleted (legal retention requirements)
 */
async function canDeleteData(employeeId) {
  try {
    // Check if employee has active payroll or pending financial transactions
    const activePayroll = await Payslip.findOne({
      where: {
        employeeId,
        payrollYear: new Date().getFullYear()
      }
    });

    if (activePayroll) {
      return {
        canDelete: false,
        reason: 'Employee has active payroll records for current year. Data must be retained for tax/compliance purposes.'
      };
    }

    // Check for pending loans
    const pendingLoan = await Loan.findOne({
      where: {
        employeeId,
        status: { [Op.in]: ['pending', 'approved', 'active'] }
      }
    });

    if (pendingLoan) {
      return {
        canDelete: false,
        reason: 'Employee has pending or active loans. Data must be retained until loan closure.'
      };
    }

    return { canDelete: true };
  } catch (error) {
    logger.error('GDPR can delete check error:', error);
    throw error;
  }
}

module.exports = {
  exportPersonalData,
  exportPersonalDataAsFile,
  anonymizePersonalData,
  canDeleteData
};



