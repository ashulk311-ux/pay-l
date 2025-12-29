const { SalaryStructure, Employee, SalaryHeadMapping } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get salary structure for an employee
 */
exports.getSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findByPk(employeeId);

    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const structure = await SalaryStructure.findOne({
      where: { employeeId, isActive: true },
      order: [['effectiveDate', 'DESC']]
    });

    // Get salary head mappings for the company
    const salaryHeads = await SalaryHeadMapping.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      order: [['category', 'ASC'], ['displayOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        structure: structure || null,
        salaryHeads
      }
    });
  } catch (error) {
    logger.error('Get salary structure error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch salary structure' });
  }
};

/**
 * Create or update salary structure
 */
exports.createSalaryStructure = async (req, res) => {
  try {
    const { employeeId, effectiveDate, salaryHeads, fixedHeads, variableHeads, deductions } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Deactivate existing structure
    await SalaryStructure.update(
      { isActive: false },
      { where: { employeeId, isActive: true } }
    );

    // Calculate totals
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDeductions = 0;

    Object.values(fixedHeads || {}).forEach(amount => {
      totalFixed += parseFloat(amount || 0);
    });

    Object.values(variableHeads || {}).forEach(amount => {
      totalVariable += parseFloat(amount || 0);
    });

    Object.values(deductions || {}).forEach(amount => {
      totalDeductions += parseFloat(amount || 0);
    });

    const grossSalary = totalFixed + totalVariable;
    const netSalary = grossSalary - totalDeductions;

    // Create new structure
    const structure = await SalaryStructure.create({
      employeeId,
      effectiveDate: effectiveDate || new Date(),
      basicSalary: fixedHeads?.basicSalary || 0,
      hra: fixedHeads?.hra || 0,
      specialAllowance: fixedHeads?.specialAllowance || 0,
      otherAllowances: fixedHeads?.otherAllowances || {},
      fixedHeads: fixedHeads || {},
      variableHeads: variableHeads || {},
      deductions: deductions || {},
      salaryHeads: salaryHeads || {},
      grossSalary,
      netSalary,
      isActive: true
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'salary',
      action: 'create',
      entityType: 'SalaryStructure',
      entityId: structure.id,
      description: `Salary structure created for employee ${employee.employeeCode}`
    });

    res.status(201).json({ success: true, data: structure });
  } catch (error) {
    logger.error('Create salary structure error:', error);
    res.status(500).json({ success: false, message: 'Failed to create salary structure' });
  }
};

/**
 * Update salary structure
 */
exports.updateSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const structure = await SalaryStructure.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!structure || structure.employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Salary structure not found' });
    }

    const { fixedHeads, variableHeads, deductions, salaryHeads } = req.body;

    // Calculate totals
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDeductions = 0;

    Object.values(fixedHeads || structure.fixedHeads || {}).forEach(amount => {
      totalFixed += parseFloat(amount || 0);
    });

    Object.values(variableHeads || structure.variableHeads || {}).forEach(amount => {
      totalVariable += parseFloat(amount || 0);
    });

    Object.values(deductions || structure.deductions || {}).forEach(amount => {
      totalDeductions += parseFloat(amount || 0);
    });

    const grossSalary = totalFixed + totalVariable;
    const netSalary = grossSalary - totalDeductions;

    await structure.update({
      fixedHeads: fixedHeads || structure.fixedHeads,
      variableHeads: variableHeads || structure.variableHeads,
      deductions: deductions || structure.deductions,
      salaryHeads: salaryHeads || structure.salaryHeads,
      grossSalary,
      netSalary
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'salary',
      action: 'update',
      entityType: 'SalaryStructure',
      entityId: structure.id
    });

    res.json({ success: true, data: structure });
  } catch (error) {
    logger.error('Update salary structure error:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary structure' });
  }
};
