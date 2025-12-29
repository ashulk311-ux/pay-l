const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BiometricDevice = sequelize.define('BiometricDevice', {
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
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceSerialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deviceType: {
    type: DataTypes.ENUM('fingerprint', 'face', 'iris', 'palm', 'rfid', 'card', 'other'),
    allowNull: false
  },
  deviceModel: {
    type: DataTypes.STRING
  },
  deviceManufacturer: {
    type: DataTypes.STRING
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 80
  },
  location: {
    type: DataTypes.STRING
  },
  branchId: {
    type: DataTypes.UUID,
    references: { model: 'branches', key: 'id' }
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  apiSecret: {
    type: DataTypes.STRING,
    allowNull: false
  },
  syncMode: {
    type: DataTypes.ENUM('push', 'pull', 'both'),
    defaultValue: 'push'
  },
  syncInterval: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'Sync interval in minutes'
  },
  lastSyncAt: {
    type: DataTypes.DATE
  },
  lastSyncStatus: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'pending'
  },
  lastSyncError: {
    type: DataTypes.TEXT
  },
  totalRecordsSynced: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastHeartbeat: {
    type: DataTypes.DATE
  },
  configuration: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'biometric_devices',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['device_serial_number'], unique: true },
    { fields: ['api_key'], unique: true },
    { fields: ['is_active'] }
  ]
});

module.exports = BiometricDevice;



