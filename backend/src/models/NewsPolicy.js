const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NewsPolicy = sequelize.define('NewsPolicy', {
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
  type: {
    type: DataTypes.ENUM('news', 'policy', 'announcement'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  targetAudience: {
    type: DataTypes.ENUM('all', 'department', 'branch', 'designation', 'custom'),
    defaultValue: 'all'
  },
  targetIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  sendNotification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  publishedAt: {
    type: DataTypes.DATE
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'news_policies',
  indexes: [
    { fields: ['company_id', 'type'] },
    { fields: ['company_id', 'published_at'] },
    { fields: ['company_id'] }
  ]
});

module.exports = NewsPolicy;



