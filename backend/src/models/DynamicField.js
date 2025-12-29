const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DynamicField = sequelize.define('DynamicField', {
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
  fieldCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fieldLabel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fieldType: {
    type: DataTypes.ENUM('text', 'date', 'number', 'email', 'phone', 'textarea', 'select'),
    allowNull: false,
    defaultValue: 'text'
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isMandatory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  options: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  validationRules: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  section: {
    type: DataTypes.STRING,
    defaultValue: 'extra'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'dynamic_fields',
  indexes: [
    { fields: ['company_id', 'field_code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = DynamicField;



