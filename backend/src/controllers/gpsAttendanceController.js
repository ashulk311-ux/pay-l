const { Attendance, Employee, OfficeLocation } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const geofencingService = require('../services/geofencingService');

/**
 * Check-in with GPS location (Mobile App)
 */
exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, deviceInfo } = req.body;
    const employeeId = req.user.employeeId || req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'GPS coordinates are required' });
    }

    // Get employee
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Verify location
    const locationVerification = await geofencingService.verifyLocation(
      employee.companyId,
      latitude,
      longitude,
      employee.branchId
    );

    if (!locationVerification.valid) {
      return res.status(400).json({
        success: false,
        message: locationVerification.error || 'Location verification failed',
        data: {
          verified: false,
          distance: locationVerification.distance,
          nearestLocation: locationVerification.location,
          address: locationVerification.address
        }
      });
    }

    // Get today's date
    const today = new Date();
    const dateOnly = today.toISOString().split('T')[0];
    const timeOnly = today.toTimeString().split(' ')[0].substring(0, 5);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      where: {
        employeeId,
        date: dateOnly
      }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-in already recorded for today'
      });
    }

    // Create or update attendance
    if (attendance) {
      attendance.checkIn = timeOnly;
      attendance.status = 'present';
      attendance.checkInLatitude = latitude;
      attendance.checkInLongitude = longitude;
      attendance.checkInAddress = locationVerification.address;
      attendance.checkInDistance = locationVerification.distance;
      attendance.officeLocationId = locationVerification.location.id;
      attendance.isGPSVerified = true;
      attendance.deviceInfo = deviceInfo || {};
      attendance.isManual = false;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        employeeId,
        date: dateOnly,
        status: 'present',
        checkIn: timeOnly,
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInAddress: locationVerification.address,
        checkInDistance: locationVerification.distance,
        officeLocationId: locationVerification.location.id,
        isGPSVerified: true,
        deviceInfo: deviceInfo || {},
        isManual: false
      });
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: employee.companyId,
      module: 'attendance',
      action: 'create',
      entityType: 'Attendance',
      entityId: attendance.id,
      description: `GPS check-in recorded for ${employee.employeeCode} at ${locationVerification.address}`
    });

    res.json({
      success: true,
      message: 'Check-in recorded successfully',
      data: {
        attendance: {
          id: attendance.id,
          date: attendance.date,
          checkIn: attendance.checkIn,
          status: attendance.status
        },
        location: {
          verified: true,
          distance: locationVerification.distance,
          address: locationVerification.address,
          officeLocation: locationVerification.location.name
        }
      }
    });
  } catch (error) {
    logger.error('GPS check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to record check-in', error: error.message });
  }
};

/**
 * Check-out with GPS location (Mobile App)
 */
exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude, deviceInfo } = req.body;
    const employeeId = req.user.employeeId || req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'GPS coordinates are required' });
    }

    // Get employee
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Verify location (optional for check-out, but recommended)
    const locationVerification = await geofencingService.verifyLocation(
      employee.companyId,
      latitude,
      longitude,
      employee.branchId
    );

    // Get today's date
    const today = new Date();
    const dateOnly = today.toISOString().split('T')[0];
    const timeOnly = today.toTimeString().split(' ')[0].substring(0, 5);

    // Find today's attendance
    let attendance = await Attendance.findOne({
      where: {
        employeeId,
        date: dateOnly
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in found for today. Please check-in first.'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-out already recorded for today'
      });
    }

    // Update attendance with check-out
    attendance.checkOut = timeOnly;
    attendance.checkOutLatitude = latitude;
    attendance.checkOutLongitude = longitude;
    attendance.checkOutAddress = locationVerification.address || null;
    attendance.checkOutDistance = locationVerification.distance || null;
    attendance.deviceInfo = { ...attendance.deviceInfo, ...(deviceInfo || {}) };

    // Calculate hours worked
    if (attendance.checkIn) {
      const checkInTime = new Date(`${dateOnly}T${attendance.checkIn}`);
      const checkOutTime = new Date(`${dateOnly}T${timeOnly}`);
      const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      attendance.hoursWorked = hours.toFixed(2);
    }

    await attendance.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: employee.companyId,
      module: 'attendance',
      action: 'update',
      entityType: 'Attendance',
      entityId: attendance.id,
      description: `GPS check-out recorded for ${employee.employeeCode}`
    });

    res.json({
      success: true,
      message: 'Check-out recorded successfully',
      data: {
        attendance: {
          id: attendance.id,
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          hoursWorked: attendance.hoursWorked
        },
        location: locationVerification.valid ? {
          verified: true,
          distance: locationVerification.distance,
          address: locationVerification.address
        } : {
          verified: false,
          distance: locationVerification.distance,
          address: locationVerification.address
        }
      }
    });
  } catch (error) {
    logger.error('GPS check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to record check-out', error: error.message });
  }
};

/**
 * Get today's attendance status (Mobile App)
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.query.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      where: {
        employeeId,
        date: today
      },
      include: [
        {
          model: OfficeLocation,
          as: 'officeLocation',
          attributes: ['id', 'locationName', 'address', 'latitude', 'longitude']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        date: today,
        attendance: attendance || null,
        status: attendance ? {
          checkedIn: !!attendance.checkIn,
          checkedOut: !!attendance.checkOut,
          canCheckIn: !attendance?.checkIn,
          canCheckOut: !!attendance?.checkIn && !attendance?.checkOut
        } : {
          checkedIn: false,
          checkedOut: false,
          canCheckIn: true,
          canCheckOut: false
        }
      }
    });
  } catch (error) {
    logger.error('Get today attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

/**
 * Verify GPS location before check-in/out (Mobile App)
 */
exports.verifyLocation = async (req, res) => {
  try {
    const { latitude, longitude, branchId } = req.body;
    const employeeId = req.user.employeeId || req.body.employeeId;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'GPS coordinates are required' });
    }

    // Get employee to get company ID
    let companyId = req.user.companyId;
    if (employeeId) {
      const employee = await Employee.findByPk(employeeId);
      if (employee) {
        companyId = employee.companyId;
      }
    }

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const verification = await geofencingService.verifyLocation(
      companyId,
      latitude,
      longitude,
      branchId
    );

    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    logger.error('Verify location error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify location', error: error.message });
  }
};

/**
 * Get office locations for employee (Mobile App)
 */
exports.getOfficeLocations = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.query.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const whereClause = {
      companyId: employee.companyId,
      isActive: true
    };

    if (employee.branchId) {
      whereClause[Op.or] = [
        { branchId: employee.branchId },
        { branchId: null }
      ];
    }

    const locations = await OfficeLocation.findAll({
      where: whereClause,
      order: [['isDefault', 'DESC'], ['locationName', 'ASC']]
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Get office locations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch office locations', error: error.message });
  }
};



