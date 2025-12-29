const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Designation = sequelize.define('Designation', {
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
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT
  },
  minSalary: {
    type: DataTypes.DECIMAL(10, 2)
  },
  maxSalary: {
    type: DataTypes.DECIMAL(10, 2)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'designations',
  indexes: [
    { fields: ['company_id', 'code'], unique: true },
    { fields: ['company_id'] }
  ]
});

module.exports = Designation;



