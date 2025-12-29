const { LeaveType, LeaveBalance, HolidayCalendar, LeaveEncashment, Employee, Company } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Leave Type Management
 */
exports.getAllLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      order: [['code', 'ASC']]
    });
    res.json({ success: true, data: leaveTypes });
  } catch (error) {
    logger.error('Get leave types error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave types' });
  }
};

exports.createLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'create',
      entityType: 'LeaveType',
      entityId: leaveType.id
    });
    res.status(201).json({ success: true, data: leaveType });
  } catch (error) {
    logger.error('Create leave type error:', error);
    res.status(500).json({ success: false, message: 'Failed to create leave type' });
  }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!leaveType) {
      return res.status(404).json({ success: false, message: 'Leave type not found' });
    }
    await leaveType.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'LeaveType',
      entityId: leaveType.id
    });
    res.json({ success: true, data: leaveType });
  } catch (error) {
    logger.error('Update leave type error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave type' });
  }
};

/**
 * Leave Balance Management
 */
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const where = { year: currentYear };
    if (employeeId) {
      where.employeeId = employeeId;
    } else {
      const employees = await Employee.findAll({
        where: { companyId: req.user.companyId, isActive: true },
        attributes: ['id']
      });
      where.employeeId = { [Op.in]: employees.map(e => e.id) };
    }

    const balances = await LeaveBalance.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'code', 'name'] }
      ],
      order: [['employeeId', 'ASC'], ['leaveTypeId', 'ASC']]
    });

    res.json({ success: true, data: balances });
  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave balance' });
  }
};

exports.updateLeaveBalance = async (req, res) => {
  try {
    const { employeeId, leaveTypeId, year, allocated, openingBalance } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const [balance, created] = await LeaveBalance.findOrCreate({
      where: { employeeId, leaveTypeId, year },
      defaults: {
        employeeId,
        leaveTypeId,
        year: year || new Date().getFullYear(),
        allocated: allocated || 0,
        openingBalance: openingBalance || 0,
        balance: (openingBalance || 0) + (allocated || 0)
      }
    });

    if (!created) {
      const newAllocated = allocated !== undefined ? allocated : balance.allocated;
      const newOpening = openingBalance !== undefined ? openingBalance : balance.openingBalance;
      balance.allocated = newAllocated;
      balance.openingBalance = newOpening;
      balance.balance = newOpening + newAllocated - balance.used;
      await balance.save();
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: created ? 'create' : 'update',
      entityType: 'LeaveBalance',
      entityId: balance.id
    });

    res.json({ success: true, data: balance });
  } catch (error) {
    logger.error('Update leave balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave balance' });
  }
};

/**
 * Holiday Calendar Management
 */
exports.getAllHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const holidays = await HolidayCalendar.findAll({
      where: {
        companyId: req.user.companyId,
        year: currentYear,
        isActive: true
      },
      order: [['date', 'ASC']]
    });

    res.json({ success: true, data: holidays });
  } catch (error) {
    logger.error('Get holidays error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch holidays' });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const holiday = await HolidayCalendar.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'create',
      entityType: 'HolidayCalendar',
      entityId: holiday.id
    });
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    logger.error('Create holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to create holiday' });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await HolidayCalendar.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    await holiday.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'HolidayCalendar',
      entityId: holiday.id
    });
    res.json({ success: true, data: holiday });
  } catch (error) {
    logger.error('Update holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to update holiday' });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await HolidayCalendar.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    holiday.isActive = false;
    await holiday.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'delete',
      entityType: 'HolidayCalendar',
      entityId: holiday.id
    });
    res.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    logger.error('Delete holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete holiday' });
  }
};

/**
 * Leave Encashment Rules
 */
exports.getEncashmentRules = async (req, res) => {
  try {
    const rules = await LeaveEncashment.findAll({
      where: { companyId: req.user.companyId },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['id', 'code', 'name'] }]
    });
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error('Get encashment rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch encashment rules' });
  }
};

exports.createEncashmentRule = async (req, res) => {
  try {
    const rule = await LeaveEncashment.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'create',
      entityType: 'LeaveEncashment',
      entityId: rule.id
    });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    logger.error('Create encashment rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to create encashment rule' });
  }
};

exports.updateEncashmentRule = async (req, res) => {
  try {
    const rule = await LeaveEncashment.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Encashment rule not found' });
    }
    await rule.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'LeaveEncashment',
      entityId: rule.id
    });
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error('Update encashment rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update encashment rule' });
  }
};



