const express = require('express');
const router = express.Router();
const statutoryController = require('../controllers/statutoryController');
const salaryHeadMappingController = require('../controllers/salaryHeadMappingController');
const incomeTaxSlabController = require('../controllers/incomeTaxSlabController');
const professionalTaxSlabController = require('../controllers/professionalTaxSlabController');
const labourWelfareFundSlabController = require('../controllers/labourWelfareFundSlabController');
const pfGroupController = require('../controllers/pfGroupController');
const esiGroupController = require('../controllers/esiGroupController');
const ptGroupController = require('../controllers/ptGroupController');
const tdsDeductorController = require('../controllers/tdsDeductorController');
const { authenticate, authorize } = require('../middleware/auth');
const { protectAuditorWrite } = require('../middleware/auditorProtection');

// Statutory Configurations
router.get('/:companyId', authenticate, authorize('view_statutory'), statutoryController.getConfigurations);
router.get('/config/:id', authenticate, authorize('view_statutory'), statutoryController.getConfiguration);
router.post('/', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.createConfiguration);
router.put('/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.updateConfiguration);
router.delete('/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.deleteConfiguration);

// TDS Management
router.get('/tds/slabs', authenticate, authorize('view_statutory'), statutoryController.getTDSSlabs);
router.post('/tds/slabs', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.updateTDSSlabs);
router.get('/tds/exemptions', authenticate, authorize('view_statutory'), statutoryController.getExemptions);
router.post('/tds/exemptions', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.updateExemptions);

// Salary Head Mappings
router.get('/salary-heads/mappings', authenticate, authorize('view_statutory'), salaryHeadMappingController.getAllMappings);
router.get('/salary-heads/mappings/:id', authenticate, authorize('view_statutory'), salaryHeadMappingController.getMapping);
router.post('/salary-heads/mappings', authenticate, authorize('manage_statutory'), protectAuditorWrite, salaryHeadMappingController.createMapping);
router.put('/salary-heads/mappings/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, salaryHeadMappingController.updateMapping);
router.delete('/salary-heads/mappings/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, salaryHeadMappingController.deleteMapping);

// Income Tax Slabs
router.get('/income-tax/slabs', authenticate, authorize('view_statutory'), incomeTaxSlabController.getAllIncomeTaxSlabs);
router.get('/income-tax/slabs/:id', authenticate, authorize('view_statutory'), incomeTaxSlabController.getIncomeTaxSlab);
router.post('/income-tax/slabs', authenticate, authorize('manage_statutory'), protectAuditorWrite, incomeTaxSlabController.createIncomeTaxSlab);
router.put('/income-tax/slabs/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, incomeTaxSlabController.updateIncomeTaxSlab);
router.delete('/income-tax/slabs/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, incomeTaxSlabController.deleteIncomeTaxSlab);

// Professional Tax Slabs
router.get('/professional-tax/slabs', authenticate, authorize('view_statutory'), professionalTaxSlabController.getAllProfessionalTaxSlabs);
router.get('/professional-tax/slabs/:id', authenticate, authorize('view_statutory'), professionalTaxSlabController.getProfessionalTaxSlab);
router.post('/professional-tax/slabs', authenticate, authorize('manage_statutory'), protectAuditorWrite, professionalTaxSlabController.createProfessionalTaxSlab);
router.put('/professional-tax/slabs/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, professionalTaxSlabController.updateProfessionalTaxSlab);
router.delete('/professional-tax/slabs/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, professionalTaxSlabController.deleteProfessionalTaxSlab);

// Labour Welfare Fund Slabs
router.get('/labour-welfare-fund/slabs', authenticate, authorize('view_statutory'), labourWelfareFundSlabController.getAllLabourWelfareFundSlabs);
router.get('/labour-welfare-fund/slabs/:id', authenticate, authorize('view_statutory'), labourWelfareFundSlabController.getLabourWelfareFundSlab);
router.post('/labour-welfare-fund/slabs', authenticate, authorize('manage_statutory'), protectAuditorWrite, labourWelfareFundSlabController.createLabourWelfareFundSlab);
router.put('/labour-welfare-fund/slabs/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, labourWelfareFundSlabController.updateLabourWelfareFundSlab);
router.delete('/labour-welfare-fund/slabs/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, labourWelfareFundSlabController.deleteLabourWelfareFundSlab);

// PF Groups
router.get('/pf/groups', authenticate, authorize('view_statutory'), pfGroupController.getAllPFGroups);
router.get('/pf/groups/:id', authenticate, authorize('view_statutory'), pfGroupController.getPFGroup);
router.post('/pf/groups', authenticate, authorize('manage_statutory'), protectAuditorWrite, pfGroupController.createPFGroup);
router.put('/pf/groups/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, pfGroupController.updatePFGroup);
router.delete('/pf/groups/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, pfGroupController.deletePFGroup);

// ESI Groups
router.get('/esi/groups', authenticate, authorize('view_statutory'), esiGroupController.getAllESIGroups);
router.get('/esi/groups/:id', authenticate, authorize('view_statutory'), esiGroupController.getESIGroup);
router.post('/esi/groups', authenticate, authorize('manage_statutory'), protectAuditorWrite, esiGroupController.createESIGroup);
router.put('/esi/groups/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, esiGroupController.updateESIGroup);
router.delete('/esi/groups/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, esiGroupController.deleteESIGroup);

// PT Groups
router.get('/pt/groups', authenticate, authorize('view_statutory'), ptGroupController.getAllPTGroups);
router.get('/pt/groups/:id', authenticate, authorize('view_statutory'), ptGroupController.getPTGroup);
router.post('/pt/groups', authenticate, authorize('manage_statutory'), protectAuditorWrite, ptGroupController.createPTGroup);
router.put('/pt/groups/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, ptGroupController.updatePTGroup);
router.delete('/pt/groups/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, ptGroupController.deletePTGroup);

// TDS Deductor
router.get('/tds/deductors', authenticate, authorize('view_statutory'), tdsDeductorController.getAllTDSDeductors);
router.get('/tds/deductors/:id', authenticate, authorize('view_statutory'), tdsDeductorController.getTDSDeductor);
router.post('/tds/deductors', authenticate, authorize('manage_statutory'), protectAuditorWrite, tdsDeductorController.createTDSDeductor);
router.put('/tds/deductors/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, tdsDeductorController.updateTDSDeductor);
router.delete('/tds/deductors/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, tdsDeductorController.deleteTDSDeductor);

// Location & Unit Mapping
router.get('/location-mappings', authenticate, authorize('view_statutory'), statutoryController.getLocationMappings);
router.post('/location-mappings', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.createLocationMapping);
router.put('/location-mappings/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.updateLocationMapping);
router.delete('/location-mappings/:id', authenticate, authorize('manage_statutory'), protectAuditorWrite, statutoryController.deleteLocationMapping);

// Statutory Summary
router.get('/summary', authenticate, authorize('view_statutory'), statutoryController.getStatutorySummary);

module.exports = router;

