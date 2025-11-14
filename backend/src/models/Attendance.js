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
    references: { model: 'Employees', key: 'id' }
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
    references: { model: 'Users', key: 'id' }
  }
}, {
  tableName: 'attendances',
  indexes: [
    { fields: ['employeeId', 'date'], unique: true }
  ]
});

module.exports = Attendance;

