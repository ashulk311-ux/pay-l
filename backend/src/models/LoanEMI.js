const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoanEMI = sequelize.define('LoanEMI', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'loans', key: 'id' }
  },
  emiNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  principalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  interestAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  paidDate: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'partial', 'overdue', 'waived'),
    defaultValue: 'pending'
  },
  payrollId: {
    type: DataTypes.UUID,
    references: { model: 'payrolls', key: 'id' }
  },
  payslipId: {
    type: DataTypes.UUID,
    references: { model: 'payslips', key: 'id' }
  },
  isAutoDeducted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  remarks: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'loan_emis',
  indexes: [
    { fields: ['loan_id', 'emi_number'], unique: true },
    { fields: ['loan_id'] },
    { fields: ['due_date'] },
    { fields: ['status'] }
  ]
});

module.exports = LoanEMI;



