const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ESIGroup = sequelize.define('ESIGroup', {
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
  // ESI Details
  esiNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  esiLocalOffice: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'esi_groups',
  indexes: [
    { fields: ['company_id', 'group_name'], unique: true }
  ]
});

module.exports = ESIGroup;


