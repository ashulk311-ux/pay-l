const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Employee, EmployeeDocument } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/employee-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.employeeId}-${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

exports.uploadMiddleware = upload;

/**
 * Upload document for employee
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      // Delete uploaded file if employee not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if document of this type already exists
    const existingDoc = await EmployeeDocument.findOne({
      where: {
        employeeId,
        documentType,
        isActive: true
      }
    });

    if (existingDoc) {
      // Delete old file
      if (fs.existsSync(existingDoc.filePath)) {
        fs.unlinkSync(existingDoc.filePath);
      }
      // Update existing document
      existingDoc.fileName = req.file.originalname;
      existingDoc.filePath = req.file.path;
      existingDoc.fileSize = req.file.size;
      existingDoc.mimeType = req.file.mimetype;
      existingDoc.isVerified = false;
      await existingDoc.save();

      await createAuditLog({
        userId: req.user.id,
        companyId: req.user.companyId,
        module: 'employee',
        action: 'update_document',
        entityType: 'EmployeeDocument',
        entityId: existingDoc.id,
        description: `Document ${documentType} updated for employee ${employee.employeeCode}`
      });

      return res.json({ success: true, data: existingDoc, message: 'Document updated successfully' });
    }

    // Create new document record
    const document = await EmployeeDocument.create({
      employeeId,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Update employee documents JSON
    const documents = employee.documents || {};
    documents[documentType] = {
      id: document.id,
      fileName: document.fileName,
      uploadedAt: new Date()
    };
    await employee.update({ documents });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'upload_document',
      entityType: 'EmployeeDocument',
      entityId: document.id,
      description: `Document ${documentType} uploaded for employee ${employee.employeeCode}`
    });

    res.json({ success: true, data: document, message: 'Document uploaded successfully' });
  } catch (error) {
    logger.error('Upload document error:', error);
    // Delete uploaded file on error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

/**
 * Get all documents for an employee
 */
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findByPk(employeeId);

    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const documents = await EmployeeDocument.findAll({
      where: { employeeId, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    logger.error('Get employee documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * Download document
 */
exports.downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await EmployeeDocument.findByPk(documentId, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Check access
    if (document.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(document.filePath, document.fileName);
  } catch (error) {
    logger.error('Download document error:', error);
    res.status(500).json({ success: false, message: 'Failed to download document' });
  }
};

/**
 * Verify document
 */
exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { isVerified, remarks } = req.body;

    const document = await EmployeeDocument.findByPk(documentId, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    document.isVerified = isVerified;
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();
    if (remarks) {
      document.remarks = remarks;
    }

    await document.save();

    // Check if all mandatory documents are verified
    const mandatoryDocs = await EmployeeDocument.findAll({
      where: {
        employeeId: document.employeeId,
        documentType: ['AADHAAR', 'PAN', 'PHOTO', 'ADDRESS_PROOF', 'BANK_DETAILS'],
        isActive: true
      }
    });

    const allVerified = mandatoryDocs.every(doc => doc.isVerified);
    if (allVerified) {
      await document.employee.update({ kycStatus: 'verified', kycVerifiedBy: req.user.id, kycVerifiedAt: new Date() });
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'verify_document',
      entityType: 'EmployeeDocument',
      entityId: document.id,
      description: `Document ${document.documentType} ${isVerified ? 'verified' : 'rejected'} for employee ${document.employee.employeeCode}`
    });

    res.json({ success: true, data: document, message: 'Document verification updated' });
  } catch (error) {
    logger.error('Verify document error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify document' });
  }
};

/**
 * Delete document
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await EmployeeDocument.findByPk(documentId, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Soft delete
    document.isActive = false;
    await document.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'delete_document',
      entityType: 'EmployeeDocument',
      entityId: document.id,
      description: `Document ${document.documentType} deleted for employee ${document.employee.employeeCode}`
    });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};



