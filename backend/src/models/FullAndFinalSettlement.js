const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FullAndFinalSettlement = sequelize.define('FullAndFinalSettlement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'employees', key: 'id' }
  },
  settlementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  lastWorkingDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  noticePeriodDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  noticePeriodAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  earnedLeaves: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  earnedLeaveAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  unpaidLeaves: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  unpaidLeaveDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  outstandingLoans: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  outstandingAdvances: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  pendingReimbursements: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  gratuity: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  bonus: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  otherDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  otherPayments: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  grossAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  netAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'approved', 'paid', 'cancelled'),
    defaultValue: 'draft'
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  paidAt: {
    type: DataTypes.DATE
  },
  remarks: {
    type: DataTypes.TEXT
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'full_and_final_settlements',
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['settlement_date'] },
    { fields: ['status'] }
  ]
});

module.exports = FullAndFinalSettlement;



