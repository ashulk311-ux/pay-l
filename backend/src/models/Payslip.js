const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  payrollId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Payrolls', key: 'id' }
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Employees', key: 'id' }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  earnings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  deductions: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  netSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  daysWorked: {
    type: DataTypes.DECIMAL(5, 2)
  },
  daysPresent: {
    type: DataTypes.INTEGER
  },
  daysAbsent: {
    type: DataTypes.INTEGER
  },
  pdfPath: {
    type: DataTypes.STRING
  },
  isDistributed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  distributedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'payslips'
});

module.exports = Payslip;

