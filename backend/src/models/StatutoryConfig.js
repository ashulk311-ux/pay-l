const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StatutoryConfig = sequelize.define('StatutoryConfig', {
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
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  statutoryType: {
    type: DataTypes.ENUM('PF', 'ESI', 'PT', 'LWF', 'TDS'),
    allowNull: false
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  configuration: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  tdsRegime: {
    type: DataTypes.ENUM('old', 'new'),
    defaultValue: 'new'
  },
  tdsSlabs: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  exemptions: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'statutory_configs',
  indexes: [
    { fields: ['companyId', 'state', 'statutoryType'], unique: true }
  ]
});

module.exports = StatutoryConfig;

