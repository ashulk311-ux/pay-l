const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomReport = sequelize.define('CustomReport', {
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
  reportName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  dataSource: {
    type: DataTypes.ENUM('payroll', 'employee', 'attendance', 'leave', 'loan', 'reimbursement', 'statutory'),
    allowNull: false
  },
  filters: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  columns: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  grouping: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  sorting: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  aggregations: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  format: {
    type: DataTypes.ENUM('json', 'excel', 'pdf', 'csv'),
    defaultValue: 'excel'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'custom_reports',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['data_source'] }
  ]
});

module.exports = CustomReport;



