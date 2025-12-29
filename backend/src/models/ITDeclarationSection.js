const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ITDeclarationSection = sequelize.define('ITDeclarationSection', {
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
  sectionCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sectionName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  maxAmount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiresDocument: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  documentTypes: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  fields: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'it_declaration_sections',
  indexes: [
    { fields: ['company_id', 'section_code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = ITDeclarationSection;



