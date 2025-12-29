const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeaveEncashment = sequelize.define('LeaveEncashment', {
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
  leaveTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'leave_types', key: 'id' }
  },
  minBalance: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  maxEncashableDays: {
    type: DataTypes.DECIMAL(5, 2)
  },
  encashmentRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100
  },
  calculationMethod: {
    type: DataTypes.ENUM('basic', 'gross', 'ctc', 'custom'),
    defaultValue: 'basic'
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rules: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'leave_encashments',
  indexes: [
    { fields: ['company_id', 'leave_type_id'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = LeaveEncashment;



