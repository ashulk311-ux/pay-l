const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PayrollPreCheck = sequelize.define('PayrollPreCheck', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  payrollId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'payrolls', key: 'id' }
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'employees', key: 'id' }
  },
  checkType: {
    type: DataTypes.ENUM('absence', 'leave', 'loan', 'advance', 'reimbursement', 'other'),
    allowNull: false
  },
  checkStatus: {
    type: DataTypes.ENUM('pending', 'warning', 'error', 'resolved', 'ignored'),
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  resolvedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  resolvedAt: {
    type: DataTypes.DATE
  },
  resolutionNotes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'payroll_pre_checks',
  indexes: [
    { fields: ['payroll_id', 'employee_id'] },
    { fields: ['check_status'] }
  ]
});

module.exports = PayrollPreCheck;



