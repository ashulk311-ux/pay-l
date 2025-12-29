const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeaveType = sequelize.define('LeaveType', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shortName: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  maxDaysPerYear: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxDaysPerRequest: {
    type: DataTypes.INTEGER
  },
  carryForward: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxCarryForwardDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiresDocument: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matrixLeaveTypeId: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'leave_types',
  indexes: [
    { fields: ['company_id', 'code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = LeaveType;



