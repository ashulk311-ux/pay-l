const { ITDeclaration, ITDeclarationSection, ITDeclarationDocument, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for IT declaration documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/it-declarations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.declarationId}-${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

exports.uploadMiddleware = upload;

/**
 * Get IT declaration sections for company
 */
exports.getSections = async (req, res) => {
  try {
    const sections = await ITDeclarationSection.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      order: [['displayOrder', 'ASC']]
    });

    res.json({ success: true, data: sections });
  } catch (error) {
    logger.error('Get IT declaration sections error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sections' });
  }
};

/**
 * Get IT declaration for employee
 */
exports.getITDeclaration = async (req, res) => {
  try {
    const { employeeId, financialYear } = req.query;

    const where = { employeeId };
    if (financialYear) where.financialYear = financialYear;

    const declaration = await ITDeclaration.findOne({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] }
      ],
      order: [['financialYear', 'DESC']]
    });

    // Get sections
    const sections = await ITDeclarationSection.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      order: [['displayOrder', 'ASC']]
    });

    // Get documents if declaration exists
    let documents = [];
    if (declaration) {
      documents = await ITDeclarationDocument.findAll({
        where: { itDeclarationId: declaration.id }
      });
    }

    res.json({
      success: true,
      data: {
        declaration: declaration || null,
        sections,
        documents
      }
    });
  } catch (error) {
    logger.error('Get IT declaration error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IT declaration' });
  }
};

/**
 * Create or update IT declaration
 */
exports.submitITDeclaration = async (req, res) => {
  try {
    const { employeeId, financialYear, sections, status = 'draft' } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const assessmentYear = `${parseInt(financialYear) + 1}-${(parseInt(financialYear) + 2).toString().slice(-2)}`;

    // Calculate total declared amount
    let totalDeclared = 0;
    const declarationData = {
      employeeId,
      financialYear,
      assessmentYear,
      totalDeclaredAmount: 0
    };

    // Process each section
    Object.keys(sections || {}).forEach(sectionCode => {
      const sectionData = sections[sectionCode];
      const amount = parseFloat(sectionData.amount || 0);
      totalDeclared += amount;

      // Map to model fields
      switch (sectionCode) {
        case '80C':
          declarationData.section80C = amount;
          declarationData.section80CDetails = sectionData.details || {};
          break;
        case '80D':
          declarationData.section80D = amount;
          declarationData.section80DDetails = sectionData.details || {};
          break;
        case '80G':
          declarationData.section80G = amount;
          declarationData.section80GDetails = sectionData.details || {};
          break;
        case '80TTA':
          declarationData.section80TTA = amount;
          declarationData.section80TTADetails = sectionData.details || {};
          break;
        case '24B':
          declarationData.section24B = amount;
          declarationData.section24BDetails = sectionData.details || {};
          break;
        case '80EE':
          declarationData.section80EE = amount;
          declarationData.section80EEDetails = sectionData.details || {};
          break;
        default:
          if (!declarationData.otherSections) {
            declarationData.otherSections = {};
          }
          declarationData.otherSections[sectionCode] = {
            amount,
            details: sectionData.details || {}
          };
      }
    });

    declarationData.totalDeclaredAmount = totalDeclared;

    if (status === 'submitted') {
      declarationData.status = 'submitted';
      declarationData.submittedAt = new Date();
    }

    // Find or create declaration
    const [declaration, created] = await ITDeclaration.findOrCreate({
      where: { employeeId, financialYear },
      defaults: declarationData
    });

    if (!created) {
      await declaration.update(declarationData);
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'it_declaration',
      action: created ? 'create' : 'update',
      entityType: 'ITDeclaration',
      entityId: declaration.id,
      description: `IT declaration ${status} for employee ${employee.employeeCode} - FY ${financialYear}`
    });

    res.json({
      success: true,
      data: declaration,
      message: created ? 'IT declaration created' : 'IT declaration updated'
    });
  } catch (error) {
    logger.error('Submit IT declaration error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit IT declaration' });
  }
};

/**
 * Upload document for IT declaration
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { declarationId } = req.params;
    const { sectionCode } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const declaration = await ITDeclaration.findByPk(declarationId, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!declaration || declaration.employee.companyId !== req.user.companyId) {
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'IT declaration not found' });
    }

    const document = await ITDeclarationDocument.create({
      itDeclarationId: declarationId,
      sectionCode,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'it_declaration',
      action: 'upload_document',
      entityType: 'ITDeclarationDocument',
      entityId: document.id
    });

    res.json({ success: true, data: document });
  } catch (error) {
    logger.error('Upload IT declaration document error:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

/**
 * Review IT declaration (Admin/HR)
 */
exports.reviewITDeclaration = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const declaration = await ITDeclaration.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!declaration || declaration.employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'IT declaration not found' });
    }

    if (status === 'approved') {
      declaration.status = 'approved';
      declaration.approvedBy = req.user.id;
      declaration.approvedAt = new Date();
      declaration.approvalRemarks = remarks;
    } else if (status === 'rejected') {
      declaration.status = 'rejected';
      declaration.reviewedBy = req.user.id;
      declaration.reviewedAt = new Date();
      declaration.reviewRemarks = remarks;
    } else if (status === 'under_review') {
      declaration.status = 'under_review';
      declaration.reviewedBy = req.user.id;
      declaration.reviewedAt = new Date();
      declaration.reviewRemarks = remarks;
    }

    await declaration.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'it_declaration',
      action: 'review',
      entityType: 'ITDeclaration',
      entityId: declaration.id,
      description: `IT declaration ${status} by ${req.user.email}`
    });

    res.json({ success: true, data: declaration });
  } catch (error) {
    logger.error('Review IT declaration error:', error);
    res.status(500).json({ success: false, message: 'Failed to review IT declaration' });
  }
};

/**
 * Get all IT declarations (for admin review)
 */
exports.getAllITDeclarations = async (req, res) => {
  try {
    const { status, financialYear } = req.query;
    const where = {};

    if (status) where.status = status;
    if (financialYear) where.financialYear = financialYear;

    const declarations = await ITDeclaration.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          where: { companyId: req.user.companyId },
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({ success: true, data: declarations });
  } catch (error) {
    logger.error('Get all IT declarations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IT declarations' });
  }
};



