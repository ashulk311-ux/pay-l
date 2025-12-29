const { Company, User, Role } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

// Bank columns removed from model - no longer needed
// Bank details are stored in settings.bankDetails JSON field

exports.getAllCompanies = async (req, res) => {
  try {
    // Super Admin can see all companies (active and inactive)
    // Other roles see only active companies
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const whereClause = isSuperAdmin ? {} : { isActive: true };
    
    const companies = await Company.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: companies });
  } catch (error) {
    logger.error('Get companies error:', error);
    const { getErrorMessage } = require('../utils/errorMessages');
    res.status(500).json({ 
      success: false, 
      message: getErrorMessage('OPERATION_FAILED', 'fetch companies'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      const { getErrorMessage } = require('../utils/errorMessages');
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Company') });
    }
    
    // Company Admin can only view their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      const { getErrorMessage } = require('../utils/errorMessages');
      return res.status(403).json({ success: false, message: getErrorMessage('ACCESS_DENIED') });
    }
    
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Get company error:', error);
    const { getErrorMessage } = require('../utils/errorMessages');
    res.status(500).json({ 
      success: false, 
      message: getErrorMessage('OPERATION_FAILED', 'fetch company'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createCompany = async (req, res) => {
  try {
    // Remove bank fields from req.body if they exist (they're not in DB/model)
    const { bankName, bankAccountNumber, bankBranch, bankAddress, bankIfscCode, ...companyData } = req.body;
    
    // If bank details provided, store in settings JSON field
    if (bankName || bankAccountNumber || bankBranch || bankAddress || bankIfscCode) {
      companyData.settings = {
        ...(companyData.settings || {}),
        bankDetails: {
          bankName,
          bankAccountNumber,
          bankBranch,
          bankAddress,
          bankIfscCode
        }
      };
    }
    
    const company = await Company.create(companyData);
    
    // Automatically create a Company Admin user for the new company
    try {
      const companyAdminRole = await Role.findOne({ 
        where: { name: 'Company Admin' } 
      });
      
      if (companyAdminRole) {
        // Generate default email based on company code or email
        const defaultEmail = companyData.email 
          ? `admin@${companyData.email.split('@')[1] || company.code.toLowerCase()}.com`
          : `admin@${company.code.toLowerCase()}.com`;
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: defaultEmail } });
        
        if (!existingUser) {
          const defaultPassword = 'admin123'; // Default password
          
          const adminUser = await User.create({
            email: defaultEmail,
            password: defaultPassword,
            firstName: 'Company',
            lastName: 'Admin',
            roleId: companyAdminRole.id,
            companyId: company.id,
            isActive: true
          });
          
          logger.info(`Created Company Admin user for company ${company.name}: ${defaultEmail}`);
          
          // Log the credentials (only in development)
          if (process.env.NODE_ENV === 'development') {
            logger.info(`Company Admin credentials - Email: ${defaultEmail}, Password: ${defaultPassword}`);
          }
        }
      }
    } catch (userError) {
      // Log error but don't fail company creation
      logger.error('Error creating Company Admin user:', userError);
    }
    
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'create',
      entityType: 'Company',
      entityId: company.id
    });
    
    // Reload company to get any associations
    const createdCompany = await Company.findByPk(company.id);
    
    res.status(201).json({ 
      success: true, 
      data: createdCompany,
      message: 'Company created successfully. A Company Admin user has been created.',
      adminCredentials: process.env.NODE_ENV === 'development' ? {
        email: companyData.email 
          ? `admin@${companyData.email.split('@')[1] || company.code.toLowerCase()}.com`
          : `admin@${company.code.toLowerCase()}.com`,
        password: 'admin123'
      } : undefined
    });
  } catch (error) {
    logger.error('Create company error:', error);
    const { getErrorMessage } = require('../utils/errorMessages');
    res.status(500).json({ 
      success: false, 
      message: getErrorMessage('OPERATION_FAILED', 'create company'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      const { getErrorMessage } = require('../utils/errorMessages');
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Company') });
    }
    
    // Company Admin can only update their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      const { getErrorMessage } = require('../utils/errorMessages');
      return res.status(403).json({ success: false, message: getErrorMessage('ACCESS_DENIED') });
    }
    
    // Remove bank fields from update data (they're stored in settings)
    const { bankName, bankAccountNumber, bankBranch, bankAddress, bankIfscCode, ...updateData } = req.body;
    
    // If bank details provided, merge into settings
    if (bankName || bankAccountNumber || bankBranch || bankAddress || bankIfscCode) {
      const currentSettings = company.settings || {};
      updateData.settings = {
        ...currentSettings,
        bankDetails: {
          bankName,
          bankAccountNumber,
          bankBranch,
          bankAddress,
          bankIfscCode
        }
      };
    }
    
    await company.update(updateData);
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id
    });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Failed to update company' });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    company.isActive = false;
    await company.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'delete',
      entityType: 'Company',
      entityId: company.id
    });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    logger.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
};

exports.updateSMTPConfig = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Company Admin can only update their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { smtpHost, smtpPort, smtpUser, smtpPassword } = req.body;
    await company.update({ smtpHost, smtpPort, smtpUser, smtpPassword });
    
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'SMTP configuration updated'
    });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update SMTP config error:', error);
    res.status(500).json({ success: false, message: 'Failed to update SMTP configuration' });
  }
};

exports.updateWhatsAppConfig = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Company Admin can only update their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { whatsappEnabled, twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = req.body;
    await company.update({ whatsappEnabled, twilioAccountSid, twilioAuthToken, twilioPhoneNumber });
    
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'WhatsApp configuration updated'
    });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update WhatsApp config error:', error);
    res.status(500).json({ success: false, message: 'Failed to update WhatsApp configuration' });
  }
};

exports.updateEmployeeCodeSettings = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Company Admin can only update their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { employeeCodeGenerationMode, employeeCodePrefix, employeeCodeFormat, matrixSoftwareIntegration, matrixApiKey, matrixApiUrl } = req.body;
    await company.update({ 
      employeeCodeGenerationMode, 
      employeeCodePrefix, 
      employeeCodeFormat,
      matrixSoftwareIntegration,
      matrixApiKey,
      matrixApiUrl
    });
    
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Employee code settings updated'
    });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update employee code settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee code settings' });
  }
};

exports.getMyCompany = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Get my company error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company' });
  }
};

/**
 * Update company settings (all configuration sections stored in settings JSON)
 */
exports.updateCompanySettings = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Company Admin can only update their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Merge new settings with existing settings
    const currentSettings = company.settings || {};
    const updatedSettings = { ...currentSettings, ...req.body };

    await company.update({ settings: updatedSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Company settings updated'
    });

    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update company settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update company settings', error: error.message });
  }
};

/**
 * Get company settings
 */
exports.getCompanySettings = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Company Admin can only view their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: company.settings || {} });
  } catch (error) {
    logger.error('Get company settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company settings' });
  }
};

/**
 * Update Custom Messages
 */
exports.updateCustomMessages = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.customMessages = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Custom messages updated'
    });

    res.json({ success: true, data: company.settings.customMessages });
  } catch (error) {
    logger.error('Update custom messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to update custom messages' });
  }
};

/**
 * Update Employee Parameters
 */
exports.updateEmployeeParameters = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.employeeParameters = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Employee parameters updated'
    });

    res.json({ success: true, data: company.settings.employeeParameters });
  } catch (error) {
    logger.error('Update employee parameters error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee parameters' });
  }
};

/**
 * Update Mail Parameters
 */
exports.updateMailParameters = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.mailParameters = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Mail parameters updated'
    });

    res.json({ success: true, data: company.settings.mailParameters });
  } catch (error) {
    logger.error('Update mail parameters error:', error);
    res.status(500).json({ success: false, message: 'Failed to update mail parameters' });
  }
};

/**
 * Update Attendance Parameters
 */
exports.updateAttendanceParameters = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.attendanceParameters = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Attendance parameters updated'
    });

    res.json({ success: true, data: company.settings.attendanceParameters });
  } catch (error) {
    logger.error('Update attendance parameters error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance parameters' });
  }
};

/**
 * Update Salary Parameters
 */
exports.updateSalaryParameters = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.salaryParameters = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Salary parameters updated'
    });

    res.json({ success: true, data: company.settings.salaryParameters });
  } catch (error) {
    logger.error('Update salary parameters error:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary parameters' });
  }
};

/**
 * Update Other Settings
 */
exports.updateOtherSettings = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.otherSettings = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Other settings updated'
    });

    res.json({ success: true, data: company.settings.otherSettings });
  } catch (error) {
    logger.error('Update other settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update other settings' });
  }
};

/**
 * Update Password Policy
 */
exports.updatePasswordPolicy = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentSettings = company.settings || {};
    currentSettings.passwordPolicy = req.body;

    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Password policy updated'
    });

    res.json({ success: true, data: company.settings.passwordPolicy });
  } catch (error) {
    logger.error('Update password policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password policy' });
  }
};

/**
 * Update Bank Details
 */
exports.updateBankDetails = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) {
      const { getErrorMessage } = require('../utils/errorMessages');
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Company') });
    }

    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && req.user.companyId !== company.id) {
      const { getErrorMessage } = require('../utils/errorMessages');
      return res.status(403).json({ success: false, message: getErrorMessage('ACCESS_DENIED') });
    }

    // Store bank details in settings JSON field since columns don't exist yet
    const { bankName, bankAccountNumber, bankBranch, bankAddress, bankIfscCode } = req.body;
    const currentSettings = company.settings || {};
    currentSettings.bankDetails = {
      bankName,
      bankAccountNumber,
      bankBranch,
      bankAddress,
      bankIfscCode
    };
    
    await company.update({ settings: currentSettings });

    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id,
      details: 'Bank details updated'
    });

    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update bank details error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bank details' });
  }
};

