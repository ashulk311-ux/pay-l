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
  website: {
    type: DataTypes.STRING
  },
  contactPerson: {
    type: DataTypes.STRING
  },
  contactPersonPhone: {
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
  // Bank Details are stored in settings.bankDetails JSON field
  // Removed bankName, bankAccountNumber, bankBranch, bankAddress, bankIfscCode
  // from model since columns don't exist in database
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
  employeeCodeGenerationMode: {
    type: DataTypes.ENUM('manual', 'auto', 'matrix'),
    defaultValue: 'manual'
  },
  employeeCodePrefix: {
    type: DataTypes.STRING,
    defaultValue: 'EMP'
  },
  employeeCodeFormat: {
    type: DataTypes.STRING,
    defaultValue: '{PREFIX}{NUMBER}'
  },
  matrixSoftwareIntegration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matrixApiKey: {
    type: DataTypes.STRING
  },
  matrixApiUrl: {
    type: DataTypes.STRING
  },
  theme: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  settings: {
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

