const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalaryIncrement = sequelize.define('SalaryIncrement', {
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
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  previousSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  newSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  incrementAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  incrementPercentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  reason: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: { model: 'Users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  isApplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'salary_increments'
});

module.exports = SalaryIncrement;

