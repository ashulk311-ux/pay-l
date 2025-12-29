const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
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
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // positionId removed - column doesn't exist in database
  // employeeType removed - column doesn't exist in database
  // salutation removed - column doesn't exist in database
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middleName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fatherHusbandName: {
    type: DataTypes.STRING
  },
  motherName: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  officePhone: {
    type: DataTypes.STRING
  },
  residencePhone: {
    type: DataTypes.STRING
  },
  mobileNo: {
    type: DataTypes.STRING
  },
  personalMailId: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  // Passport Information
  passportNo: {
    type: DataTypes.STRING
  },
  passportIssueOffice: {
    type: DataTypes.STRING
  },
  passportIssueDate: {
    type: DataTypes.DATE
  },
  passportExpiryDate: {
    type: DataTypes.DATE
  },
  passportApplicable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Emergency Contact
  emergencyContactName: {
    type: DataTypes.STRING
  },
  emergencyContactRelationship: {
    type: DataTypes.STRING
  },
  emergencyContactAddress: {
    type: DataTypes.TEXT
  },
  emergencyContactEmail: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  emergencyContactLandline: {
    type: DataTypes.STRING
  },
  emergencyContactMobile: {
    type: DataTypes.STRING
  },
  dateOfBirth: {
    type: DataTypes.DATE
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    defaultValue: 'male'
  },
  dateOfJoining: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointmentLetterDate: {
    type: DataTypes.DATE
  },
  confirmationDate: {
    type: DataTypes.DATE
  },
  joiningDateForForm5: {
    type: DataTypes.DATE
  },
  gratuityDate: {
    type: DataTypes.DATE
  },
  dateOfPromotion: {
    type: DataTypes.DATE
  },
  dateOfTransfer: {
    type: DataTypes.DATE
  },
  contractStartDate: {
    type: DataTypes.DATE
  },
  contractEndDate: {
    type: DataTypes.DATE
  },
  dateOfRegularization: {
    type: DataTypes.DATE
  },
  leavingDate: {
    type: DataTypes.DATE
  },
  leavingDateForForm10: {
    type: DataTypes.DATE
  },
  settlementDate: {
    type: DataTypes.DATE
  },
  ctcAmount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  ctcCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  effectiveFrom: {
    type: DataTypes.DATE
  },
  leaveAssignDate: {
    type: DataTypes.DATE
  },
  leaveTemplate: {
    type: DataTypes.STRING
  },
  oldEmployeeCode: {
    type: DataTypes.STRING
  },
  officialMailId: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  noticeDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expat: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  designation: {
    type: DataTypes.STRING
  },
  designationId: {
    type: DataTypes.UUID,
    references: { model: 'designations', key: 'id' }
  },
  department: {
    type: DataTypes.STRING
  },
  departmentId: {
    type: DataTypes.UUID,
    references: { model: 'departments', key: 'id' }
  },
  branch: {
    type: DataTypes.STRING
  },
  branchId: {
    type: DataTypes.UUID,
    references: { model: 'branches', key: 'id' }
  },
  regionId: {
    type: DataTypes.UUID,
    references: { model: 'regions', key: 'id' }
  },
  costCenterId: {
    type: DataTypes.UUID,
    references: { model: 'cost_centers', key: 'id' }
  },
  unitId: {
    type: DataTypes.UUID,
    references: { model: 'units', key: 'id' }
  },
  gradeId: {
    type: DataTypes.UUID,
    references: { model: 'grades', key: 'id' }
  },
  levelId: {
    type: DataTypes.UUID,
    references: { model: 'levels', key: 'id' }
  },
  subDepartmentId: {
    type: DataTypes.UUID,
    references: { model: 'sub_departments', key: 'id' }
  },
  category: {
    type: DataTypes.STRING
  },
  reportingManagerId: {
    type: DataTypes.UUID,
    references: { model: 'employees', key: 'id' }
  },
  reportingHrId: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  staffId: {
    type: DataTypes.STRING
  },
  pan: {
    type: DataTypes.STRING
  },
  aadhaar: {
    type: DataTypes.STRING
  },
  uan: {
    type: DataTypes.STRING
  },
  bankAccountNumber: {
    type: DataTypes.STRING
  },
  bankIfsc: {
    type: DataTypes.STRING
  },
  bankName: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  // Current Address
  currentAddress1: {
    type: DataTypes.TEXT
  },
  currentAddress2: {
    type: DataTypes.TEXT
  },
  currentCountry: {
    type: DataTypes.STRING,
    defaultValue: 'India'
  },
  currentState: {
    type: DataTypes.STRING
  },
  currentCity: {
    type: DataTypes.STRING
  },
  currentZip: {
    type: DataTypes.STRING
  },
  // Permanent Address
  permanentAddress1: {
    type: DataTypes.TEXT
  },
  permanentAddress2: {
    type: DataTypes.TEXT
  },
  permanentCountry: {
    type: DataTypes.STRING,
    defaultValue: 'India'
  },
  permanentState: {
    type: DataTypes.STRING
  },
  permanentCity: {
    type: DataTypes.STRING
  },
  permanentZip: {
    type: DataTypes.STRING
  },
  sameAsCurrentAddress: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nationality: {
    type: DataTypes.STRING,
    defaultValue: 'Indian'
  },
  // Family Details
  maritalStatus: {
    type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
    defaultValue: 'single'
  },
  dateOfMarriage: {
    type: DataTypes.DATE
  },
  spouseName: {
    type: DataTypes.STRING
  },
  spouseDateOfBirth: {
    type: DataTypes.DATE
  },
  totalNumberOfChildren: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalNumberOfSchoolGoingChildren: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  numberOfDependentsApartFromChildren: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalNumberOfChildrenInHostel: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalDependent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nameOfDependentsApartFromSpouseChildren: {
    type: DataTypes.TEXT
  },
  familyDetails: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  firstNomineeName: {
    type: DataTypes.STRING
  },
  firstNomineeRelation: {
    type: DataTypes.STRING
  },
  parentMediclaim: {
    type: DataTypes.ENUM('not_applicable', 'without_senior_citizen', 'with_senior_citizen'),
    defaultValue: 'not_applicable'
  },
  photo: {
    type: DataTypes.STRING
  },
  passport: {
    type: DataTypes.STRING
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  digitalSignature: {
    type: DataTypes.TEXT
  },
  signatureDate: {
    type: DataTypes.DATE
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected', 'in_progress'),
    defaultValue: 'pending'
  },
  kycVerifiedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  kycVerifiedAt: {
    type: DataTypes.DATE
  },
  kycRemarks: {
    type: DataTypes.TEXT
  },
  extraFields: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  // Other Information
  considerAsDirector: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  field1: {
    type: DataTypes.STRING
  },
  field3: {
    type: DataTypes.STRING
  },
  field4: {
    type: DataTypes.STRING
  },
  field5: {
    type: DataTypes.STRING
  },
  field6: {
    type: DataTypes.STRING
  },
  religionName: {
    type: DataTypes.STRING
  },
  identificationMark: {
    type: DataTypes.STRING
  },
  hobbies: {
    type: DataTypes.TEXT
  },
  billable: {
    type: DataTypes.ENUM('billable', 'non_billable'),
    defaultValue: 'non_billable'
  },
  statusDomicile: {
    type: DataTypes.STRING
  },
  bloodGroup: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  },
  severeDisability: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  severeDisabilityDetails: {
    type: DataTypes.TEXT
  },
  severeDisabilityBasedOnAttendance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  skillSet: {
    type: DataTypes.TEXT
  },
  // PF/ESI/PT Details
  pfContribution: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  vpfContribution: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pfNo: {
    type: DataTypes.STRING
  },
  pfBasicGrossWages: {
    type: DataTypes.ENUM('basic', 'gross'),
    defaultValue: 'basic'
  },
  pensionLimit: {
    type: DataTypes.DECIMAL(12, 2)
  },
  pension: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  customizedPfOption: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  customizedEsiOption: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  contributeEsiOnOt: {
    type: DataTypes.ENUM('none', 'ot', 'fooding'),
    defaultValue: 'none'
  },
  esiContribution: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  esiNo: {
    type: DataTypes.STRING
  },
  dispensaryName: {
    type: DataTypes.STRING
  },
  labourWelfareFundContribution: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customizedLwfOption: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  otPartOfGross: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customizedOtPartOfGross: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customizedEsiContributionOnOt: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Qualification & Experience
  qualifications: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  previousWorkExperience: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  totalExperienceYears: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalExperienceMonths: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalExperienceNotRelevantToJobYears: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalExperienceNotRelevantToJobMonths: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  resume: {
    type: DataTypes.STRING
  },
  // Additional Fields
  pfUan: {
    type: DataTypes.STRING
  },
  drivingLicence: {
    type: DataTypes.STRING
  },
  drivingLicenceExpiryDate: {
    type: DataTypes.DATE
  },
  voterId: {
    type: DataTypes.STRING
  },
  rationCard: {
    type: DataTypes.STRING
  },
  // Project & Leaving Details
  projectDone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  finalized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  suspended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  projectIncomeTillDate: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  reasonForLeaving: {
    type: DataTypes.STRING
  },
  leavingReasonPfEcrFile: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isTemporary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matrixEmployeeId: {
    type: DataTypes.STRING
  },
  // GDPR Compliance fields
  isAnonymized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  anonymizedAt: {
    type: DataTypes.DATE
  },
  anonymizedBy: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  },
  anonymizationReason: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'employees',
  indexes: [
    { fields: ['company_id', 'employee_code'], unique: true }
  ],
  // Explicitly exclude non-existent columns from model attributes
  // Only these columns exist in DB: id, companyId, employeeCode, firstName, lastName, email, phone, 
  // dateOfBirth, dateOfJoining, designation, designationId, department, departmentId, branch, branchId,
  // regionId, pan, aadhaar, uan, bankAccountNumber, bankIfsc, bankName, address, photo, passport, documents,
  // digitalSignature, signatureDate, kycStatus, kycVerifiedBy, kycVerifiedAt, kycRemarks, extraFields,
  // isActive, isTemporary, matrixEmployeeId, isAnonymized, anonymizedAt, anonymizedBy, anonymizationReason,
  // createdAt, updatedAt
  defaultScope: {
    attributes: {
      exclude: [
        'positionId', 'employeeType', 'salutation', 'middleName', 'fatherHusbandName', 'motherName',
        'officePhone', 'residencePhone', 'mobileNo', 'personalMailId', 'passportNo', 'passportIssueOffice',
        'passportIssueDate', 'passportExpiryDate', 'passportApplicable', 'emergencyContactName',
        'emergencyContactRelationship', 'emergencyContactAddress', 'emergencyContactEmail',
        'emergencyContactLandline', 'emergencyContactMobile', 'gender', 'appointmentLetterDate',
        'confirmationDate', 'joiningDateForForm5', 'gratuityDate', 'dateOfPromotion', 'dateOfTransfer',
        'contractStartDate', 'contractEndDate', 'dateOfRegularization', 'leavingDate', 'leavingDateForForm10',
        'settlementDate', 'ctcAmount', 'ctcCurrency', 'effectiveFrom', 'leaveAssignDate', 'leaveTemplate',
        'oldEmployeeCode', 'officialMailId', 'noticeDays', 'expat', 'costCenterId', 'unitId', 'gradeId',
        'levelId', 'subDepartmentId', 'category', 'reportingManagerId', 'reportingHrId', 'staffId',
        'currentAddress1', 'currentAddress2', 'currentCountry', 'currentState', 'currentCity', 'currentZip',
        'permanentAddress1', 'permanentAddress2', 'permanentCountry', 'permanentState', 'permanentCity',
        'permanentZip', 'sameAsCurrentAddress', 'nationality', 'maritalStatus', 'dateOfMarriage',
        'spouseName', 'spouseDateOfBirth', 'totalNumberOfChildren', 'totalNumberOfSchoolGoingChildren',
        'numberOfDependentsApartFromChildren', 'totalNumberOfChildrenInHostel', 'totalDependent',
        'nameOfDependentsApartFromSpouseChildren', 'familyDetails', 'firstNomineeName', 'firstNomineeRelation',
        'parentMediclaim', 'considerAsDirector', 'field1', 'field3', 'field4', 'field5', 'field6',
        'religionName', 'identificationMark', 'hobbies', 'billable', 'statusDomicile', 'bloodGroup',
        'severeDisability', 'severeDisabilityDetails', 'severeDisabilityBasedOnAttendance', 'skillSet',
        'pfContribution', 'vpfContribution', 'pfNo', 'pfBasicGrossWages', 'pensionLimit', 'pension',
        'customizedPfOption', 'customizedEsiOption', 'contributeEsiOnOt', 'esiContribution', 'esiNo',
        'dispensaryName', 'labourWelfareFundContribution', 'customizedLwfOption', 'otPartOfGross',
        'customizedOtPartOfGross', 'customizedEsiContributionOnOt', 'qualifications', 'previousWorkExperience',
        'totalExperienceYears', 'totalExperienceMonths', 'totalExperienceNotRelevantToJobYears',
        'totalExperienceNotRelevantToJobMonths', 'resume', 'pfUan', 'drivingLicence', 'drivingLicenceExpiryDate',
        'voterId', 'rationCard', 'projectDone', 'finalized', 'suspended', 'projectIncomeTillDate',
        'reasonForLeaving', 'leavingReasonPfEcrFile'
      ]
    }
  }
});

module.exports = Employee;

