const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reimbursement = sequelize.define('Reimbursement', {
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
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
    defaultValue: 'pending'
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  isTaxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  categoryId: {
    type: DataTypes.UUID,
    references: { model: 'reimbursement_categories', key: 'id' }
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
  },
  paidAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'reimbursements'
});

module.exports = Reimbursement;

