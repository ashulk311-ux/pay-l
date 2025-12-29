const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TDSDeductor = sequelize.define('TDSDeductor', {
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
  // Deductor Details
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  branchDivision: {
    type: DataTypes.STRING
  },
  flatDoorBlockNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  buildingName: {
    type: DataTypes.STRING
  },
  streetRoadName: {
    type: DataTypes.STRING
  },
  area: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  addressChange: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  telephoneStdCode: {
    type: DataTypes.STRING
  },
  telephone: {
    type: DataTypes.STRING
  },
  alternateTelephoneStdCode: {
    type: DataTypes.STRING
  },
  alternateTelephone: {
    type: DataTypes.STRING
  },
  fax: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  alternateEmail: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  // Responsible Person Details
  responsiblePersonName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonFatherName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonDesignation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonSex: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false
  },
  responsiblePersonFlatDoorBlockNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonBuildingName: {
    type: DataTypes.STRING
  },
  responsiblePersonStreetRoadName: {
    type: DataTypes.STRING
  },
  responsiblePersonArea: {
    type: DataTypes.STRING
  },
  responsiblePersonState: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonPinCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonAddressChange: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  responsiblePersonTelephoneStdCode: {
    type: DataTypes.STRING
  },
  responsiblePersonTelephone: {
    type: DataTypes.STRING
  },
  responsiblePersonAlternateTelephoneStdCode: {
    type: DataTypes.STRING
  },
  responsiblePersonAlternateTelephone: {
    type: DataTypes.STRING
  },
  responsiblePersonMobileNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonFax: {
    type: DataTypes.STRING
  },
  responsiblePersonEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  responsiblePersonAlternateEmail: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  // Other Details
  financialYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  asstYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deductionFor: {
    type: DataTypes.ENUM('companies', 'non_companies'),
    defaultValue: 'companies'
  },
  panNumbers: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  tanNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsiblePersonPAN: {
    type: DataTypes.STRING
  },
  citCity: {
    type: DataTypes.STRING
  },
  citPin: {
    type: DataTypes.STRING
  },
  gstin: {
    type: DataTypes.STRING
  },
  existingTDSAssessee: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  returnType: {
    type: DataTypes.ENUM('digital', 'electronic'),
    defaultValue: 'digital'
  },
  status: {
    type: DataTypes.ENUM('company', 'central_government', 'state_government', 'statutory_body_central', 'statutory_body_state', 'autonomous_body_central', 'autonomous_body_state', 'local_authority_central', 'local_authority_state', 'branch_division_company', 'aop', 'aop_trust', 'artificial_juridical_person', 'body_of_individuals', 'individual_huf', 'firm'),
    defaultValue: 'company'
  },
  approvedByAssessingOfficer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  assessingOfficerCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tdsRange: {
    type: DataTypes.STRING
  },
  citAddress: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tds_deductors',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['tan_number'] }
  ]
});

module.exports = TDSDeductor;


