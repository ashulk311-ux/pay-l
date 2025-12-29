const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeeBiometric = sequelize.define('EmployeeBiometric', {
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
  deviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'biometric_devices', key: 'id' }
  },
  biometricId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Employee ID in the biometric device'
  },
  biometricType: {
    type: DataTypes.ENUM('fingerprint', 'face', 'iris', 'palm', 'rfid', 'card'),
    allowNull: false
  },
  templateData: {
    type: DataTypes.TEXT,
    comment: 'Biometric template data (encrypted)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  enrolledAt: {
    type: DataTypes.DATE
  },
  enrolledBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'employee_biometrics',
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['device_id'] },
    { fields: ['biometric_id', 'device_id'], unique: true }
  ]
});

module.exports = EmployeeBiometric;



