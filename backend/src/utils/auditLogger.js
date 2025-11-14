const { AuditLog } = require('../models');

exports.createAuditLog = async (data) => {
  try {
    await AuditLog.create({
      userId: data.userId,
      companyId: data.companyId,
      module: data.module,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

