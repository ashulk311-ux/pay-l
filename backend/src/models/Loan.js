const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
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
  loanType: {
    type: DataTypes.ENUM('loan', 'advance'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  tenure: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  emiAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'active', 'closed'),
    defaultValue: 'pending'
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: { model: 'Users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  autoDeduct: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  outstandingAmount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  }
}, {
  tableName: 'loans'
});

module.exports = Loan;

