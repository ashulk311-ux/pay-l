const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define('Payroll', {
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
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'processing', 'locked', 'finalized', 'paid'),
    defaultValue: 'draft'
  },
  attendanceLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  processedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  processedAt: {
    type: DataTypes.DATE
  },
  finalizedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  finalizedAt: {
    type: DataTypes.DATE
  },
  totalEmployees: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalGrossSalary: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  totalNetSalary: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  preCheckCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preCheckCompletedAt: {
    type: DataTypes.DATE
  },
  preCheckCompletedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  earningsApplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deductionsApplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  payslipsGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  payslipsDistributed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'payrolls',
  indexes: [
    { fields: ['company_id', 'month', 'year'], unique: true }
  ]
});

module.exports = Payroll;

