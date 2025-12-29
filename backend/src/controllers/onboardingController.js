const { Employee, EmployeeOnboarding, EmployeeDocument, DynamicField, Company } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const { sendOnboardingEmail } = require('../services/emailService');

/**
 * Send onboarding invite to employee
 */
exports.sendOnboardingInvite = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findByPk(employeeId);

    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Generate unique invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 days validity

    // Create or update onboarding record
    const [onboarding, created] = await EmployeeOnboarding.findOrCreate({
      where: { employeeId },
      defaults: {
        employeeId,
        inviteToken,
        inviteSentAt: new Date(),
        inviteExpiresAt,
        status: 'invited'
      }
    });

    if (!created) {
      onboarding.inviteToken = inviteToken;
      onboarding.inviteSentAt = new Date();
      onboarding.inviteExpiresAt = inviteExpiresAt;
      onboarding.status = 'invited';
      await onboarding.save();
    }

    // Send email with onboarding link
    const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/${inviteToken}`;
    await sendOnboardingEmail(employee.email, {
      employeeName: `${employee.firstName} ${employee.lastName}`,
      onboardingUrl,
      expiresAt: inviteExpiresAt
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'send_onboarding_invite',
      entityType: 'EmployeeOnboarding',
      entityId: onboarding.id,
      description: `Onboarding invite sent to ${employee.email}`
    });

    res.json({
      success: true,
      data: {
        onboarding,
        onboardingUrl
      },
      message: 'Onboarding invite sent successfully'
    });
  } catch (error) {
    logger.error('Send onboarding invite error:', error);
    res.status(500).json({ success: false, message: 'Failed to send onboarding invite' });
  }
};

/**
 * Get onboarding form by token (public endpoint for new joinee)
 */
exports.getOnboardingForm = async (req, res) => {
  try {
    const { token } = req.params;
    const onboarding = await EmployeeOnboarding.findOne({
      where: { inviteToken: token },
      include: [
        {
          model: Employee,
          as: 'employee',
          include: [
            { model: Company, as: 'company', attributes: ['id', 'name', 'code'] }
          ]
        }
      ]
    });

    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Invalid onboarding link' });
    }

    // Check if expired
    if (new Date() > new Date(onboarding.inviteExpiresAt)) {
      return res.status(400).json({ success: false, message: 'Onboarding link has expired' });
    }

    // Get dynamic fields for the company
    const dynamicFields = await DynamicField.findAll({
      where: {
        companyId: onboarding.employee.companyId,
        isActive: true
      },
      order: [['displayOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        onboarding,
        employee: onboarding.employee,
        dynamicFields
      }
    });
  } catch (error) {
    logger.error('Get onboarding form error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch onboarding form' });
  }
};

/**
 * Submit onboarding step
 */
exports.submitOnboardingStep = async (req, res) => {
  try {
    const { token } = req.params;
    const { step, data } = req.body;

    const onboarding = await EmployeeOnboarding.findOne({
      where: { inviteToken: token },
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Invalid onboarding link' });
    }

    if (new Date() > new Date(onboarding.inviteExpiresAt)) {
      return res.status(400).json({ success: false, message: 'Onboarding link has expired' });
    }

    const employee = onboarding.employee;

    // Update based on step
    switch (step) {
      case 'personal_info':
        await employee.update({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          address: data.address
        });
        onboarding.personalInfoCompleted = true;
        onboarding.currentStep = Math.max(onboarding.currentStep, 1);
        break;

      case 'employment_details':
        await employee.update({
          designation: data.designation,
          designationId: data.designationId,
          department: data.department,
          departmentId: data.departmentId,
          branch: data.branch,
          branchId: data.branchId,
          dateOfJoining: data.dateOfJoining
        });
        onboarding.employmentDetailsCompleted = true;
        onboarding.currentStep = Math.max(onboarding.currentStep, 2);
        break;

      case 'documents':
        // Documents are handled separately via upload endpoint
        onboarding.documentsCompleted = true;
        onboarding.currentStep = Math.max(onboarding.currentStep, 3);
        break;

      case 'bank_details':
        await employee.update({
          bankAccountNumber: data.bankAccountNumber,
          bankIfsc: data.bankIfsc,
          bankName: data.bankName
        });
        onboarding.bankDetailsCompleted = true;
        onboarding.currentStep = Math.max(onboarding.currentStep, 4);
        break;

      case 'statutory':
        await employee.update({
          pan: data.pan,
          aadhaar: data.aadhaar,
          uan: data.uan,
          passport: data.passport
        });
        onboarding.statutoryCompleted = true;
        onboarding.currentStep = Math.max(onboarding.currentStep, 5);
        break;

      case 'extra_fields':
        await employee.update({
          extraFields: data.extraFields || {}
        });
        onboarding.extraFieldsCompleted = true;
        onboarding.currentStep = Math.max(onboarding.currentStep, 6);
        break;

      case 'signature':
        await employee.update({
          digitalSignature: data.signature,
          signatureDate: new Date()
        });
        onboarding.digitalSignature = data.signature;
        onboarding.signatureDate = new Date();
        break;
    }

    // Update completed steps
    if (!onboarding.completedSteps.includes(step)) {
      onboarding.completedSteps.push(step);
    }

    // Check if all steps completed
    const allCompleted = onboarding.personalInfoCompleted &&
      onboarding.employmentDetailsCompleted &&
      onboarding.documentsCompleted &&
      onboarding.bankDetailsCompleted &&
      onboarding.statutoryCompleted &&
      onboarding.extraFieldsCompleted &&
      onboarding.digitalSignature;

    if (allCompleted && onboarding.status !== 'completed') {
      onboarding.status = 'completed';
      onboarding.completedAt = new Date();
      onboarding.inviteAcceptedAt = new Date();
      employee.kycStatus = 'in_progress';
      await employee.save();
    } else if (onboarding.status === 'invited') {
      onboarding.status = 'in_progress';
    }

    await onboarding.save();

    res.json({
      success: true,
      data: onboarding,
      message: 'Step completed successfully'
    });
  } catch (error) {
    logger.error('Submit onboarding step error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit onboarding step' });
  }
};

/**
 * Get onboarding status (for admin)
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const onboarding = await EmployeeOnboarding.findOne({
      where: { employeeId },
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found' });
    }

    res.json({ success: true, data: onboarding });
  } catch (error) {
    logger.error('Get onboarding status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch onboarding status' });
  }
};



