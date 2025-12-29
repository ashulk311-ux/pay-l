const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabourWelfareFundSlab = sequelize.define('LabourWelfareFundSlab', {
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
  // Employee contribution monthly amounts (Apr-Mar)
  employeeMonthlyAmounts: {
    type: DataTypes.JSON,
    defaultValue: {
      apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
      oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
    }
  },
  // Employer contribution monthly amounts (Apr-Mar)
  employerMonthlyAmounts: {
    type: DataTypes.JSON,
    defaultValue: {
      apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
      oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
    }
  },
  deductionBasis: {
    type: DataTypes.ENUM('rate', 'fixed'),
    defaultValue: 'fixed'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'labour_welfare_fund_slabs',
  indexes: [
    { fields: ['company_id', 'state'] }
  ]
});

module.exports = LabourWelfareFundSlab;


