const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeeOnboarding = sequelize.define('EmployeeOnboarding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'employees', key: 'id' },
    unique: true
  },
  inviteToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  inviteSentAt: {
    type: DataTypes.DATE
  },
  inviteExpiresAt: {
    type: DataTypes.DATE
  },
  inviteAcceptedAt: {
    type: DataTypes.DATE
  },
  currentStep: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedSteps: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  personalInfoCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  employmentDetailsCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  documentsCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bankDetailsCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  statutoryCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  extraFieldsCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  digitalSignature: {
    type: DataTypes.TEXT
  },
  signatureDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('invited', 'in_progress', 'completed', 'expired'),
    defaultValue: 'invited'
  },
  completedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'employee_onboardings',
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['invite_token'] }
  ]
});

module.exports = EmployeeOnboarding;



