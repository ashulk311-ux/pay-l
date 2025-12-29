const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'half-day', 'holiday', 'weekend'),
    allowNull: false
  },
  checkIn: {
    type: DataTypes.TIME
  },
  checkOut: {
    type: DataTypes.TIME
  },
  hoursWorked: {
    type: DataTypes.DECIMAL(5, 2)
  },
  remarks: {
    type: DataTypes.TEXT
  },
  isManual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  uploadedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  matrixAttendanceId: {
    type: DataTypes.STRING
  },
  lastSyncedWithMatrix: {
    type: DataTypes.DATE
  },
  biometricDeviceId: {
    type: DataTypes.UUID,
    references: { model: 'biometric_devices', key: 'id' }
  },
  biometricId: {
    type: DataTypes.STRING,
    comment: 'Employee ID from biometric device'
  },
  biometricTimestamp: {
    type: DataTypes.DATE,
    comment: 'Original timestamp from biometric device'
  },
  isBiometric: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // GPS Attendance fields
  checkInLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    comment: 'GPS latitude for check-in'
  },
  checkInLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    comment: 'GPS longitude for check-in'
  },
  checkInAddress: {
    type: DataTypes.TEXT,
    comment: 'Address from GPS coordinates'
  },
  checkInDistance: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Distance from office location in meters'
  },
  checkOutLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    comment: 'GPS latitude for check-out'
  },
  checkOutLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    comment: 'GPS longitude for check-out'
  },
  checkOutAddress: {
    type: DataTypes.TEXT,
    comment: 'Address from GPS coordinates'
  },
  checkOutDistance: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Distance from office location in meters'
  },
  officeLocationId: {
    type: DataTypes.UUID,
    references: { model: 'office_locations', key: 'id' },
    comment: 'Office location used for geofencing'
  },
  isGPSVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether GPS location was verified within allowed radius'
  },
  deviceInfo: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Mobile device information (OS, model, app version, etc.)'
  }
}, {
  tableName: 'attendances',
  indexes: [
    { fields: ['employee_id', 'date'], unique: true }
  ]
});

module.exports = Attendance;

