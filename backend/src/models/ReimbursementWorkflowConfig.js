const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReimbursementWorkflowConfig = sequelize.define('ReimbursementWorkflowConfig', {
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
  categoryId: {
    type: DataTypes.UUID,
    references: { model: 'reimbursement_categories', key: 'id' }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approverType: {
    type: DataTypes.ENUM('role', 'user', 'department_head', 'hr', 'finance'),
    allowNull: false
  },
  approverId: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  roleId: {
    type: DataTypes.UUID,
    references: { model: 'roles', key: 'id' }
  },
  minAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  maxAmount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'reimbursement_workflow_configs',
  indexes: [
    { fields: ['company_id', 'category_id', 'level'] },
    { fields: ['company_id'] },
    { fields: ['category_id'] }
  ]
});

module.exports = ReimbursementWorkflowConfig;



