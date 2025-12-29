const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReimbursementWorkflow = sequelize.define('ReimbursementWorkflow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reimbursementId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'reimbursements', key: 'id' }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'skipped'),
    defaultValue: 'pending'
  },
  remarks: {
    type: DataTypes.TEXT
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  isCurrentLevel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'reimbursement_workflows',
  indexes: [
    { fields: ['reimbursement_id', 'level'] },
    { fields: ['reimbursement_id'] },
    { fields: ['approver_id'] },
    { fields: ['status'] }
  ]
});

module.exports = ReimbursementWorkflow;



