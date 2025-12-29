const {
  SalaryIncrement,
  Employee,
  SalaryStructure,
  IncrementWorkflow,
  IncrementPolicy,
  Designation
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Create workflow for increment approval
 */
async function createWorkflow(incrementId, companyId, amount) {
  // Simple workflow - can be enhanced with configurable workflow like reimbursements
  // For now, create a single-level approval
  const workflow = await IncrementWorkflow.create({
    incrementId,
    level: 1,
    approverId: null, // Will be assigned based on role
    status: 'pending',
    isCurrentLevel: true
  });
  return 1;
}

/**
 * Get all salary increments
 */
exports.getAllIncrements = async (req, res) => {
  try {
    const { status, employeeId, incrementType, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Validate companyId
    if (!req.user.companyId) {
      logger.error('User companyId is not set', { userId: req.user.id, email: req.user.email });
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company to view salary increments'
      });
    }

    logger.info(`Get increments - User: ${req.user.email}, companyId: ${req.user.companyId}, Status filter: ${status || 'none'}`);

    const employees = await Employee.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      attributes: ['id']
    });

    logger.info(`Found ${employees.length} active employees for company ${req.user.companyId}`);

    if (employees.length === 0) {
      logger.warn(`No active employees found for company ${req.user.companyId}`);
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }

    const whereClause = {
      employeeId: { [Op.in]: employees.map(e => e.id) }
    };
    // Only add status filter if explicitly provided
    if (status && status !== '' && status !== 'undefined') {
      whereClause.status = status;
    }
    if (employeeId) whereClause.employeeId = employeeId;
    if (incrementType) whereClause.incrementType = incrementType;

    logger.info(`Query whereClause:`, JSON.stringify(whereClause));
    logger.info(`Employee IDs to search:`, employees.map(e => e.id));

    const { count, rows } = await SalaryIncrement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
          required: false  // Make it LEFT JOIN instead of INNER JOIN
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    logger.info(`Found ${count} salary increments matching criteria`);

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
    logger.error('Get increments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch increments', error: error.message });
  }
};

/**
 * Get single increment
 */
exports.getIncrement = async (req, res) => {
  try {
    const increment = await SalaryIncrement.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: IncrementWorkflow,
          as: 'workflows',
          include: [
            {
              model: require('../models').User,
              as: 'approver',
              attributes: ['id', 'email', 'firstName', 'lastName']
            }
          ],
          order: [['level', 'ASC']]
        }
      ]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    const employee = await Employee.findByPk(increment.employeeId);
    if (employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: increment });
  } catch (error) {
    logger.error('Get increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch increment', error: error.message });
  }
};

/**
 * Create salary increment (Individual)
 */
exports.createIncrement = async (req, res) => {
  try {
    const {
      employeeId,
      effectiveDate,
      newSalary,
      reason,
      previousDesignationId,
      newDesignationId,
      previousGrade,
      newGrade,
      incrementType
    } = req.body;

    if (!employeeId || !effectiveDate || !newSalary) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get current salary structure
    const salaryStructure = await SalaryStructure.findOne({
      where: { employeeId, isActive: true }
    });

    if (!salaryStructure) {
      return res.status(404).json({ success: false, message: 'Salary structure not found for employee' });
    }

    const previousSalary = parseFloat(salaryStructure.grossSalary);
    const incrementAmount = parseFloat(newSalary) - previousSalary;
    const incrementPercentage = (incrementAmount / previousSalary) * 100;

    const increment = await SalaryIncrement.create({
      employeeId,
      effectiveDate: new Date(effectiveDate),
      previousSalary,
      newSalary: parseFloat(newSalary),
      incrementAmount,
      incrementPercentage: Math.round(incrementPercentage * 100) / 100,
      reason,
      previousDesignationId: previousDesignationId || employee.designationId,
      newDesignationId: newDesignationId || employee.designationId,
      previousGrade: previousGrade || employee.grade,
      newGrade: newGrade || employee.grade,
      incrementType: incrementType || 'individual',
      status: 'pending',
      isApplied: false,
      currentLevel: 1,
      totalLevels: 1
    });

    // Create workflow
    await createWorkflow(increment.id, req.user.companyId, incrementAmount);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: `Created salary increment of ₹${incrementAmount} (${incrementPercentage.toFixed(2)}%) for employee ${employee.employeeCode}`
    });

    res.status(201).json({
      success: true,
      message: 'Salary increment created successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Create increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create increment', error: error.message });
  }
};

/**
 * Create grade/designation-based bulk increments
 */
exports.createBulkIncrementByGrade = async (req, res) => {
  try {
    const {
      grade,
      designationId,
      effectiveDate,
      incrementPercentage,
      incrementAmount,
      reason,
      policyId
    } = req.body;

    if (!effectiveDate || (!incrementPercentage && !incrementAmount)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employees = await Employee.findAll({
      where: {
        companyId: req.user.companyId,
        isActive: true,
        ...(grade && { grade }),
        ...(designationId && { designationId })
      }
    });

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No employees found matching criteria' });
    }

    const created = [];
    const errors = [];

    for (const employee of employees) {
      try {
        const salaryStructure = await SalaryStructure.findOne({
          where: { employeeId: employee.id, isActive: true }
        });

        if (!salaryStructure) {
          errors.push(`No salary structure found for ${employee.employeeCode}`);
          continue;
        }

        const previousSalary = parseFloat(salaryStructure.grossSalary);
        let newSalary, incAmount, incPercentage;

        if (incrementPercentage) {
          incPercentage = parseFloat(incrementPercentage);
          incAmount = (previousSalary * incPercentage) / 100;
          newSalary = previousSalary + incAmount;
        } else {
          incAmount = parseFloat(incrementAmount);
          newSalary = previousSalary + incAmount;
          incPercentage = (incAmount / previousSalary) * 100;
        }

        const increment = await SalaryIncrement.create({
          employeeId: employee.id,
          effectiveDate: new Date(effectiveDate),
          previousSalary,
          newSalary,
          incrementAmount: incAmount,
          incrementPercentage: Math.round(incPercentage * 100) / 100,
          reason: reason || `Bulk increment for ${grade || 'designation'}`,
          previousDesignationId: employee.designationId,
          newDesignationId: employee.designationId,
          previousGrade: employee.grade,
          newGrade: employee.grade,
          incrementType: grade ? 'grade_based' : 'designation_based',
          policyId: policyId || null,
          status: 'pending',
          isApplied: false,
          currentLevel: 1,
          totalLevels: 1
        });

        await createWorkflow(increment.id, req.user.companyId, incAmount);
        created.push(increment);
      } catch (error) {
        errors.push(`Error creating increment for ${employee.employeeCode}: ${error.message}`);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'SalaryIncrement',
      module: 'increment',
      description: `Bulk created ${created.length} increments for ${grade || 'designation'}`
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} increments`,
      data: { created, errors }
    });
  } catch (error) {
    logger.error('Bulk create increments by grade error:', error);
    res.status(500).json({ success: false, message: 'Failed to create bulk increments', error: error.message });
  }
};

/**
 * Approve increment (workflow level)
 */
exports.approveIncrement = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const increment = await SalaryIncrement.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        {
          model: IncrementWorkflow,
          as: 'workflows',
          where: { approverId: req.user.id, status: 'pending', isCurrentLevel: true },
          required: false
        }
      ]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentWorkflow = increment.workflows?.[0];
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
    if (increment.currentLevel >= increment.totalLevels) {
      await increment.update({
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
    } else {
      // Move to next level
      const nextLevel = increment.currentLevel + 1;
      await IncrementWorkflow.update(
        { isCurrentLevel: false },
        { where: { incrementId: id, level: increment.currentLevel } }
      );
      await IncrementWorkflow.update(
        { isCurrentLevel: true },
        { where: { incrementId: id, level: nextLevel } }
      );
      await increment.update({ currentLevel: nextLevel });
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'approve',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: `Approved salary increment at level ${currentWorkflow.level} for employee ${increment.employee.employeeCode}`
    });

    res.json({
      success: true,
      message: 'Increment approved successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Approve increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve increment', error: error.message });
  }
};

/**
 * Reject increment
 */
exports.rejectIncrement = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const increment = await SalaryIncrement.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        {
          model: IncrementWorkflow,
          as: 'workflows',
          where: { approverId: req.user.id, status: 'pending', isCurrentLevel: true },
          required: false
        }
      ]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentWorkflow = increment.workflows?.[0];
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
    await IncrementWorkflow.update(
      { status: 'rejected' },
      { where: { incrementId: id, status: 'pending' } }
    );

    await increment.update({
      status: 'rejected',
      rejectedBy: req.user.id,
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || ''
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'reject',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: `Rejected salary increment: ${rejectionReason}`
    });

    res.json({
      success: true,
      message: 'Increment rejected successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Reject increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject increment', error: error.message });
  }
};

/**
 * Apply approved increment to salary structure
 */
exports.applyIncrement = async (req, res) => {
  try {
    const { id } = req.params;

    const increment = await SalaryIncrement.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (increment.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Increment must be approved before applying' });
    }

    if (increment.isApplied) {
      return res.status(400).json({ success: false, message: 'Increment already applied' });
    }

    // Check if effective date has arrived
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveDate = new Date(increment.effectiveDate);
    effectiveDate.setHours(0, 0, 0, 0);

    if (effectiveDate > today) {
      return res.status(400).json({ success: false, message: 'Effective date has not arrived yet' });
    }

    // Update salary structure
    const salaryStructure = await SalaryStructure.findOne({
      where: { employeeId: increment.employeeId, isActive: true }
    });

    if (!salaryStructure) {
      return res.status(404).json({ success: false, message: 'Salary structure not found' });
    }

    // Deactivate old structure
    await salaryStructure.update({ isActive: false });

    // Create new salary structure with incremented salary
    const newSalaryStructure = await SalaryStructure.create({
      employeeId: increment.employeeId,
      companyId: salaryStructure.companyId,
      basicSalary: (parseFloat(salaryStructure.basicSalary) * increment.newSalary) / increment.previousSalary,
      hra: (parseFloat(salaryStructure.hra || 0) * increment.newSalary) / increment.previousSalary,
      specialAllowance: (parseFloat(salaryStructure.specialAllowance || 0) * increment.newSalary) / increment.previousSalary,
      grossSalary: increment.newSalary,
      netSalary: increment.newSalary, // Will be recalculated with deductions
      isActive: true,
      effectiveFrom: increment.effectiveDate
    });

    // Update employee designation/grade if changed
    if (increment.newDesignationId && increment.newDesignationId !== increment.previousDesignationId) {
      await increment.employee.update({ designationId: increment.newDesignationId });
    }
    if (increment.newGrade && increment.newGrade !== increment.previousGrade) {
      await increment.employee.update({ grade: increment.newGrade });
    }

    // Mark increment as applied
    await increment.update({
      isApplied: true,
      appliedAt: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: `Applied salary increment to employee ${increment.employee.employeeCode}. New salary: ₹${increment.newSalary}`
    });

    res.json({
      success: true,
      message: 'Increment applied successfully',
      data: { increment, newSalaryStructure }
    });
  } catch (error) {
    logger.error('Apply increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply increment', error: error.message });
  }
};

/**
 * Update increment
 */
exports.updateIncrement = async (req, res) => {
  try {
    const increment = await SalaryIncrement.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (increment.isApplied) {
      return res.status(400).json({ success: false, message: 'Cannot update applied increment' });
    }

    if (increment.status === 'approved' || increment.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot update approved/rejected increment' });
    }

    // Recalculate if newSalary is updated
    if (req.body.newSalary) {
      const newSalary = parseFloat(req.body.newSalary);
      const incrementAmount = newSalary - parseFloat(increment.previousSalary);
      const incrementPercentage = (incrementAmount / parseFloat(increment.previousSalary)) * 100;
      req.body.incrementAmount = incrementAmount;
      req.body.incrementPercentage = Math.round(incrementPercentage * 100) / 100;
    }

    await increment.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: 'Updated increment details'
    });

    res.json({
      success: true,
      message: 'Increment updated successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Update increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update increment', error: error.message });
  }
};

/**
 * Bulk create increments
 */
exports.bulkCreate = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Entries array is required' });
    }

    const employees = await Employee.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      attributes: ['id']
    });

    const created = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const { employeeId, effectiveDate, newSalary, reason } = entry;
        
        if (!employeeId || !effectiveDate || !newSalary) {
          errors.push('Missing required fields for entry');
          continue;
        }

        if (!employees.find(e => e.id === employeeId)) {
          errors.push(`Employee not found: ${employeeId}`);
          continue;
        }

        const salaryStructure = await SalaryStructure.findOne({
          where: { employeeId, isActive: true }
        });

        if (!salaryStructure) {
          errors.push(`No salary structure found for employee ${employeeId}`);
          continue;
        }

        const previousSalary = parseFloat(salaryStructure.grossSalary);
        const incrementAmount = parseFloat(newSalary) - previousSalary;
        const incrementPercentage = (incrementAmount / previousSalary) * 100;

        const increment = await SalaryIncrement.create({
          employeeId,
          effectiveDate: new Date(effectiveDate),
          previousSalary,
          newSalary: parseFloat(newSalary),
          incrementAmount,
          incrementPercentage: Math.round(incrementPercentage * 100) / 100,
          reason,
          incrementType: 'individual',
          status: 'pending',
          isApplied: false,
          currentLevel: 1,
          totalLevels: 1
        });

        await createWorkflow(increment.id, req.user.companyId, incrementAmount);
        created.push(increment);
      } catch (error) {
        errors.push(`Error creating entry: ${error.message}`);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'SalaryIncrement',
      module: 'increment',
      description: `Bulk created ${created.length} increments`
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} increments`,
      data: { created, errors }
    });
  } catch (error) {
    logger.error('Bulk create increments error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk create increments', error: error.message });
  }
};

/**
 * Get increment audit trail
 */
exports.getIncrementAudit = async (req, res) => {
  try {
    const { incrementId } = req.params;

    const increment = await SalaryIncrement.findByPk(incrementId, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get audit logs for this increment
    const AuditLog = require('../models').AuditLog || require('../utils/auditLogger').getAuditLogs;
    
    // This would typically query an audit log table
    // For now, return workflow history
    const workflows = await IncrementWorkflow.findAll({
      where: { incrementId },
      include: [
        {
          model: require('../models').User,
          as: 'approver',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['level', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        increment,
        workflows,
        auditTrail: workflows.map(w => ({
          level: w.level,
          approver: w.approver,
          status: w.status,
          remarks: w.remarks,
          timestamp: w.approvedAt || w.createdAt
        }))
      }
    });
  } catch (error) {
    logger.error('Get increment audit error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit trail', error: error.message });
  }
};
