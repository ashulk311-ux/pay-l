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
const Branch = require('./Branch');
const Department = require('./Department');
const Designation = require('./Designation');
const Region = require('./Region');
const EmailTemplate = require('./EmailTemplate');
const NewsPolicy = require('./NewsPolicy');
const SalaryHeadMapping = require('./SalaryHeadMapping');
const Form16 = require('./Form16');
const EmployeeDocument = require('./EmployeeDocument');
const EmployeeOnboarding = require('./EmployeeOnboarding');
const DynamicField = require('./DynamicField');
const ITDeclaration = require('./ITDeclaration');
const ITDeclarationSection = require('./ITDeclarationSection');
const ITDeclarationDocument = require('./ITDeclarationDocument');
const LeaveType = require('./LeaveType');
const LeaveBalance = require('./LeaveBalance');
const HolidayCalendar = require('./HolidayCalendar');
const LeaveEncashment = require('./LeaveEncashment');
const LoanEMI = require('./LoanEMI');
const ReimbursementCategory = require('./ReimbursementCategory');
const ReimbursementPolicy = require('./ReimbursementPolicy');
const ReimbursementWorkflow = require('./ReimbursementWorkflow');
const ReimbursementWorkflowConfig = require('./ReimbursementWorkflowConfig');
const FullAndFinalSettlement = require('./FullAndFinalSettlement');
const IncrementWorkflow = require('./IncrementWorkflow');
const IncrementPolicy = require('./IncrementPolicy');
const PayrollPreCheck = require('./PayrollPreCheck');
const EmployeeHistory = require('./EmployeeHistory');
const CustomReport = require('./CustomReport');
const BiometricDevice = require('./BiometricDevice');
const BiometricDeviceLog = require('./BiometricDeviceLog');
const EmployeeBiometric = require('./EmployeeBiometric');
const OfficeLocation = require('./OfficeLocation');
const IncomeTaxSlab = require('./IncomeTaxSlab');
const ProfessionalTaxSlab = require('./ProfessionalTaxSlab');
const LabourWelfareFundSlab = require('./LabourWelfareFundSlab');
const PFGroup = require('./PFGroup');
const ESIGroup = require('./ESIGroup');
const PTGroup = require('./PTGroup');
const TDSDeductor = require('./TDSDeductor');
const CostCenter = require('./CostCenter');
const Unit = require('./Unit');
const Grade = require('./Grade');
const Level = require('./Level');
const SubDepartment = require('./SubDepartment');
const Country = require('./Country');
const State = require('./State');
const City = require('./City');
const StatutoryLocationMapping = require('./StatutoryLocationMapping');

// Define associations
const defineAssociations = () => {
  // User associations
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
  Role.belongsToMany(Permission, { through: 'RolePermissions', as: 'permissions' });
  Permission.belongsToMany(Role, { through: 'RolePermissions', as: 'roles' });

  // Company associations
  Company.hasMany(License, { foreignKey: 'companyId', as: 'licenses' });
  Company.hasMany(GlobalPolicy, { foreignKey: 'companyId', as: 'policies' });
  Company.hasMany(Employee, { foreignKey: 'companyId', as: 'employees' });
  Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
  Company.hasMany(StatutoryConfig, { foreignKey: 'companyId', as: 'statutoryConfigs' });
  StatutoryConfig.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Company.hasMany(Branch, { foreignKey: 'companyId', as: 'branches' });
  Company.hasMany(Department, { foreignKey: 'companyId', as: 'departments' });
  Company.hasMany(Designation, { foreignKey: 'companyId', as: 'designations' });
  Company.hasMany(Region, { foreignKey: 'companyId', as: 'regions' });
  Company.hasMany(EmailTemplate, { foreignKey: 'companyId', as: 'emailTemplates' });
  Company.hasMany(NewsPolicy, { foreignKey: 'companyId', as: 'newsPolicies' });
  Company.hasMany(SalaryHeadMapping, { foreignKey: 'companyId', as: 'salaryHeadMappings' });
  Company.hasMany(DynamicField, { foreignKey: 'companyId', as: 'dynamicFields' });
  Company.hasMany(ITDeclarationSection, { foreignKey: 'companyId', as: 'itDeclarationSections' });
  Company.hasMany(LeaveType, { foreignKey: 'companyId', as: 'leaveTypes' });
  Company.hasMany(HolidayCalendar, { foreignKey: 'companyId', as: 'holidays' });
  Company.hasMany(LeaveEncashment, { foreignKey: 'companyId', as: 'leaveEncashments' });
  Company.hasMany(ReimbursementCategory, { foreignKey: 'companyId', as: 'reimbursementCategories' });
  Company.hasMany(ReimbursementPolicy, { foreignKey: 'companyId', as: 'reimbursementPolicies' });
  Company.hasMany(ReimbursementWorkflowConfig, { foreignKey: 'companyId', as: 'reimbursementWorkflowConfigs' });
  Company.hasMany(IncrementPolicy, { foreignKey: 'companyId', as: 'incrementPolicies' });
  Company.hasMany(IncomeTaxSlab, { foreignKey: 'companyId', as: 'incomeTaxSlabs' });
  Company.hasMany(ProfessionalTaxSlab, { foreignKey: 'companyId', as: 'professionalTaxSlabs' });
  Company.hasMany(LabourWelfareFundSlab, { foreignKey: 'companyId', as: 'labourWelfareFundSlabs' });
  Company.hasMany(PFGroup, { foreignKey: 'companyId', as: 'pfGroups' });
  Company.hasMany(ESIGroup, { foreignKey: 'companyId', as: 'esiGroups' });
  Company.hasMany(PTGroup, { foreignKey: 'companyId', as: 'ptGroups' });
  Company.hasMany(TDSDeductor, { foreignKey: 'companyId', as: 'tdsDeductors' });
  Company.hasMany(CostCenter, { foreignKey: 'companyId', as: 'costCenters' });
  Company.hasMany(Unit, { foreignKey: 'companyId', as: 'units' });
  Company.hasMany(Grade, { foreignKey: 'companyId', as: 'grades' });
  Company.hasMany(Level, { foreignKey: 'companyId', as: 'levels' });
  Company.hasMany(SubDepartment, { foreignKey: 'companyId', as: 'subDepartments' });
  Company.hasMany(StatutoryLocationMapping, { foreignKey: 'companyId', as: 'statutoryLocationMappings' });
  
  // User-Company association
  User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Employee associations
  Employee.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Employee.belongsTo(Branch, { foreignKey: 'branchId', as: 'branchRef' });
  Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });
  Employee.belongsTo(Designation, { foreignKey: 'designationId', as: 'designationRef' });
  Employee.belongsTo(Region, { foreignKey: 'regionId', as: 'regionRef' });
  Employee.belongsTo(CostCenter, { foreignKey: 'costCenterId', as: 'costCenterRef' });
  Employee.belongsTo(Unit, { foreignKey: 'unitId', as: 'unitRef' });
  Employee.belongsTo(Grade, { foreignKey: 'gradeId', as: 'gradeRef' });
  Employee.belongsTo(Level, { foreignKey: 'levelId', as: 'levelRef' });
  Employee.belongsTo(SubDepartment, { foreignKey: 'subDepartmentId', as: 'subDepartmentRef' });
  Employee.hasOne(SalaryStructure, { foreignKey: 'employeeId', as: 'salaryStructure' });
  Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
  Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
  
  // Branch, Department, Designation, Region associations
  Branch.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Department.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Department.belongsTo(Employee, { foreignKey: 'headEmployeeId', as: 'head' });
  Department.hasMany(SubDepartment, { foreignKey: 'departmentId', as: 'subDepartments' });
  SubDepartment.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  SubDepartment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Designation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Region.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  CostCenter.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Unit.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Unit.belongsTo(OfficeLocation, { foreignKey: 'locationId', as: 'location' });
  Grade.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Level.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // Region Master associations (Country, State, City)
  Country.hasMany(State, { foreignKey: 'countryId', as: 'states' });
  State.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
  State.hasMany(City, { foreignKey: 'stateId', as: 'cities' });
  City.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
  City.belongsTo(State, { foreignKey: 'stateId', as: 'state' });
  
  // Statutory associations
  IncomeTaxSlab.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  ProfessionalTaxSlab.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  LabourWelfareFundSlab.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  PFGroup.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  ESIGroup.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  PTGroup.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  TDSDeductor.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  StatutoryLocationMapping.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // EmailTemplate and NewsPolicy associations
  EmailTemplate.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  NewsPolicy.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // Attendance associations
  Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  
  // Leave associations
  Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(Loan, { foreignKey: 'employeeId', as: 'loans' });
  Loan.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Loan.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
  Loan.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
  Loan.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejector' });
  Loan.hasMany(LoanEMI, { foreignKey: 'loanId', as: 'emis' });
  Employee.hasMany(Reimbursement, { foreignKey: 'employeeId', as: 'reimbursements' });
  Reimbursement.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Reimbursement.belongsTo(ReimbursementCategory, { foreignKey: 'categoryId', as: 'categoryRef' });
  Reimbursement.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejector' });
  Reimbursement.hasMany(ReimbursementWorkflow, { foreignKey: 'reimbursementId', as: 'workflows' });
  Employee.hasMany(SupplementarySalary, { foreignKey: 'employeeId', as: 'supplementarySalaries' });
  SupplementarySalary.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasMany(FullAndFinalSettlement, { foreignKey: 'employeeId', as: 'fullAndFinalSettlements' });
  FullAndFinalSettlement.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  FullAndFinalSettlement.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
  Employee.hasMany(SalaryIncrement, { foreignKey: 'employeeId', as: 'increments' });
  SalaryIncrement.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  SalaryIncrement.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejector' });
  SalaryIncrement.hasMany(IncrementWorkflow, { foreignKey: 'incrementId', as: 'workflows' });
  SalaryIncrement.belongsTo(IncrementPolicy, { foreignKey: 'policyId', as: 'policy' });
  Payroll.hasMany(PayrollPreCheck, { foreignKey: 'payrollId', as: 'preChecks' });
  PayrollPreCheck.belongsTo(Payroll, { foreignKey: 'payrollId', as: 'payroll' });
  PayrollPreCheck.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  PayrollPreCheck.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });
  Employee.hasMany(EmployeeHistory, { foreignKey: 'employeeId', as: 'history' });
  EmployeeHistory.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  EmployeeHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'changer' });
  Company.hasMany(CustomReport, { foreignKey: 'companyId', as: 'customReports' });
  CustomReport.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  CustomReport.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Company.hasMany(BiometricDevice, { foreignKey: 'companyId', as: 'biometricDevices' });
  BiometricDevice.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  BiometricDevice.belongsTo(require('./Branch'), { foreignKey: 'branchId', as: 'branch' });
  BiometricDevice.hasMany(BiometricDeviceLog, { foreignKey: 'deviceId', as: 'logs' });
  BiometricDeviceLog.belongsTo(BiometricDevice, { foreignKey: 'deviceId', as: 'device' });
  Employee.hasMany(EmployeeBiometric, { foreignKey: 'employeeId', as: 'biometricMappings' });
  EmployeeBiometric.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  EmployeeBiometric.belongsTo(BiometricDevice, { foreignKey: 'deviceId', as: 'device' });
  EmployeeBiometric.belongsTo(User, { foreignKey: 'enrolledBy', as: 'enroller' });
  Attendance.belongsTo(BiometricDevice, { foreignKey: 'biometricDeviceId', as: 'biometricDevice' });
  Attendance.belongsTo(OfficeLocation, { foreignKey: 'officeLocationId', as: 'officeLocation' });
  Company.hasMany(OfficeLocation, { foreignKey: 'companyId', as: 'officeLocations' });
  OfficeLocation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  OfficeLocation.belongsTo(require('./Branch'), { foreignKey: 'branchId', as: 'branch' });
  Employee.hasMany(Payslip, { foreignKey: 'employeeId', as: 'payslips' });
  Employee.hasMany(Form16, { foreignKey: 'employeeId', as: 'form16s' });
  Employee.hasMany(EmployeeDocument, { foreignKey: 'employeeId', as: 'employeeDocuments' });
  Employee.hasOne(EmployeeOnboarding, { foreignKey: 'employeeId', as: 'onboarding' });
  Employee.belongsTo(User, { foreignKey: 'kycVerifiedBy', as: 'kycVerifier' });
  Employee.hasMany(ITDeclaration, { foreignKey: 'employeeId', as: 'itDeclarations' });
  Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances' });

  // Payroll associations
  Payroll.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Payroll.hasMany(Payslip, { foreignKey: 'payrollId', as: 'payslips' });

  // Payslip associations
  Payslip.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Payslip.belongsTo(Payroll, { foreignKey: 'payrollId', as: 'payroll' });
  
  // Form16 associations
  Form16.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Form16.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Form16.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });
  
  // SalaryHeadMapping associations
  SalaryHeadMapping.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // EmployeeDocument associations
  EmployeeDocument.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  EmployeeDocument.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
  
  // EmployeeOnboarding associations
  EmployeeOnboarding.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  
  // DynamicField associations
  DynamicField.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // ITDeclaration associations
  ITDeclaration.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  ITDeclaration.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
  ITDeclaration.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
  ITDeclaration.hasMany(ITDeclarationDocument, { foreignKey: 'itDeclarationId', as: 'documents' });
  
  // ITDeclarationSection associations
  ITDeclarationSection.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // ITDeclarationDocument associations
  ITDeclarationDocument.belongsTo(ITDeclaration, { foreignKey: 'itDeclarationId', as: 'itDeclaration' });
  ITDeclarationDocument.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
  
  // LeaveType associations
  LeaveType.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  LeaveType.hasMany(LeaveBalance, { foreignKey: 'leaveTypeId', as: 'leaveBalances' });
  LeaveType.hasOne(LeaveEncashment, { foreignKey: 'leaveTypeId', as: 'encashment' });
  
  // LeaveBalance associations
  LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });
  
  // HolidayCalendar associations
  HolidayCalendar.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  
  // LeaveEncashment associations
  LeaveEncashment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  LeaveEncashment.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });
  
  // LoanEMI associations
  LoanEMI.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });
  LoanEMI.belongsTo(Payroll, { foreignKey: 'payrollId', as: 'payroll' });
  LoanEMI.belongsTo(Payslip, { foreignKey: 'payslipId', as: 'payslip' });
  
  // ReimbursementCategory associations
  ReimbursementCategory.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  ReimbursementCategory.hasMany(Reimbursement, { foreignKey: 'categoryId', as: 'reimbursements' });
  ReimbursementCategory.hasMany(ReimbursementPolicy, { foreignKey: 'categoryId', as: 'policies' });
  ReimbursementCategory.hasMany(ReimbursementWorkflowConfig, { foreignKey: 'categoryId', as: 'workflowConfigs' });
  
  // ReimbursementPolicy associations
  ReimbursementPolicy.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  ReimbursementPolicy.belongsTo(ReimbursementCategory, { foreignKey: 'categoryId', as: 'categoryRef' });
  
  // ReimbursementWorkflow associations
  ReimbursementWorkflow.belongsTo(Reimbursement, { foreignKey: 'reimbursementId', as: 'reimbursement' });
  ReimbursementWorkflow.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
  
  // ReimbursementWorkflowConfig associations
  ReimbursementWorkflowConfig.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  ReimbursementWorkflowConfig.belongsTo(ReimbursementCategory, { foreignKey: 'categoryId', as: 'categoryRef' });
  ReimbursementWorkflowConfig.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  ReimbursementWorkflowConfig.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
  
  // IncrementWorkflow associations
  IncrementWorkflow.belongsTo(SalaryIncrement, { foreignKey: 'incrementId', as: 'increment' });
  IncrementWorkflow.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
  
  // IncrementPolicy associations
  IncrementPolicy.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

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
  AuditLog,
  Branch,
  Department,
  Designation,
  Region,
  EmailTemplate,
  NewsPolicy,
  SalaryHeadMapping,
  Form16,
  EmployeeDocument,
  EmployeeOnboarding,
  DynamicField,
  ITDeclaration,
  ITDeclarationSection,
  ITDeclarationDocument,
  LeaveType,
  LeaveBalance,
  HolidayCalendar,
  LeaveEncashment,
  LoanEMI,
  ReimbursementCategory,
  ReimbursementPolicy,
  ReimbursementWorkflow,
  ReimbursementWorkflowConfig,
  FullAndFinalSettlement,
  IncrementWorkflow,
  IncrementPolicy,
  PayrollPreCheck,
  EmployeeHistory,
  CustomReport,
  BiometricDevice,
  BiometricDeviceLog,
  EmployeeBiometric,
  OfficeLocation,
  IncomeTaxSlab,
  ProfessionalTaxSlab,
  LabourWelfareFundSlab,
  PFGroup,
  ESIGroup,
  PTGroup,
  TDSDeductor,
  CostCenter,
  Unit,
  Grade,
  Level,
  SubDepartment,
  Country,
  State,
  City,
  StatutoryLocationMapping
};

defineAssociations();

module.exports = models;

