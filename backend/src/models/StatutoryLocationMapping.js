const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StatutoryLocationMapping = sequelize.define('StatutoryLocationMapping', {
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
  groupType: {
    type: DataTypes.ENUM('PF', 'ESI', 'PT', 'LWF'),
    allowNull: false
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  groupName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Mapping combination type: 'cost_center_location_unit', 'cost_center_location', 'location_unit', 'location', 'mixed'
  mappingType: {
    type: DataTypes.ENUM('cost_center_location_unit', 'cost_center_location', 'location_unit', 'location', 'mixed'),
    allowNull: false
  },
  // Selected IDs (stored as JSON arrays)
  costCenterIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  locationIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  unitIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'statutory_location_mappings',
  indexes: [
    { fields: ['company_id', 'group_type', 'group_id'] },
    { fields: ['company_id'] }
  ]
});

module.exports = StatutoryLocationMapping;


