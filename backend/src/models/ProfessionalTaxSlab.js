const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProfessionalTaxSlab = sequelize.define('ProfessionalTaxSlab', {
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
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  personType: {
    type: DataTypes.ENUM('all', 'male', 'female', 'senior_citizen'),
    allowNull: false,
    defaultValue: 'all'
  },
  minimumLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  maximumLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  startFinancialYear: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endFinancialYear: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Monthly amounts (Apr-Mar)
  monthlyAmounts: {
    type: DataTypes.JSON,
    defaultValue: {
      apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
      oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
    }
  },
  seniorCitizenAge: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'professional_tax_slabs',
  indexes: [
    { fields: ['company_id', 'state', 'person_type'] },
    { fields: ['company_id', 'start_financial_year', 'end_financial_year'] }
  ]
});

module.exports = ProfessionalTaxSlab;


