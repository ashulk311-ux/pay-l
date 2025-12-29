const {
  Reimbursement,
  ReimbursementCategory,
  ReimbursementPolicy,
  ReimbursementWorkflow,
  ReimbursementWorkflowConfig,
  Employee,
  User,
  Role
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const path = require('path');
const fs = require('fs');

/**
 * Validate reimbursement against policies
 */
async function validateReimbursementPolicy(employeeId, categoryId, amount, date) {
  const employee = await Employee.findByPk(employeeId);

  if (!employee) {
    throw new Error('Employee not found');
  }

  const policies = await ReimbursementPolicy.findAll({
    where: {
      categoryId,
      isActive: true,
      [Op.or]: [
        { applicableTo: 'all' },
        {
          applicableTo: 'department',
          applicableIds: { [Op.contains]: [employee.departmentId] }
        },
        {
          applicableTo: 'designation',
          applicableIds: { [Op.contains]: [employee.designationId] }
        },
        {
          applicableTo: 'employee',
          applicableIds: { [Op.contains]: [employeeId] }
        }
      ]
    }
  });

  const errors = [];

  for (const policy of policies) {
    // Check per request limit
    if (policy.maxAmountPerRequest && amount > policy.maxAmountPerRequest) {
      errors.push(`Amount exceeds maximum per request limit of ₹${policy.maxAmountPerRequest}`);
    }

    // Check monthly limit
    if (policy.maxAmountPerMonth) {
      const monthStart = new Date(date);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthlyTotal = await Reimbursement.sum('amount', {
        where: {
          employeeId,
          categoryId,
          date: { [Op.between]: [monthStart, monthEnd] },
          status: { [Op.in]: ['pending', 'approved', 'paid'] }
        }
      });

      if ((monthlyTotal || 0) + amount > policy.maxAmountPerMonth) {
        errors.push(`Amount exceeds monthly limit of ₹${policy.maxAmountPerMonth}`);
      }
    }

    // Check yearly limit
    if (policy.maxAmountPerYear) {
      const yearStart = new Date(date);
      yearStart.setMonth(0, 1);
      yearStart.setHours(0, 0, 0, 0);
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);

      const yearlyTotal = await Reimbursement.sum('amount', {
        where: {
          employeeId,
          categoryId,
          date: { [Op.between]: [yearStart, yearEnd] },
          status: { [Op.in]: ['pending', 'approved', 'paid'] }
        }
      });

      if ((yearlyTotal || 0) + amount > policy.maxAmountPerYear) {
        errors.push(`Amount exceeds yearly limit of ₹${policy.maxAmountPerYear}`);
      }
    }

    // Check monthly request count
    if (policy.maxRequestsPerMonth) {
      const monthStart = new Date(date);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthlyCount = await Reimbursement.count({
        where: {
          employeeId,
          categoryId,
          date: { [Op.between]: [monthStart, monthEnd] },
          status: { [Op.in]: ['pending', 'approved', 'paid'] }
        }
      });

      if (monthlyCount >= policy.maxRequestsPerMonth) {
        errors.push(`Monthly request limit of ${policy.maxRequestsPerMonth} reached`);
      }
    }

    // Check yearly request count
    if (policy.maxRequestsPerYear) {
      const yearStart = new Date(date);
      yearStart.setMonth(0, 1);
      yearStart.setHours(0, 0, 0, 0);
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);

      const yearlyCount = await Reimbursement.count({
        where: {
          employeeId,
          categoryId,
          date: { [Op.between]: [yearStart, yearEnd] },
          status: { [Op.in]: ['pending', 'approved', 'paid'] }
        }
      });

      if (yearlyCount >= policy.maxRequestsPerYear) {
        errors.push(`Yearly request limit of ${policy.maxRequestsPerYear} reached`);
      }
    }
  }

  return errors;
}

/**
 * Create workflow for reimbursement
 */
async function createWorkflow(reimbursementId, categoryId, amount, companyId) {
  const configs = await ReimbursementWorkflowConfig.findAll({
    where: {
      companyId,
      [Op.or]: [
        { categoryId: null },
        { categoryId }
      ],
      isActive: true,
      [Op.or]: [
        { minAmount: null },
        { minAmount: { [Op.lte]: amount } }
      ],
      [Op.or]: [
        { maxAmount: null },
        { maxAmount: { [Op.gte]: amount } }
      ]
    },
    order: [['level', 'ASC']]
  });

  if (configs.length === 0) {
    // Default single-level approval
    return 1;
  }

  const workflows = [];
  for (const config of configs) {
    let approverId = null;

    if (config.approverType === 'user' && config.approverId) {
      approverId = config.approverId;
    } else if (config.approverType === 'role' && config.roleId) {
      const user = await User.findOne({
        where: { roleId: config.roleId, companyId },
        order: [['createdAt', 'ASC']]
      });
      if (user) approverId = user.id;
    } else if (config.approverType === 'department_head') {
      const reimbursement = await Reimbursement.findByPk(reimbursementId, {
        include: [{ model: Employee, as: 'employee' }]
      });
      if (reimbursement?.employee?.departmentId) {
        const deptHead = await User.findOne({
          where: {
            companyId,
            roleId: { [Op.in]: await Role.findAll({ where: { name: { [Op.like]: '%Manager%' } }, attributes: ['id'] }).then(r => r.map(r => r.id)) }
          }
        });
        if (deptHead) approverId = deptHead.id;
      }
    } else if (config.approverType === 'hr') {
      const hrUser = await User.findOne({
        where: { companyId },
        include: [{ model: Role, as: 'role', where: { name: { [Op.like]: '%HR%' } } }]
      });
      if (hrUser) approverId = hrUser.id;
    } else if (config.approverType === 'finance') {
      const financeUser = await User.findOne({
        where: { companyId },
        include: [{ model: Role, as: 'role', where: { name: { [Op.like]: '%Finance%' } } }]
      });
      if (financeUser) approverId = financeUser.id;
    }

    if (approverId) {
      workflows.push({
        reimbursementId,
        level: config.level,
        approverId,
        status: 'pending',
        isCurrentLevel: config.level === 1
      });
    }
  }

  if (workflows.length > 0) {
    await ReimbursementWorkflow.bulkCreate(workflows);
    return workflows.length;
  }

  return 1;
}

/**
 * Get all reimbursements with filters
 */
exports.getAllReimbursements = async (req, res) => {
  try {
    const { status, categoryId, employeeId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const employees = await Employee.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      attributes: ['id']
    });

    const whereClause = {
      employeeId: { [Op.in]: employees.map(e => e.id) }
    };
    if (status) whereClause.status = status;
    if (categoryId) whereClause.categoryId = categoryId;
    if (employeeId) whereClause.employeeId = employeeId;

    const { count, rows } = await Reimbursement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName']
        },
        {
          model: ReimbursementCategory,
          as: 'categoryRef',
          attributes: ['id', 'code', 'name', 'isTaxable']
        }
      ],
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
    logger.error('Get reimbursements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reimbursements', error: error.message });
  }
};

/**
 * Get single reimbursement
 */
exports.getReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: ReimbursementCategory,
          as: 'categoryRef'
        },
        {
          model: ReimbursementWorkflow,
          as: 'workflows',
          include: [
            {
              model: User,
              as: 'approver',
              attributes: ['id', 'email', 'firstName', 'lastName']
            }
          ],
          order: [['level', 'ASC']]
        }
      ]
    });

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    const employee = await Employee.findByPk(reimbursement.employeeId);
    if (employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: reimbursement });
  } catch (error) {
    logger.error('Get reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reimbursement', error: error.message });
  }
};

/**
 * Create reimbursement
 */
exports.createReimbursement = async (req, res) => {
  try {
    const { employeeId, categoryId, amount, date, description, documents } = req.body;

    if (!employeeId || !categoryId || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const category = await ReimbursementCategory.findByPk(categoryId);
    if (!category || category.companyId !== req.user.companyId || !category.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid reimbursement category' });
    }

    // Validate against policies
    const policyErrors = await validateReimbursementPolicy(employeeId, categoryId, parseFloat(amount), date);
    if (policyErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Policy validation failed',
        errors: policyErrors
      });
    }

    // Handle file uploads
    let documentPaths = [];
    if (req.files && req.files.length > 0) {
      documentPaths = req.files.map(file => `/uploads/reimbursements/${file.filename}`);
    } else if (documents && Array.isArray(documents)) {
      documentPaths = documents;
    }

    if (category.requiresDocument && documentPaths.length === 0) {
      return res.status(400).json({ success: false, message: 'Documents are required for this category' });
    }

    const reimbursement = await Reimbursement.create({
      employeeId,
      categoryId,
      category: category.name, // Keep for backward compatibility
      amount: parseFloat(amount),
      date: new Date(date),
      description,
      documents: documentPaths,
      isTaxable: category.isTaxable,
      status: 'pending',
      currentLevel: 1
    });

    // Create workflow
    const totalLevels = await createWorkflow(reimbursement.id, categoryId, parseFloat(amount), req.user.companyId);
    await reimbursement.update({ totalLevels });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: `Created reimbursement of ₹${amount} for ${category.name}`
    });

    res.status(201).json({
      success: true,
      message: 'Reimbursement created successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Create reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to create reimbursement', error: error.message });
  }
};

/**
 * Approve reimbursement (workflow level)
 */
exports.approveReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const reimbursement = await Reimbursement.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        {
          model: ReimbursementWorkflow,
          as: 'workflows',
          where: { approverId: req.user.id, status: 'pending', isCurrentLevel: true },
          required: false
        }
      ]
    });

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentWorkflow = reimbursement.workflows?.[0];
    if (!currentWorkflow) {
      return res.status(400).json({ success: false, message: 'No pending approval found for you' });
    }

    // Update current workflow level
    await currentWorkflow.update({
      status: 'approved',
      remarks: remarks || '',
      approvedAt: new Date()
    });

    // Check if this is the last level
    if (reimbursement.currentLevel >= reimbursement.totalLevels) {
      await reimbursement.update({
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
    } else {
      // Move to next level
      const nextLevel = reimbursement.currentLevel + 1;
      await ReimbursementWorkflow.update(
        { isCurrentLevel: false },
        { where: { reimbursementId: id, level: reimbursement.currentLevel } }
      );
      await ReimbursementWorkflow.update(
        { isCurrentLevel: true },
        { where: { reimbursementId: id, level: nextLevel } }
      );
      await reimbursement.update({ currentLevel: nextLevel });
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'approve',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: `Approved reimbursement at level ${currentWorkflow.level}`
    });

    res.json({
      success: true,
      message: 'Reimbursement approved successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Approve reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve reimbursement', error: error.message });
  }
};

/**
 * Reject reimbursement
 */
exports.rejectReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const reimbursement = await Reimbursement.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        {
          model: ReimbursementWorkflow,
          as: 'workflows',
          where: { approverId: req.user.id, status: 'pending', isCurrentLevel: true },
          required: false
        }
      ]
    });

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentWorkflow = reimbursement.workflows?.[0];
    if (!currentWorkflow) {
      return res.status(400).json({ success: false, message: 'No pending approval found for you' });
    }

    // Update current workflow level
    await currentWorkflow.update({
      status: 'rejected',
      remarks: rejectionReason || '',
      approvedAt: new Date()
    });

    // Reject all remaining workflows
    await ReimbursementWorkflow.update(
      { status: 'rejected' },
      { where: { reimbursementId: id, status: 'pending' } }
    );

    await reimbursement.update({
      status: 'rejected',
      rejectedBy: req.user.id,
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || ''
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'reject',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: `Rejected reimbursement: ${rejectionReason}`
    });

    res.json({
      success: true,
      message: 'Reimbursement rejected successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Reject reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject reimbursement', error: error.message });
  }
};

/**
 * Get employee reimbursements
 */
exports.getEmployeeReimbursements = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const whereClause = { employeeId };
    if (status) whereClause.status = status;

    const reimbursements = await Reimbursement.findAll({
      where: whereClause,
      include: [
        {
          model: ReimbursementCategory,
          as: 'categoryRef'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: reimbursements
    });
  } catch (error) {
    logger.error('Get employee reimbursements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee reimbursements', error: error.message });
  }
};

/**
 * Update reimbursement
 */
exports.updateReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (reimbursement.status === 'paid' || reimbursement.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot update approved/paid reimbursement' });
    }

    await reimbursement.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: 'Updated reimbursement details'
    });

    res.json({
      success: true,
      message: 'Reimbursement updated successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Update reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update reimbursement', error: error.message });
  }
};
