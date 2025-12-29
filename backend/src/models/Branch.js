const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'companies', key: 'id' }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
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
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  contactPerson: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'branches',
  indexes: [
    { fields: ['company_id', 'code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = Branch;



