const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
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
  leaveTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'leave_types', key: 'id' }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  openingBalance: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  allocated: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  used: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  balance: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  carryForward: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  isEditable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncedWithMatrix: {
    type: DataTypes.DATE
  },
  matrixBalance: {
    type: DataTypes.DECIMAL(5, 2)
  }
}, {
  tableName: 'leave_balances',
  indexes: [
    { fields: ['employee_id', 'leave_type_id', 'year'], unique: true },
    { fields: ['employee_id'] },
    { fields: ['year'] }
  ]
});

module.exports = LeaveBalance;



