const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubDepartment = sequelize.define('SubDepartment', {
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
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'departments', key: 'id' }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sub_departments',
  indexes: [
    { fields: ['company_id', 'code'], unique: true },
    { fields: ['department_id'] }
  ]
});

module.exports = SubDepartment;


