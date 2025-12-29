const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Country = sequelize.define('Country', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  countryCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  countryName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isdCode: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'countries',
  indexes: [
    { fields: ['country_code'], unique: true },
    { fields: ['country_name'], unique: true }
  ]
});

module.exports = Country;


