const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PFGroup = sequelize.define('PFGroup', {
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
  // PF Details
  accountGroupEstNo: {
    type: DataTypes.STRING
  },
  accountGroupNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dbfFileExtn: {
    type: DataTypes.STRING
  },
  dbfFileCode: {
    type: DataTypes.STRING
  },
  // Admin charge percentages
  accNo02Percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  accNo21Percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  accNo22Percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pf_groups',
  indexes: [
    { fields: ['company_id', 'group_name'], unique: true }
  ]
});

module.exports = PFGroup;


