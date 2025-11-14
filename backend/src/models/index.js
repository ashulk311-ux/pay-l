const { sequelize, Sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import all models
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Company = require('./Company');
const License = require('./License');
const GlobalPolicy = require('./GlobalPolicy');
const Employee = require('./Employee');
const SalaryStructure = require('./SalaryStructure');
const Attendance = require('./Attendance');
const Leave = require('./Leave');
const Loan = require('./Loan');
const Reimbursement = require('./Reimbursement');
const SupplementarySalary = require('./SupplementarySalary');
const SalaryIncrement = require('./SalaryIncrement');
const Payroll = require('./Payroll');
const Payslip = require('./Payslip');
const StatutoryConfig = require('./StatutoryConfig');
const AuditLog = require('./AuditLog');

// Define associations
const defineAssociations = () => {
  // User associations
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
  Role.belongsToMany(Permission, { through: 'RolePermissions', as: 'permissions' });
  Permission.belongsToMany(Role, { through: 'RolePermissions', as: 'roles' });

  // Company associations
  Company.hasMany(License, { foreignKey: 'companyId', as: 'licenses' });
  Company.hasMany(GlobalPolicy, { foreignKey: 'companyId', as: 'policies' });
  Company.hasMany(Employee, { foreignKey: 'companyId', as: 'employees' });
  Company.hasMany(StatutoryConfig, { foreignKey: 'companyId', as: 'statutoryConfigs' });

  // Employee associations
  Employee.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Employee.hasOne(SalaryStructure, { foreignKey: 'employeeId', as: 'salaryStructure' });
  Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
  Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
  
  // Attendance associations
  Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  
  // Leave associations
  Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(Loan, { foreignKey: 'employeeId', as: 'loans' });
  Loan.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(Reimbursement, { foreignKey: 'employeeId', as: 'reimbursements' });
  Reimbursement.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(SupplementarySalary, { foreignKey: 'employeeId', as: 'supplementarySalaries' });
  SupplementarySalary.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(SalaryIncrement, { foreignKey: 'employeeId', as: 'increments' });
  SalaryIncrement.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(Payslip, { foreignKey: 'employeeId', as: 'payslips' });

  // Payroll associations
  Payroll.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Payroll.hasMany(Payslip, { foreignKey: 'payrollId', as: 'payslips' });

  // Payslip associations
  Payslip.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Payslip.belongsTo(Payroll, { foreignKey: 'payrollId', as: 'payroll' });

  logger.info('Database associations defined');
};

// Initialize models
const models = {
  sequelize,
  Sequelize,
  User,
  Role,
  Permission,
  Company,
  License,
  GlobalPolicy,
  Employee,
  SalaryStructure,
  Attendance,
  Leave,
  Loan,
  Reimbursement,
  SupplementarySalary,
  SalaryIncrement,
  Payroll,
  Payslip,
  StatutoryConfig,
  AuditLog
};

defineAssociations();

module.exports = models;

