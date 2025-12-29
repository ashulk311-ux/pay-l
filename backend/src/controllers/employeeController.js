const { Employee, Company, SalaryStructure } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const employeeService = require('../services/employeeService');
const path = require('path');
const fs = require('fs');

/**
 * Get all employees with filters and pagination
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, department, designation, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { companyId: req.user.companyId };

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { employeeCode: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Department filter
    if (department) {
      whereClause.department = department;
    }

    // Designation filter
    if (designation) {
      whereClause.designation = designation;
    }

    // Status filter
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      // Exclude non-existent columns - only query fields that exist in DB
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
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
  }
};

/**
 * Get single employee with related data
 */
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      // Exclude non-existent columns - only query fields that exist in DB
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
      },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name', 'code'] }
      ]
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check KYC status
    const kycStatus = employeeService.checkKYCStatus(employee);

    res.json({
      success: true,
      data: {
        ...employee.toJSON(),
        kycStatus: kycStatus
      }
    });
  } catch (error) {
    logger.error('Get employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee', error: error.message });
  }
};

/**
 * Create employee with onboarding wizard support
 */
exports.createEmployee = async (req, res) => {
  try {
    // Remove non-existent columns if present (keep only fields that exist in DB)
    const { 
      positionId, employeeType, salutation, middleName, fatherHusbandName, motherName,
      officePhone, residencePhone, mobileNo, personalMailId, passportNo, passportIssueOffice,
      passportIssueDate, passportExpiryDate, passportApplicable, emergencyContactName,
      emergencyContactRelationship, emergencyContactAddress, emergencyContactEmail,
      emergencyContactLandline, emergencyContactMobile, gender, appointmentLetterDate,
      confirmationDate, joiningDateForForm5, gratuityDate, dateOfPromotion, dateOfTransfer,
      contractStartDate, contractEndDate, dateOfRegularization, leavingDate, leavingDateForForm10,
      settlementDate, ctcAmount, ctcCurrency, effectiveFrom, leaveAssignDate, leaveTemplate,
      oldEmployeeCode, officialMailId, noticeDays, expat, costCenterId, unitId, gradeId,
      levelId, subDepartmentId, category, reportingManagerId, reportingHrId, staffId,
      currentAddress1, currentAddress2, currentCountry, currentState, currentCity, currentZip,
      permanentAddress1, permanentAddress2, permanentCountry, permanentState, permanentCity,
      permanentZip, sameAsCurrentAddress, nationality, maritalStatus, dateOfMarriage,
      spouseName, spouseDateOfBirth, totalNumberOfChildren, totalNumberOfSchoolGoingChildren,
      numberOfDependentsApartFromChildren, totalNumberOfChildrenInHostel, totalDependent,
      nameOfDependentsApartFromSpouseChildren, familyDetails, firstNomineeName, firstNomineeRelation,
      parentMediclaim, considerAsDirector, field1, field3, field4, field5, field6,
      religionName, identificationMark, hobbies, billable, statusDomicile, bloodGroup,
      severeDisability, severeDisabilityDetails, severeDisabilityBasedOnAttendance, skillSet,
      pfContribution, vpfContribution, pfNo, pfBasicGrossWages, pensionLimit, pension,
      customizedPfOption, customizedEsiOption, contributeEsiOnOt, esiContribution, esiNo,
      dispensaryName, labourWelfareFundContribution, customizedLwfOption, otPartOfGross,
      customizedOtPartOfGross, customizedEsiContributionOnOt, qualifications, previousWorkExperience,
      totalExperienceYears, totalExperienceMonths, totalExperienceNotRelevantToJobYears,
      totalExperienceNotRelevantToJobMonths, resume, pfUan, drivingLicence, drivingLicenceExpiryDate,
      voterId, rationCard, projectDone, finalized, suspended, projectIncomeTillDate,
      reasonForLeaving, leavingReasonPfEcrFile,
      ...employeeData 
    } = req.body;

    // Validate employee data
    const validation = employeeService.validateEmployeeData(employeeData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Generate employee code if not provided
    let employeeCode = employeeData.employeeCode;
    if (!employeeCode) {
      employeeCode = await employeeService.generateEmployeeCode(req.user.companyId, employeeData);
      if (!employeeCode) {
        return res.status(400).json({
          success: false,
          message: 'Employee code is required. Company policy requires manual code entry.'
        });
      }
    } else {
      // Check if code already exists
      const existing = await Employee.findOne({
        where: {
          companyId: req.user.companyId,
          employeeCode: employeeCode
        }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Employee code already exists'
        });
      }
    }

    // Check if email already exists
    if (employeeData.email) {
      const existingEmail = await Employee.findOne({
        where: {
          companyId: req.user.companyId,
          email: employeeData.email
        }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Create employee
    const employee = await Employee.create({
      ...employeeData,
      companyId: req.user.companyId,
      employeeCode: employeeCode,
      kycStatus: 'pending'
    });

    // Check initial KYC status
    const kycStatus = employeeService.checkKYCStatus(employee);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'create',
      entityType: 'Employee',
      entityId: employee.id,
      description: `Employee ${employeeCode} created`
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        ...employee.toJSON(),
        kycStatus: kycStatus
      }
    });
  } catch (error) {
    logger.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

/**
 * Update employee (supports onboarding wizard step-by-step updates)
 */
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: {
        exclude: ['positionId'] // Exclude non-existent column
      }
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Validate if email is being updated
    if (req.body.email && req.body.email !== employee.email) {
      const existingEmail = await Employee.findOne({
        where: {
          companyId: req.user.companyId,
          email: req.body.email,
          id: { [Op.ne]: employee.id }
        }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Remove non-existent columns if present (keep only fields that exist in DB)
    const { 
      positionId, employeeType, salutation, middleName, fatherHusbandName, motherName,
      officePhone, residencePhone, mobileNo, personalMailId, passportNo, passportIssueOffice,
      passportIssueDate, passportExpiryDate, passportApplicable, emergencyContactName,
      emergencyContactRelationship, emergencyContactAddress, emergencyContactEmail,
      emergencyContactLandline, emergencyContactMobile, gender, appointmentLetterDate,
      confirmationDate, joiningDateForForm5, gratuityDate, dateOfPromotion, dateOfTransfer,
      contractStartDate, contractEndDate, dateOfRegularization, leavingDate, leavingDateForForm10,
      settlementDate, ctcAmount, ctcCurrency, effectiveFrom, leaveAssignDate, leaveTemplate,
      oldEmployeeCode, officialMailId, noticeDays, expat, costCenterId, unitId, gradeId,
      levelId, subDepartmentId, category, reportingManagerId, reportingHrId, staffId,
      currentAddress1, currentAddress2, currentCountry, currentState, currentCity, currentZip,
      permanentAddress1, permanentAddress2, permanentCountry, permanentState, permanentCity,
      permanentZip, sameAsCurrentAddress, nationality, maritalStatus, dateOfMarriage,
      spouseName, spouseDateOfBirth, totalNumberOfChildren, totalNumberOfSchoolGoingChildren,
      numberOfDependentsApartFromChildren, totalNumberOfChildrenInHostel, totalDependent,
      nameOfDependentsApartFromSpouseChildren, familyDetails, firstNomineeName, firstNomineeRelation,
      parentMediclaim, considerAsDirector, field1, field3, field4, field5, field6,
      religionName, identificationMark, hobbies, billable, statusDomicile, bloodGroup,
      severeDisability, severeDisabilityDetails, severeDisabilityBasedOnAttendance, skillSet,
      pfContribution, vpfContribution, pfNo, pfBasicGrossWages, pensionLimit, pension,
      customizedPfOption, customizedEsiOption, contributeEsiOnOt, esiContribution, esiNo,
      dispensaryName, labourWelfareFundContribution, customizedLwfOption, otPartOfGross,
      customizedOtPartOfGross, customizedEsiContributionOnOt, qualifications, previousWorkExperience,
      totalExperienceYears, totalExperienceMonths, totalExperienceNotRelevantToJobYears,
      totalExperienceNotRelevantToJobMonths, resume, pfUan, drivingLicence, drivingLicenceExpiryDate,
      voterId, rationCard, projectDone, finalized, suspended, projectIncomeTillDate,
      reasonForLeaving, leavingReasonPfEcrFile,
      ...updateData 
    } = req.body;
    // Update employee
    await employee.update(updateData);

    // Recheck KYC status after update
    const kycStatus = employeeService.checkKYCStatus(employee);
    if (kycStatus.isComplete && employee.kycStatus !== 'verified') {
      employee.kycStatus = 'verified';
      await employee.save();
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'update',
      entityType: 'Employee',
      entityId: employee.id,
      description: 'Employee information updated'
    });

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        ...employee.toJSON(),
        kycStatus: kycStatus
      }
    });
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    employee.isActive = false;
    await employee.save();
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
};

exports.bulkImport = async (req, res) => {
  res.json({ success: true, message: 'Bulk import functionality to be implemented' });
};

/**
 * Upload employee documents (Aadhaar, PAN, Photo, etc.)
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body; // aadhaar, pan, photo, passport, address_proof, bank_details, etc.

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const employee = await Employee.findByPk(id, {
      attributes: {
        exclude: ['positionId'] // Exclude non-existent column
      }
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Store document path
    const documents = employee.documents || {};
    const relativePath = req.file.path.replace(path.join(__dirname, '../../uploads/'), '');
    
    documents[documentType] = {
      path: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id
    };

    // If photo, update photo field directly
    if (documentType === 'photo') {
      employee.photo = relativePath;
    }

    employee.documents = documents;
    await employee.save();

    // Recheck KYC status
    const kycStatus = employeeService.checkKYCStatus(employee);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'update',
      entityType: 'Employee',
      entityId: employee.id,
      description: `Document uploaded: ${documentType}`
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentType,
        path: relativePath,
        kycStatus: kycStatus
      }
    });
  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * Get employee documents
 */
exports.getDocuments = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: ['id', 'documents', 'photo', 'aadhaar', 'pan']
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      data: {
        documents: employee.documents || {},
        photo: employee.photo,
        aadhaar: employee.aadhaar,
        pan: employee.pan
      }
    });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};

/**
 * Verify/Update KYC status
 */
exports.verifyKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: 'verified', 'rejected', 'pending'

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KYC status. Must be verified, rejected, or pending'
      });
    }

    const employee = await Employee.findByPk(id, {
      attributes: {
        exclude: ['positionId'] // Exclude non-existent column
      }
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if KYC can be verified (all documents should be present)
    if (status === 'verified') {
      const kycStatus = employeeService.checkKYCStatus(employee);
      if (!kycStatus.isComplete) {
        return res.status(400).json({
          success: false,
          message: 'Cannot verify KYC. Missing documents: ' + kycStatus.missingDocuments.join(', ')
        });
      }
    }

    employee.kycStatus = status;
    if (remarks) {
      const extraFields = employee.extraFields || {};
      extraFields.kycRemarks = remarks;
      employee.extraFields = extraFields;
    }
    await employee.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'update',
      entityType: 'Employee',
      entityId: employee.id,
      description: `KYC status updated to ${status}${remarks ? ': ' + remarks : ''}`
    });

    res.json({
      success: true,
      message: `KYC status updated to ${status}`,
      data: {
        employeeId: employee.id,
        kycStatus: status,
        kycDetails: employeeService.checkKYCStatus(employee)
      }
    });
  } catch (error) {
    logger.error('Verify KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify KYC',
      error: error.message
    });
  }
};

/**
 * Get onboarding status (for wizard)
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const kycStatus = employeeService.checkKYCStatus(employee);
    const documents = employee.documents || {};

    // Define onboarding steps
    const steps = [
      {
        id: 'personal_info',
        title: 'Personal Information',
        completed: !!(employee.firstName && employee.lastName && employee.email && employee.phone),
        fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address']
      },
      {
        id: 'employment_details',
        title: 'Employment Details',
        completed: !!(employee.designation && employee.department && employee.dateOfJoining),
        fields: ['designation', 'department', 'branch', 'dateOfJoining']
      },
      {
        id: 'documents',
        title: 'Documents',
        completed: kycStatus.isComplete,
        fields: ['aadhaar', 'pan', 'photo', 'passport', 'address_proof']
      },
      {
        id: 'bank_details',
        title: 'Bank Details',
        completed: !!(employee.bankAccountNumber && employee.bankIfsc && employee.bankName),
        fields: ['bankAccountNumber', 'bankIfsc', 'bankName']
      },
      {
        id: 'statutory',
        title: 'Statutory Information',
        completed: !!(employee.pan && employee.aadhaar && employee.uan),
        fields: ['pan', 'aadhaar', 'uan']
      }
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const progress = (completedSteps / steps.length) * 100;

    res.json({
      success: true,
      data: {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        progress: Math.round(progress),
        completedSteps,
        totalSteps: steps.length,
        steps,
        kycStatus: kycStatus,
        isOnboardingComplete: progress === 100 && kycStatus.isComplete
      }
    });
  } catch (error) {
    logger.error('Get onboarding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding status',
      error: error.message
    });
  }
};

