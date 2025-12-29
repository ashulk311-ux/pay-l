const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PTGroup = sequelize.define('PTGroup', {
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
  groupName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePerson: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // PT Details
  ptCertificateNumber: {
    type: DataTypes.STRING
  },
  ptoCircleNumber: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pt_groups',
  indexes: [
    { fields: ['company_id', 'group_name'], unique: true }
  ]
});

module.exports = PTGroup;


