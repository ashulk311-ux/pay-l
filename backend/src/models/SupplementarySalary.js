const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupplementarySalary = sequelize.define('SupplementarySalary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Employees', key: 'id' }
  },
  type: {
    type: DataTypes.ENUM('arrears', 'incentive', 'bonus', 'full-final', 'other'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER
  },
  year: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  },
  isProcessed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  processedInPayrollId: {
    type: DataTypes.UUID,
    references: { model: 'Payrolls', key: 'id' }
  }
}, {
  tableName: 'supplementary_salaries'
});

module.exports = SupplementarySalary;

