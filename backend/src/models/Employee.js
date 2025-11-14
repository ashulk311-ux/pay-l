const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Companies', key: 'id' }
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  dateOfBirth: {
    type: DataTypes.DATE
  },
  dateOfJoining: {
    type: DataTypes.DATE,
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING
  },
  department: {
    type: DataTypes.STRING
  },
  branch: {
    type: DataTypes.STRING
  },
  pan: {
    type: DataTypes.STRING
  },
  aadhaar: {
    type: DataTypes.STRING
  },
  uan: {
    type: DataTypes.STRING
  },
  bankAccountNumber: {
    type: DataTypes.STRING
  },
  bankIfsc: {
    type: DataTypes.STRING
  },
  bankName: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  photo: {
    type: DataTypes.STRING
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
  },
  extraFields: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isTemporary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matrixEmployeeId: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'employees',
  indexes: [
    { fields: ['companyId', 'employeeCode'], unique: true }
  ]
});

module.exports = Employee;

