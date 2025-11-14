const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    unique: true
  },
  logo: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'India'
  },
  pincode: {
    type: DataTypes.STRING
  },
  pan: {
    type: DataTypes.STRING
  },
  gstin: {
    type: DataTypes.STRING
  },
  smtpHost: {
    type: DataTypes.STRING
  },
  smtpPort: {
    type: DataTypes.INTEGER
  },
  smtpUser: {
    type: DataTypes.STRING
  },
  smtpPassword: {
    type: DataTypes.STRING
  },
  whatsappEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twilioAccountSid: {
    type: DataTypes.STRING
  },
  twilioAuthToken: {
    type: DataTypes.STRING
  },
  twilioPhoneNumber: {
    type: DataTypes.STRING
  },
  theme: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies'
});

module.exports = Company;

