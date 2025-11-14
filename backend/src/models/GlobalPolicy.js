const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GlobalPolicy = sequelize.define('GlobalPolicy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Companies', key: 'id' }
  },
  moduleName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'global_policies',
  indexes: [
    { fields: ['companyId', 'moduleName'], unique: true }
  ]
});

module.exports = GlobalPolicy;

