const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IncrementPolicy = sequelize.define('IncrementPolicy', {
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
  policyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicableTo: {
    type: DataTypes.ENUM('all', 'grade', 'designation', 'department'),
    allowNull: false
  },
  applicableIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  incrementType: {
    type: DataTypes.ENUM('percentage', 'fixed', 'grade_based'),
    allowNull: false
  },
  incrementValue: {
    type: DataTypes.DECIMAL(10, 2)
  },
  minIncrement: {
    type: DataTypes.DECIMAL(12, 2)
  },
  maxIncrement: {
    type: DataTypes.DECIMAL(12, 2)
  },
  effectiveDate: {
    type: DataTypes.DATEONLY
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'increment_policies',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['effective_date'] }
  ]
});

module.exports = IncrementPolicy;



