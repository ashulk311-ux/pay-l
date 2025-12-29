const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OfficeLocation = sequelize.define('OfficeLocation', {
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
  branchId: {
    type: DataTypes.UUID,
    references: { model: 'branches', key: 'id' }
  },
  locationName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    comment: 'Office location latitude'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    comment: 'Office location longitude'
  },
  allowedRadius: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100,
    comment: 'Allowed radius in meters for GPS attendance'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Default location for the company/branch'
  },
  workingHours: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Working hours configuration (e.g., { start: "09:00", end: "18:00" })'
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'Asia/Kolkata'
  }
}, {
  tableName: 'office_locations',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['branch_id'] },
    { fields: ['is_active'] }
  ]
});

module.exports = OfficeLocation;



