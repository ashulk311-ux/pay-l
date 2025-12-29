const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeeDocument = sequelize.define('EmployeeDocument', {
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
  documentType: {
    type: DataTypes.ENUM('AADHAAR', 'PAN', 'PHOTO', 'PASSPORT', 'UAN', 'ADDRESS_PROOF', 'BANK_DETAILS', 'OTHER'),
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
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'employee_documents',
  indexes: [
    { fields: ['employee_id', 'document_type'] },
    { fields: ['employee_id'] }
  ]
});

module.exports = EmployeeDocument;



