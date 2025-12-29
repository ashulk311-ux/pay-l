const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ITDeclarationDocument = sequelize.define('ITDeclarationDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  itDeclarationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'it_declarations', key: 'id' }
  },
  sectionCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER
  },
  mimeType: {
    type: DataTypes.STRING
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verifiedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  verifiedAt: {
    type: DataTypes.DATE
  },
  remarks: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'it_declaration_documents',
  indexes: [
    { fields: ['it_declaration_id', 'section_code'] },
    { fields: ['it_declaration_id'] }
  ]
});

module.exports = ITDeclarationDocument;



