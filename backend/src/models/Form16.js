const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Form16 = sequelize.define('Form16', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'companies', key: 'id' }
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'employees', key: 'id' }
  },
  financialYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pan: {
    type: DataTypes.STRING
  },
  assessmentYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Part A - Employer Details
  employerName: {
    type: DataTypes.STRING
  },
  employerAddress: {
    type: DataTypes.TEXT
  },
  employerTAN: {
    type: DataTypes.STRING
  },
  employerPAN: {
    type: DataTypes.STRING
  },
  // Part B - Salary Details
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  allowances: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  perquisites: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  profitsInLieOfSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  // Deductions
  standardDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80C: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80D: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80G: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80TTA: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  otherDeductions: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  taxableIncome: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  // Tax Calculation
  taxOnTotalIncome: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  rebate: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  surcharge: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  cess: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalTaxLiability: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  tdsDeducted: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  taxPayable: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  // TDS Details
  tdsDetails: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Status
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'approved', 'issued'),
    defaultValue: 'draft'
  },
  generatedAt: {
    type: DataTypes.DATE
  },
  generatedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  pdfPath: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'form16s',
  indexes: [
    { fields: ['company_id', 'employee_id', 'financial_year'], unique: true },
    { fields: ['company_id'] },
    { fields: ['employee_id'] }
  ]
});

module.exports = Form16;



