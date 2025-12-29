const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  companyId: {
    type: DataTypes.UUID,
    references: { model: 'companies', key: 'id' }
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'view', 'export'),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.UUID
  },
  oldValues: {
    type: DataTypes.JSON
  },
  newValues: {
    type: DataTypes.JSON
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.TEXT
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'audit_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['company_id'] },
    { fields: ['module'] },
    { fields: ['created_at'] }
  ]
});

module.exports = AuditLog;

