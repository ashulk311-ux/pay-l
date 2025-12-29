const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CostCenter = sequelize.define('CostCenter', {
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
  tableName: 'cost_centers',
  indexes: [
    { fields: ['company_id', 'code'], unique: true }
  ]
});

module.exports = CostCenter;


