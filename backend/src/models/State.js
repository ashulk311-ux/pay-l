const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const State = sequelize.define('State', {
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
  stateCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  professionalTaxApply: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'states',
  indexes: [
    { fields: ['country_id', 'state_code'], unique: true }
  ]
});

module.exports = State;


