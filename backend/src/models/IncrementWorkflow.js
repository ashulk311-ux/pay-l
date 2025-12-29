const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IncrementWorkflow = sequelize.define('IncrementWorkflow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  incrementId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'salary_increments', key: 'id' }
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
  tableName: 'increment_workflows',
  indexes: [
    { fields: ['increment_id', 'level'] },
    { fields: ['increment_id'] },
    { fields: ['approver_id'] },
    { fields: ['status'] }
  ]
});

module.exports = IncrementWorkflow;



