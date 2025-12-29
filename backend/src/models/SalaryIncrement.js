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
    references: { model: 'employees', key: 'id' }
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
    references: { model: 'users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  isApplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  appliedAt: {
    type: DataTypes.DATE
  },
  previousDesignationId: {
    type: DataTypes.UUID,
    references: { model: 'designations', key: 'id' }
  },
  newDesignationId: {
    type: DataTypes.UUID,
    references: { model: 'designations', key: 'id' }
  },
  previousGrade: {
    type: DataTypes.STRING
  },
  newGrade: {
    type: DataTypes.STRING
  },
  incrementType: {
    type: DataTypes.ENUM('individual', 'grade_based', 'designation_based', 'policy_based'),
    defaultValue: 'individual'
  },
  policyId: {
    type: DataTypes.UUID,
    references: { model: 'increment_policies', key: 'id' }
  },
  currentLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalLevels: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  rejectedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  rejectedAt: {
    type: DataTypes.DATE
  },
  rejectionReason: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'salary_increments'
});

module.exports = SalaryIncrement;

