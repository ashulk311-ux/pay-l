const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalaryStructure = sequelize.define('SalaryStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'employees', key: 'id' }
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  basicSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  hra: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  specialAllowance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  otherAllowances: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  fixedHeads: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  variableHeads: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  deductions: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  salaryHeads: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  netSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'salary_structures'
});

module.exports = SalaryStructure;

