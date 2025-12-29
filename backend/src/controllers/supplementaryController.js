const { SupplementarySalary, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const XLSX = require('xlsx');

/**
 * Get all supplementary salaries
 */
exports.getAllSupplementary = async (req, res) => {
  try {
    const { type, employeeId, month, year, isProcessed, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Validate companyId
    if (!req.user.companyId) {
      logger.error('User companyId is not set', { userId: req.user.id, email: req.user.email });
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company to view supplementary salaries'
      });
    }

    // Debug logging
    logger.info(`Get supplementary salaries - User: ${req.user.email}, companyId: ${req.user.companyId}, Type filter: ${type}`);

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
    // Only add type filter if explicitly provided and not empty string
    if (type && type !== '' && type !== 'undefined') {
      whereClause.type = type;
    }
    if (employeeId) whereClause.employeeId = employeeId;
    if (month) whereClause.month = parseInt(month);
    if (year) whereClause.year = parseInt(year);
    if (isProcessed !== undefined) whereClause.isProcessed = isProcessed === 'true';

    logger.info(`Query whereClause:`, JSON.stringify(whereClause));
    logger.info(`Employee IDs to search:`, employees.map(e => e.id));
    logger.info(`Type filter: ${type || 'none'}`);

    // Test query without include first
    const testCount = await SupplementarySalary.count({ where: whereClause });
    logger.info(`Test count (without include): ${testCount}`);

    const { count, rows } = await SupplementarySalary.findAndCountAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
        required: false  // Make it LEFT JOIN instead of INNER JOIN
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      logging: (sql) => {
        logger.info('SQL Query:', sql);
      }
    });

    logger.info(`Found ${count} supplementary salaries matching criteria`);
    if (count > 0) {
      logger.info(`Sample supplementary salary IDs:`, rows.slice(0, 3).map(r => r.id));
    } else {
      // Debug: Log why no results were found
      logger.warn(`No supplementary salaries found. Debug info:`, {
        companyId: req.user.companyId,
        employeeCount: employees.length,
        employeeIds: employees.map(e => e.id),
        whereClause: whereClause,
        typeFilter: type
      });
    }

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      // Debug info in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          companyId: req.user.companyId,
          employeeCount: employees.length,
          employeeIds: employees.map(e => e.id),
          whereClause: whereClause,
          testCountWithoutInclude: testCount,
          finalCount: count,
          typeFilter: type || 'none'
        }
      })
    });
  } catch (error) {
    logger.error('Get supplementary salaries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplementary salaries', error: error.message });
  }
};

/**
 * Get single supplementary salary
 */
exports.getSupplementary = async (req, res) => {
  try {
    const supplementary = await SupplementarySalary.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!supplementary) {
      return res.status(404).json({ success: false, message: 'Supplementary salary not found' });
    }

    const employee = await Employee.findByPk(supplementary.employeeId);
    if (employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: supplementary });
  } catch (error) {
    logger.error('Get supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplementary salary', error: error.message });
  }
};

/**
 * Create supplementary salary
 */
exports.createSupplementary = async (req, res) => {
  try {
    const {
      employeeId,
      type,
      amount,
      month,
      year,
      description,
      effectiveDate,
      arrearsFromDate,
      arrearsToDate,
      incentivePeriod,
      isTaxable,
      taxDeducted
    } = req.body;

    if (!employeeId || !type || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const supplementary = await SupplementarySalary.create({
      employeeId,
      type,
      amount: parseFloat(amount),
      month: month ? parseInt(month) : null,
      year: year ? parseInt(year) : null,
      description,
      effectiveDate: effectiveDate || null,
      arrearsFromDate: arrearsFromDate || null,
      arrearsToDate: arrearsToDate || null,
      incentivePeriod: incentivePeriod || null,
      isTaxable: isTaxable !== undefined ? isTaxable : true,
      taxDeducted: taxDeducted ? parseFloat(taxDeducted) : 0,
      isProcessed: false
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'SupplementarySalary',
      entityId: supplementary.id,
      module: 'supplementary',
      description: `Created ${type} of ₹${amount} for employee`
    });

    res.status(201).json({
      success: true,
      message: 'Supplementary salary created successfully',
      data: supplementary
    });
  } catch (error) {
    logger.error('Create supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to create supplementary salary', error: error.message });
  }
};

/**
 * Bulk import from Excel
 */
exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const row of data) {
      try {
        const employeeCode = row['Employee Code'] || row['EmployeeCode'] || row['employee_code'];
        const type = row['Type'] || row['type'];
        const amount = row['Amount'] || row['amount'];
        const month = row['Month'] || row['month'];
        const year = row['Year'] || row['year'];
        const description = row['Description'] || row['description'];
        const effectiveDate = row['Effective Date'] || row['EffectiveDate'] || row['effective_date'];
        const arrearsFromDate = row['Arrears From Date'] || row['ArrearsFromDate'];
        const arrearsToDate = row['Arrears To Date'] || row['ArrearsToDate'];
        const incentivePeriod = row['Incentive Period'] || row['IncentivePeriod'];

        if (!employeeCode || !type || !amount) {
          results.failed++;
          results.errors.push(`Row ${data.indexOf(row) + 2}: Missing required fields`);
          continue;
        }

        const employee = await Employee.findOne({
          where: {
            employeeCode,
            companyId: req.user.companyId
          }
        });

        if (!employee) {
          results.failed++;
          results.errors.push(`Row ${data.indexOf(row) + 2}: Employee not found: ${employeeCode}`);
          continue;
        }

        await SupplementarySalary.create({
          employeeId: employee.id,
          type: type.toLowerCase(),
          amount: parseFloat(amount),
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null,
          description: description || '',
          effectiveDate: effectiveDate || null,
          arrearsFromDate: arrearsFromDate || null,
          arrearsToDate: arrearsToDate || null,
          incentivePeriod: incentivePeriod || null,
          isTaxable: true,
          isProcessed: false
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'supplementary',
      action: 'bulk_import',
      description: `Bulk imported supplementary salaries: ${results.success} success, ${results.failed} failed`
    });

    res.json({
      success: true,
      message: `Import completed: ${results.success} records processed, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    logger.error('Bulk import supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to import supplementary salaries', error: error.message });
  }
};

/**
 * Bulk create supplementary salaries
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
        const { employeeId, type, amount, month, year, description, effectiveDate, arrearsFromDate, arrearsToDate, incentivePeriod } = entry;
        
        if (!employeeId || !type || !amount) {
          errors.push(`Missing required fields for entry`);
          continue;
        }

        if (!employees.find(e => e.id === employeeId)) {
          errors.push(`Employee not found: ${employeeId}`);
          continue;
        }

        const supplementary = await SupplementarySalary.create({
          employeeId,
          type,
          amount: parseFloat(amount),
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null,
          description,
          effectiveDate: effectiveDate || null,
          arrearsFromDate: arrearsFromDate || null,
          arrearsToDate: arrearsToDate || null,
          incentivePeriod: incentivePeriod || null,
          isTaxable: true,
          isProcessed: false
        });
        created.push(supplementary);
      } catch (error) {
        errors.push(`Error creating entry: ${error.message}`);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'SupplementarySalary',
      module: 'supplementary',
      description: `Bulk created ${created.length} supplementary salaries`
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} supplementary salaries`,
      data: { created, errors }
    });
  } catch (error) {
    logger.error('Bulk create supplementary salaries error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk create supplementary salaries', error: error.message });
  }
};

/**
 * Update supplementary salary
 */
exports.updateSupplementary = async (req, res) => {
  try {
    const supplementary = await SupplementarySalary.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!supplementary) {
      return res.status(404).json({ success: false, message: 'Supplementary salary not found' });
    }

    if (supplementary.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (supplementary.isProcessed) {
      return res.status(400).json({ success: false, message: 'Cannot update processed supplementary salary' });
    }

    await supplementary.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'SupplementarySalary',
      entityId: supplementary.id,
      module: 'supplementary',
      description: 'Updated supplementary salary'
    });

    res.json({
      success: true,
      message: 'Supplementary salary updated successfully',
      data: supplementary
    });
  } catch (error) {
    logger.error('Update supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to update supplementary salary', error: error.message });
  }
};

/**
 * Delete supplementary salary
 */
exports.deleteSupplementary = async (req, res) => {
  try {
    const supplementary = await SupplementarySalary.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!supplementary) {
      return res.status(404).json({ success: false, message: 'Supplementary salary not found' });
    }

    if (supplementary.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (supplementary.isProcessed) {
      return res.status(400).json({ success: false, message: 'Cannot delete processed supplementary salary' });
    }

    await supplementary.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'delete',
      entityType: 'SupplementarySalary',
      entityId: req.params.id,
      module: 'supplementary',
      description: 'Deleted supplementary salary'
    });

    res.json({
      success: true,
      message: 'Supplementary salary deleted successfully'
    });
  } catch (error) {
    logger.error('Delete supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete supplementary salary', error: error.message });
  }
};
