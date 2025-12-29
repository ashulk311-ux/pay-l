const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReimbursementCategory = sequelize.define('ReimbursementCategory', {
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
  isTaxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requiresDocument: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'reimbursement_categories',
  indexes: [
    { fields: ['company_id', 'code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = ReimbursementCategory;



