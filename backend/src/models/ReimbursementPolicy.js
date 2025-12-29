const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReimbursementPolicy = sequelize.define('ReimbursementPolicy', {
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
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'reimbursement_categories', key: 'id' }
  },
  maxAmountPerRequest: {
    type: DataTypes.DECIMAL(12, 2)
  },
  maxAmountPerMonth: {
    type: DataTypes.DECIMAL(12, 2)
  },
  maxAmountPerYear: {
    type: DataTypes.DECIMAL(12, 2)
  },
  maxRequestsPerMonth: {
    type: DataTypes.INTEGER
  },
  maxRequestsPerYear: {
    type: DataTypes.INTEGER
  },
  applicableTo: {
    type: DataTypes.ENUM('all', 'department', 'designation', 'employee'),
    defaultValue: 'all'
  },
  applicableIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'reimbursement_policies',
  indexes: [
    { fields: ['company_id', 'category_id'] },
    { fields: ['company_id'] },
    { fields: ['category_id'] }
  ]
});

module.exports = ReimbursementPolicy;



