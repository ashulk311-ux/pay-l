const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HolidayCalendar = sequelize.define('HolidayCalendar', {
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
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  isNational: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  applicableStates: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  applicableBranches: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  matrixHolidayId: {
    type: DataTypes.STRING
  },
  lastSyncedWithMatrix: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'holiday_calendars',
  indexes: [
    { fields: ['company_id', 'year', 'date'] },
    { fields: ['company_id'] },
    { fields: ['year'] }
  ]
});

module.exports = HolidayCalendar;



