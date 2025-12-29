const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ITDeclaration = sequelize.define('ITDeclaration', {
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
  financialYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  assessmentYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Section-wise declarations
  section80C: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80CDetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  section80D: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80DDetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  section80G: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80GDetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  section80TTA: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80TTADetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  section24B: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section24BDetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  section80EE: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  section80EEDetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  otherSections: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  totalDeclaredAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected'),
    defaultValue: 'draft'
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  reviewedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  reviewedAt: {
    type: DataTypes.DATE
  },
  reviewRemarks: {
    type: DataTypes.TEXT
  },
  approvedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  approvalRemarks: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'it_declarations',
  indexes: [
    { fields: ['employee_id', 'financial_year'], unique: true },
    { fields: ['employee_id'] },
    { fields: ['status'] }
  ]
});

module.exports = ITDeclaration;



