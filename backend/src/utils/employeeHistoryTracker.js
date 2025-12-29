const { EmployeeHistory } = require('../models');
const logger = require('./logger');

/**
 * Track employee field changes
 */
async function trackEmployeeChange(employeeId, changeType, fieldName, oldValue, newValue, changedBy, changeReason = null, effectiveDate = null, oldValueId = null, newValueId = null) {
  try {
    await EmployeeHistory.create({
      employeeId,
      changeType,
      fieldName,
      oldValue: oldValue ? String(oldValue) : null,
      newValue: newValue ? String(newValue) : null,
      oldValueId,
      newValueId,
      changedBy,
      changeReason,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
    });
  } catch (error) {
    logger.error('Error tracking employee change:', error);
    // Don't throw - history tracking should not break main operations
  }
}

/**
 * Track designation change
 */
async function trackDesignationChange(employeeId, oldDesignationId, newDesignationId, oldDesignationName, newDesignationName, changedBy, reason = null) {
  return trackEmployeeChange(
    employeeId,
    'designation',
    'designationId',
    oldDesignationName,
    newDesignationName,
    changedBy,
    reason,
    null,
    oldDesignationId,
    newDesignationId
  );
}

/**
 * Track department change
 */
async function trackDepartmentChange(employeeId, oldDepartmentId, newDepartmentId, oldDepartmentName, newDepartmentName, changedBy, reason = null) {
  return trackEmployeeChange(
    employeeId,
    'department',
    'departmentId',
    oldDepartmentName,
    newDepartmentName,
    changedBy,
    reason,
    null,
    oldDepartmentId,
    newDepartmentId
  );
}

/**
 * Track salary change
 */
async function trackSalaryChange(employeeId, oldSalary, newSalary, changedBy, reason = null, effectiveDate = null) {
  return trackEmployeeChange(
    employeeId,
    'salary',
    'grossSalary',
    oldSalary,
    newSalary,
    changedBy,
    reason,
    effectiveDate
  );
}

/**
 * Track grade change
 */
async function trackGradeChange(employeeId, oldGrade, newGrade, changedBy, reason = null) {
  return trackEmployeeChange(
    employeeId,
    'grade',
    'grade',
    oldGrade,
    newGrade,
    changedBy,
    reason
  );
}

module.exports = {
  trackEmployeeChange,
  trackDesignationChange,
  trackDepartmentChange,
  trackSalaryChange,
  trackGradeChange
};



