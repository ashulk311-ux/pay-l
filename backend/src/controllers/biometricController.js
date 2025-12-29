const {
  BiometricDevice,
  BiometricDeviceLog,
  EmployeeBiometric,
  Employee,
  Attendance,
  Company
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const crypto = require('crypto');

/**
 * Generate API key and secret for device
 */
function generateApiCredentials() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
}

/**
 * Authenticate device using API key
 */
async function authenticateDevice(apiKey) {
  const device = await BiometricDevice.findOne({
    where: { apiKey, isActive: true },
    include: [{ model: Company, as: 'company' }]
  });
  return device;
}

/**
 * Get all biometric devices
 */
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await BiometricDevice.findAll({
      where: { companyId: req.user.companyId },
      include: [
        { model: require('../models').Branch, as: 'branch', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: devices });
  } catch (error) {
    logger.error('Get biometric devices error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices', error: error.message });
  }
};

/**
 * Get single device
 */
exports.getDevice = async (req, res) => {
  try {
    const device = await BiometricDevice.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [
        { model: require('../models').Branch, as: 'branch' },
        { model: BiometricDeviceLog, as: 'logs', limit: 50, order: [['createdAt', 'DESC']] }
      ]
    });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    logger.error('Get biometric device error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device', error: error.message });
  }
};

/**
 * Register new biometric device
 */
exports.registerDevice = async (req, res) => {
  try {
    const {
      deviceName,
      deviceSerialNumber,
      deviceType,
      deviceModel,
      deviceManufacturer,
      ipAddress,
      port,
      location,
      branchId,
      syncMode,
      syncInterval,
      configuration
    } = req.body;

    if (!deviceName || !deviceSerialNumber || !deviceType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if serial number already exists
    const existing = await BiometricDevice.findOne({
      where: { deviceSerialNumber }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Device with this serial number already registered' });
    }

    const { apiKey, apiSecret } = generateApiCredentials();

    const device = await BiometricDevice.create({
      companyId: req.user.companyId,
      deviceName,
      deviceSerialNumber,
      deviceType,
      deviceModel,
      deviceManufacturer,
      ipAddress,
      port: port || 80,
      location,
      branchId,
      apiKey,
      apiSecret,
      syncMode: syncMode || 'push',
      syncInterval: syncInterval || 5,
      configuration: configuration || {},
      isActive: true
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: 'create',
      entityType: 'BiometricDevice',
      entityId: device.id,
      description: `Registered biometric device: ${deviceName} (${deviceSerialNumber})`
    });

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: {
        ...device.toJSON(),
        apiSecret // Only show secret once during registration
      }
    });
  } catch (error) {
    logger.error('Register biometric device error:', error);
    res.status(500).json({ success: false, message: 'Failed to register device', error: error.message });
  }
};

/**
 * Update device configuration
 */
exports.updateDevice = async (req, res) => {
  try {
    const device = await BiometricDevice.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await device.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: 'update',
      entityType: 'BiometricDevice',
      entityId: device.id,
      description: 'Updated biometric device configuration'
    });

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: device
    });
  } catch (error) {
    logger.error('Update biometric device error:', error);
    res.status(500).json({ success: false, message: 'Failed to update device', error: error.message });
  }
};

/**
 * Delete device
 */
exports.deleteDevice = async (req, res) => {
  try {
    const device = await BiometricDevice.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await device.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: 'delete',
      entityType: 'BiometricDevice',
      entityId: req.params.id,
      description: 'Deleted biometric device'
    });

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    logger.error('Delete biometric device error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete device', error: error.message });
  }
};

/**
 * Regenerate API credentials
 */
exports.regenerateCredentials = async (req, res) => {
  try {
    const device = await BiometricDevice.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const { apiKey, apiSecret } = generateApiCredentials();

    await device.update({ apiKey, apiSecret });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: 'update',
      entityType: 'BiometricDevice',
      entityId: device.id,
      description: 'Regenerated API credentials'
    });

    res.json({
      success: true,
      message: 'API credentials regenerated successfully',
      data: {
        apiKey,
        apiSecret // Only show secret once during regeneration
      }
    });
  } catch (error) {
    logger.error('Regenerate credentials error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate credentials', error: error.message });
  }
};

/**
 * Map employee to biometric device
 */
exports.mapEmployee = async (req, res) => {
  try {
    const { employeeId, deviceId, biometricId, biometricType, templateData } = req.body;

    if (!employeeId || !deviceId || !biometricId || !biometricType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employee = await Employee.findOne({
      where: { id: employeeId, companyId: req.user.companyId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const device = await BiometricDevice.findOne({
      where: { id: deviceId, companyId: req.user.companyId }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const [mapping, created] = await EmployeeBiometric.findOrCreate({
      where: {
        employeeId,
        deviceId,
        biometricId
      },
      defaults: {
        employeeId,
        deviceId,
        biometricId,
        biometricType,
        templateData: templateData || null,
        isActive: true,
        enrolledAt: new Date(),
        enrolledBy: req.user.id
      }
    });

    if (!created) {
      await mapping.update({
        biometricType,
        templateData: templateData || null,
        isActive: true
      });
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: created ? 'create' : 'update',
      entityType: 'EmployeeBiometric',
      entityId: mapping.id,
      description: `Mapped employee ${employee.employeeCode} to device ${device.deviceName}`
    });

    res.json({
      success: true,
      message: created ? 'Employee mapped successfully' : 'Employee mapping updated successfully',
      data: mapping
    });
  } catch (error) {
    logger.error('Map employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to map employee', error: error.message });
  }
};

/**
 * Get employee mappings for a device
 */
exports.getEmployeeMappings = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const mappings = await EmployeeBiometric.findAll({
      where: { deviceId },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] },
        { model: BiometricDevice, as: 'device', attributes: ['id', 'deviceName'] }
      ]
    });

    res.json({ success: true, data: mappings });
  } catch (error) {
    logger.error('Get employee mappings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mappings', error: error.message });
  }
};

/**
 * Remove employee mapping
 */
exports.removeEmployeeMapping = async (req, res) => {
  try {
    const { id } = req.params;

    const mapping = await EmployeeBiometric.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: BiometricDevice, as: 'device' }
      ]
    });

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found' });
    }

    const device = await BiometricDevice.findByPk(mapping.deviceId);
    if (device.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await mapping.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: 'delete',
      entityType: 'EmployeeBiometric',
      entityId: id,
      description: 'Removed employee biometric mapping'
    });

    res.json({
      success: true,
      message: 'Employee mapping removed successfully'
    });
  } catch (error) {
    logger.error('Remove employee mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove mapping', error: error.message });
  }
};

/**
 * Device heartbeat (called by device to indicate it's online)
 */
exports.deviceHeartbeat = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required' });
    }

    const device = await authenticateDevice(apiKey);
    if (!device) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    await device.update({
      isOnline: true,
      lastHeartbeat: new Date()
    });

    // Log heartbeat
    await BiometricDeviceLog.create({
      deviceId: device.id,
      logType: 'heartbeat',
      status: 'success',
      startTime: new Date()
    });

    res.json({
      success: true,
      message: 'Heartbeat received',
      data: {
        deviceId: device.id,
        syncMode: device.syncMode,
        syncInterval: device.syncInterval,
        configuration: device.configuration
      }
    });
  } catch (error) {
    logger.error('Device heartbeat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process heartbeat', error: error.message });
  }
};

/**
 * Push attendance data from device (called by biometric device)
 */
exports.pushAttendance = async (req, res) => {
  try {
    const { apiKey, attendanceData } = req.body;

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required' });
    }

    const device = await authenticateDevice(apiKey);
    if (!device) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    if (!device.isActive) {
      return res.status(403).json({ success: false, message: 'Device is not active' });
    }

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ success: false, message: 'Attendance data array is required' });
    }

    const startTime = new Date();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Get all employee mappings for this device
    const mappings = await EmployeeBiometric.findAll({
      where: { deviceId: device.id, isActive: true },
      include: [{ model: Employee, as: 'employee' }]
    });

    const biometricIdToEmployee = {};
    mappings.forEach(mapping => {
      biometricIdToEmployee[mapping.biometricId] = mapping.employee;
    });

    for (const record of attendanceData) {
      try {
        const { biometricId, timestamp, type } = record; // type: 'checkin' or 'checkout'

        if (!biometricId || !timestamp) {
          errors.push(`Invalid record: missing biometricId or timestamp`);
          errorCount++;
          continue;
        }

        const employee = biometricIdToEmployee[biometricId];
        if (!employee) {
          errors.push(`Employee not found for biometric ID: ${biometricId}`);
          errorCount++;
          continue;
        }

        const recordDate = new Date(timestamp);
        const dateOnly = recordDate.toISOString().split('T')[0];
        const timeOnly = recordDate.toTimeString().split(' ')[0].substring(0, 5);

        // Find or create attendance record
        let attendance = await Attendance.findOne({
          where: {
            employeeId: employee.id,
            date: dateOnly
          }
        });

        if (attendance) {
          // Update existing record
          if (type === 'checkin' || !attendance.checkIn) {
            attendance.checkIn = timeOnly;
            attendance.status = 'present';
          }
          if (type === 'checkout') {
            attendance.checkOut = timeOnly;
          }
          
          // Calculate hours worked
          if (attendance.checkIn && attendance.checkOut) {
            const checkInTime = new Date(`${dateOnly}T${attendance.checkIn}`);
            const checkOutTime = new Date(`${dateOnly}T${attendance.checkOut}`);
            const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            attendance.hoursWorked = hours.toFixed(2);
          }

          attendance.biometricDeviceId = device.id;
          attendance.biometricId = biometricId;
          attendance.biometricTimestamp = recordDate;
          attendance.isBiometric = true;
          attendance.isManual = false;

          await attendance.save();
        } else {
          // Create new attendance record
          attendance = await Attendance.create({
            employeeId: employee.id,
            date: dateOnly,
            status: 'present',
            checkIn: type === 'checkin' ? timeOnly : null,
            checkOut: type === 'checkout' ? timeOnly : null,
            hoursWorked: null,
            biometricDeviceId: device.id,
            biometricId: biometricId,
            biometricTimestamp: recordDate,
            isBiometric: true,
            isManual: false
          });
        }

        successCount++;
      } catch (error) {
        errors.push(`Error processing record: ${error.message}`);
        errorCount++;
      }
    }

    const endTime = new Date();
    const duration = endTime - startTime;

    // Update device sync status
    await device.update({
      lastSyncAt: endTime,
      lastSyncStatus: errorCount === 0 ? 'success' : 'failed',
      lastSyncError: errors.length > 0 ? errors.join('; ') : null,
      totalRecordsSynced: device.totalRecordsSynced + successCount,
      isOnline: true,
      lastHeartbeat: endTime
    });

    // Log sync
    await BiometricDeviceLog.create({
      deviceId: device.id,
      logType: 'sync',
      status: errorCount === 0 ? 'success' : 'failed',
      recordsCount: successCount,
      startTime,
      endTime,
      duration,
      errorMessage: errors.length > 0 ? errors.join('; ') : null,
      requestData: { recordCount: attendanceData.length },
      responseData: { successCount, errorCount }
    });

    res.json({
      success: true,
      message: `Attendance data processed: ${successCount} successful, ${errorCount} errors`,
      data: {
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });
  } catch (error) {
    logger.error('Push attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to process attendance data', error: error.message });
  }
};

/**
 * Get device sync logs
 */
exports.getDeviceLogs = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { logType, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const device = await BiometricDevice.findOne({
      where: { id: deviceId, companyId: req.user.companyId }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const whereClause = { deviceId };
    if (logType) whereClause.logType = logType;
    if (status) whereClause.status = status;

    const { count, rows } = await BiometricDeviceLog.findAndCountAll({
      where: whereClause,
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
    logger.error('Get device logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device logs', error: error.message });
  }
};

/**
 * Manual sync trigger
 */
exports.triggerSync = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await BiometricDevice.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // This would typically trigger a pull from the device
    // For now, we'll just log the sync request
    await BiometricDeviceLog.create({
      deviceId: device.id,
      logType: 'sync',
      status: 'pending',
      startTime: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'biometric',
      action: 'update',
      entityType: 'BiometricDevice',
      entityId: device.id,
      description: 'Manual sync triggered'
    });

    res.json({
      success: true,
      message: 'Sync triggered successfully. Device will sync data on next connection.'
    });
  } catch (error) {
    logger.error('Trigger sync error:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger sync', error: error.message });
  }
};



