const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalaryHeadMapping = sequelize.define('SalaryHeadMapping', {
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
  salaryHeadCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  salaryHeadName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('earning', 'deduction', 'statutory'),
    allowNull: false
  },
  statutoryType: {
    type: DataTypes.ENUM('PF', 'ESI', 'PT', 'LWF', 'TDS', 'NONE'),
    defaultValue: 'NONE'
  },
  isTaxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPartOfGross: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPartOfBasic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'salary_head_mappings',
  indexes: [
    { fields: ['company_id', 'salary_head_code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = SalaryHeadMapping;



