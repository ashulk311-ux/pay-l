const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Unit = sequelize.define('Unit', {
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
  locationId: {
    type: DataTypes.UUID,
    references: { model: 'office_locations', key: 'id' }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'units',
  indexes: [
    { fields: ['company_id', 'code'], unique: true },
    { fields: ['location_id'] }
  ]
});

module.exports = Unit;


