const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const City = sequelize.define('City', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'countries', key: 'id' }
  },
  stateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'states', key: 'id' }
  },
  cityCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cityPopulation: {
    type: DataTypes.ENUM('above_25_lacs', 'below_25_lacs'),
    defaultValue: 'below_25_lacs'
  },
  metroNonMetro: {
    type: DataTypes.ENUM('metro', 'non_metro'),
    defaultValue: 'non_metro'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'cities',
  indexes: [
    { fields: ['country_id', 'state_id', 'city_code'], unique: true }
  ]
});

module.exports = City;


