const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IncomeTaxSlab = sequelize.define('IncomeTaxSlab', {
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
  taxRegime: {
    type: DataTypes.ENUM('old', 'new'),
    allowNull: false
  },
  slabType: {
    type: DataTypes.ENUM('individual', 'female', 'senior_citizen', 'super_senior_citizen'),
    allowNull: false,
    defaultValue: 'individual'
  },
  serialNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lowerLimit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  upperLimit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  taxPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  },
  startFinancialYear: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endFinancialYear: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'income_tax_slabs',
  indexes: [
    { fields: ['company_id', 'tax_regime', 'slab_type', 'serial_number'] },
    { fields: ['company_id', 'start_financial_year', 'end_financial_year'] }
  ]
});

module.exports = IncomeTaxSlab;



