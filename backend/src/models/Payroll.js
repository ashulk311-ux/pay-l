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
    references: { model: 'Companies', key: 'id' }
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
    references: { model: 'Users', key: 'id' }
  },
  processedAt: {
    type: DataTypes.DATE
  },
  finalizedBy: {
    type: DataTypes.UUID,
    references: { model: 'Users', key: 'id' }
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
  }
}, {
  tableName: 'payrolls',
  indexes: [
    { fields: ['companyId', 'month', 'year'], unique: true }
  ]
});

module.exports = Payroll;

