const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BiometricDeviceLog = sequelize.define('BiometricDeviceLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'biometric_devices', key: 'id' }
  },
  logType: {
    type: DataTypes.ENUM('sync', 'attendance', 'error', 'heartbeat', 'config', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'pending'
  },
  recordsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  startTime: {
    type: DataTypes.DATE
  },
  endTime: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: 'Duration in milliseconds'
  },
  errorMessage: {
    type: DataTypes.TEXT
  },
  requestData: {
    type: DataTypes.JSON
  },
  responseData: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'biometric_device_logs',
  indexes: [
    { fields: ['device_id'] },
    { fields: ['log_type'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = BiometricDeviceLog;



