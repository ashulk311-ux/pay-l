const { StatutoryConfig, Company, SalaryHeadMapping, StatutoryLocationMapping, PFGroup, ESIGroup, PTGroup, CostCenter, OfficeLocation, Unit } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all statutory configurations for a company
 */
exports.getConfigurations = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { state, statutoryType } = req.query;

    // Company Admin can only access their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const targetCompanyId = isSuperAdmin ? companyId : req.user.companyId;

    if (!isSuperAdmin && companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const where = { companyId: targetCompanyId };
    if (state) where.state = state;
    if (statutoryType) where.statutoryType = statutoryType;

    const configs = await StatutoryConfig.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['state', 'ASC'], ['statutoryType', 'ASC']]
    });

    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get statutory configurations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statutory configurations' });
  }
};

/**
 * Get single statutory configuration
 */
exports.getConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await StatutoryConfig.findByPk(id, {
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    // Check access
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && config.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Get statutory configuration error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statutory configuration' });
  }
};

/**
 * Create statutory configuration
 */
exports.createConfiguration = async (req, res) => {
  try {
    const configData = { ...req.body };

    // Company Admin can only create for their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin) {
      configData.companyId = req.user.companyId;
    }

    // Check if configuration already exists
    const existing = await StatutoryConfig.findOne({
      where: {
        companyId: configData.companyId,
        state: configData.state,
        statutoryType: configData.statutoryType
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Configuration for ${configData.statutoryType} in ${configData.state} already exists`
      });
    }

    const config = await StatutoryConfig.create(configData);
    await createAuditLog({
      userId: req.user.id,
      companyId: configData.companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'StatutoryConfig',
      entityId: config.id
    });

    res.status(201).json({ success: true, data: config });
  } catch (error) {
    logger.error('Create statutory configuration error:', error);
    res.status(500).json({ success: false, message: 'Failed to create statutory configuration' });
  }
};

/**
 * Update statutory configuration
 */
exports.updateConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await StatutoryConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    // Check access
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && config.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prevent changing companyId, state, or statutoryType
    const { companyId, state, statutoryType, ...updateData } = req.body;

    await config.update(updateData);
    await createAuditLog({
      userId: req.user.id,
      companyId: config.companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'StatutoryConfig',
      entityId: config.id
    });

    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update statutory configuration error:', error);
    res.status(500).json({ success: false, message: 'Failed to update statutory configuration' });
  }
};

/**
 * Delete statutory configuration
 */
exports.deleteConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await StatutoryConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    // Check access
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    if (!isSuperAdmin && config.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await config.destroy();
    await createAuditLog({
      userId: req.user.id,
      companyId: config.companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'StatutoryConfig',
      entityId: config.id
    });

    res.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (error) {
    logger.error('Delete statutory configuration error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete statutory configuration' });
  }
};

/**
 * Get TDS slabs (default or company-specific)
 */
exports.getTDSSlabs = async (req, res) => {
  try {
    const { regime = 'new' } = req.query;

    // Default TDS slabs for new regime (FY 2024-25)
    const defaultNewRegimeSlabs = [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 700000, rate: 5 },
      { min: 700000, max: 1000000, rate: 10 },
      { min: 1000000, max: 1200000, rate: 15 },
      { min: 1200000, max: 1500000, rate: 20 },
      { min: 1500000, max: Infinity, rate: 30 }
    ];

    // Default TDS slabs for old regime
    const defaultOldRegimeSlabs = [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: Infinity, rate: 30 }
    ];

    const slabs = regime === 'old' ? defaultOldRegimeSlabs : defaultNewRegimeSlabs;

    res.json({ success: true, data: { regime, slabs } });
  } catch (error) {
    logger.error('Get TDS slabs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch TDS slabs' });
  }
};

/**
 * Update TDS slabs for a company
 */
exports.updateTDSSlabs = async (req, res) => {
  try {
    const { companyId, state, regime, slabs } = req.body;

    // Company Admin can only update for their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const targetCompanyId = isSuperAdmin ? companyId : req.user.companyId;

    if (!isSuperAdmin && companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find or create TDS configuration
    const [config, created] = await StatutoryConfig.findOrCreate({
      where: {
        companyId: targetCompanyId,
        state: state || 'All',
        statutoryType: 'TDS'
      },
      defaults: {
        companyId: targetCompanyId,
        state: state || 'All',
        statutoryType: 'TDS',
        tdsRegime: regime || 'new',
        tdsSlabs: slabs || [],
        isEnabled: true
      }
    });

    if (!created) {
      config.tdsRegime = regime || config.tdsRegime;
      config.tdsSlabs = slabs || config.tdsSlabs;
      await config.save();
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: targetCompanyId,
      module: 'statutory',
      action: 'update',
      entityType: 'StatutoryConfig',
      entityId: config.id,
      details: 'TDS slabs updated'
    });

    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update TDS slabs error:', error);
    res.status(500).json({ success: false, message: 'Failed to update TDS slabs' });
  }
};

/**
 * Get exemptions for TDS
 */
exports.getExemptions = async (req, res) => {
  try {
    const { companyId, state } = req.query;

    // Company Admin can only access their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const targetCompanyId = isSuperAdmin ? companyId : req.user.companyId;

    if (!isSuperAdmin && companyId && companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const config = await StatutoryConfig.findOne({
      where: {
        companyId: targetCompanyId,
        state: state || 'All',
        statutoryType: 'TDS'
      }
    });

    const exemptions = config?.exemptions || [];

    // Default exemptions
    const defaultExemptions = [
      { section: '80C', description: 'Life Insurance, PPF, ELSS, etc.', maxAmount: 150000 },
      { section: '80D', description: 'Health Insurance Premium', maxAmount: 25000 },
      { section: '80G', description: 'Donations', maxAmount: null },
      { section: '80TTA', description: 'Interest on Savings Account', maxAmount: 10000 },
      { section: '24B', description: 'Home Loan Interest', maxAmount: 200000 },
      { section: '80EE', description: 'First Time Home Buyer', maxAmount: 50000 }
    ];

    res.json({ success: true, data: exemptions.length > 0 ? exemptions : defaultExemptions });
  } catch (error) {
    logger.error('Get exemptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exemptions' });
  }
};

/**
 * Update exemptions for TDS
 */
exports.updateExemptions = async (req, res) => {
  try {
    const { companyId, state, exemptions } = req.body;

    // Company Admin can only update for their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const targetCompanyId = isSuperAdmin ? companyId : req.user.companyId;

    if (!isSuperAdmin && companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find or create TDS configuration
    const [config, created] = await StatutoryConfig.findOrCreate({
      where: {
        companyId: targetCompanyId,
        state: state || 'All',
        statutoryType: 'TDS'
      },
      defaults: {
        companyId: targetCompanyId,
        state: state || 'All',
        statutoryType: 'TDS',
        exemptions: exemptions || [],
        isEnabled: true
      }
    });

    if (!created) {
      config.exemptions = exemptions || config.exemptions;
      await config.save();
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: targetCompanyId,
      module: 'statutory',
      action: 'update',
      entityType: 'StatutoryConfig',
      entityId: config.id,
      details: 'TDS exemptions updated'
    });

    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update exemptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to update exemptions' });
  }
};

/**
 * Get PF/ESI/PT Location & Unit Mappings
 */
exports.getLocationMappings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { groupType } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const where = { companyId };
    if (groupType) where.groupType = groupType;

    const mappings = await StatutoryLocationMapping.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['groupType', 'ASC'], ['groupName', 'ASC']]
    });

    // Enrich with group details and location/unit names
    const enrichedMappings = await Promise.all(mappings.map(async (mapping) => {
      const mappingData = mapping.toJSON();
      
      // Get group details
      let group = null;
      if (mapping.groupType === 'PF') {
        group = await PFGroup.findByPk(mapping.groupId);
      } else if (mapping.groupType === 'ESI') {
        group = await ESIGroup.findByPk(mapping.groupId);
      } else if (mapping.groupType === 'PT') {
        group = await PTGroup.findByPk(mapping.groupId);
      }

      // Get cost center names
      if (mapping.costCenterIds && mapping.costCenterIds.length > 0) {
        const costCenters = await CostCenter.findAll({
          where: { id: mapping.costCenterIds, companyId },
          attributes: ['id', 'name', 'code']
        });
        mappingData.costCenters = costCenters;
      }

      // Get location names
      if (mapping.locationIds && mapping.locationIds.length > 0) {
        const locations = await OfficeLocation.findAll({
          where: { id: mapping.locationIds, companyId },
          attributes: ['id', 'name', 'code']
        });
        mappingData.locations = locations;
      }

      // Get unit names
      if (mapping.unitIds && mapping.unitIds.length > 0) {
        const units = await Unit.findAll({
          where: { id: mapping.unitIds, companyId },
          attributes: ['id', 'name', 'code']
        });
        mappingData.units = units;
      }

      mappingData.group = group;
      return mappingData;
    }));

    res.json({ success: true, data: enrichedMappings });
  } catch (error) {
    logger.error('Get location mappings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch location mappings', error: error.message });
  }
};

/**
 * Create PF/ESI/PT Location & Unit Mapping
 */
exports.createLocationMapping = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const mapping = await StatutoryLocationMapping.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'StatutoryLocationMapping',
      entityId: mapping.id,
      description: `Location mapping created: ${mapping.groupType} - ${mapping.groupName}`
    });

    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    logger.error('Create location mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to create location mapping', error: error.message });
  }
};

/**
 * Update PF/ESI/PT Location & Unit Mapping
 */
exports.updateLocationMapping = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const mapping = await StatutoryLocationMapping.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Location mapping not found' });
    }

    await mapping.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'StatutoryLocationMapping',
      entityId: mapping.id,
      description: `Location mapping updated: ${mapping.groupType} - ${mapping.groupName}`
    });

    res.json({ success: true, data: mapping });
  } catch (error) {
    logger.error('Update location mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location mapping', error: error.message });
  }
};

/**
 * Delete PF/ESI/PT Location & Unit Mapping
 */
exports.deleteLocationMapping = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const mapping = await StatutoryLocationMapping.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Location mapping not found' });
    }

    await mapping.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'StatutoryLocationMapping',
      entityId: req.params.id,
      description: `Location mapping deleted: ${mapping.groupType} - ${mapping.groupName}`
    });

    res.json({ success: true, message: 'Location mapping deleted successfully' });
  } catch (error) {
    logger.error('Delete location mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete location mapping' });
  }
};

/**
 * Get comprehensive statutory configuration summary
 */
exports.getStatutorySummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const { IncomeTaxSlab, ProfessionalTaxSlab, LabourWelfareFundSlab, TDSDeductor } = require('../models');

    const [incomeTaxSlabs, professionalTaxSlabs, lwfSlabs, pfGroups, esiGroups, ptGroups, tdsDeductors, locationMappings, statutoryConfigs] = await Promise.all([
      IncomeTaxSlab.count({ where: { companyId, isActive: true } }),
      ProfessionalTaxSlab.count({ where: { companyId, isActive: true } }),
      LabourWelfareFundSlab.count({ where: { companyId, isActive: true } }),
      PFGroup.count({ where: { companyId, isActive: true } }),
      ESIGroup.count({ where: { companyId, isActive: true } }),
      PTGroup.count({ where: { companyId, isActive: true } }),
      TDSDeductor.count({ where: { companyId, isActive: true } }),
      StatutoryLocationMapping.count({ where: { companyId, isActive: true } }),
      StatutoryConfig.count({ where: { companyId, isEnabled: true } })
    ]);

    res.json({
      success: true,
      data: {
        incomeTaxSlabs,
        professionalTaxSlabs,
        lwfSlabs,
        pfGroups,
        esiGroups,
        ptGroups,
        tdsDeductors,
        locationMappings,
        statutoryConfigs
      }
    });
  } catch (error) {
    logger.error('Get statutory summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statutory summary', error: error.message });
  }
};