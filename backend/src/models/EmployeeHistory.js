const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeeHistory = sequelize.define('EmployeeHistory', {
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
  changeType: {
    type: DataTypes.ENUM('designation', 'department', 'salary', 'grade', 'branch', 'other'),
    allowNull: false
  },
  fieldName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  oldValue: {
    type: DataTypes.TEXT
  },
  newValue: {
    type: DataTypes.TEXT
  },
  oldValueId: {
    type: DataTypes.UUID
  },
  newValueId: {
    type: DataTypes.UUID
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  changeReason: {
    type: DataTypes.TEXT
  },
  effectiveDate: {
    type: DataTypes.DATEONLY
  }
}, {
  tableName: 'employee_history',
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['change_type'] },
    { fields: ['changed_at'] }
  ]
});

module.exports = EmployeeHistory;



