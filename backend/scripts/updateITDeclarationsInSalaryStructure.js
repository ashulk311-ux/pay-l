const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
require('../src/models'); // Load all models with associations
const {
  Company, Employee, SalaryStructure, ITDeclaration
} = require('../src/models');
const logger = require('../src/utils/logger');

const updateITDeclarationsInSalaryStructure = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // Find the test2 company
    const company = await Company.findOne({ where: { name: 'test2' } });
    if (!company) {
      logger.error('Company "test2" not found.');
      process.exit(1);
    }

    logger.info(`Found company: ${company.name} (${company.code})`);

    // Get all employees
    const employees = await Employee.findAll({
      where: { companyId: company.id, isActive: true }
    });

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const financialYear = currentMonth >= 4 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    logger.info(`\n📋 Syncing IT Declarations to Salary Structures for FY ${financialYear}...\n`);

    let updated = 0;
    for (const employee of employees) {
      try {
        // Get IT declaration from ITDeclaration table
        const itDecl = await ITDeclaration.findOne({
          where: {
            employeeId: employee.id,
            financialYear
          }
        });

        if (!itDecl) {
          logger.info(`   ⏭️  No IT declaration found for ${employee.employeeCode}`);
          continue;
        }

        // Get salary structure
        const salaryStructure = await SalaryStructure.findOne({
          where: { employeeId: employee.id, isActive: true }
        });

        if (!salaryStructure) {
          logger.info(`   ⚠️  No salary structure found for ${employee.employeeCode}`);
          continue;
        }

        // Update extraFields with IT declaration data
        const extraFields = salaryStructure.extraFields || {};
        extraFields.itDeclaration = {
          financialYear: itDecl.financialYear,
          assessmentYear: itDecl.assessmentYear,
          section80C: parseFloat(itDecl.section80C) || 0,
          section80CDetails: itDecl.section80CDetails || {},
          section80D: parseFloat(itDecl.section80D) || 0,
          section80DDetails: itDecl.section80DDetails || {},
          section80G: parseFloat(itDecl.section80G) || 0,
          section80GDetails: itDecl.section80GDetails || {},
          section80TTA: parseFloat(itDecl.section80TTA) || 0,
          section80TTADetails: itDecl.section80TTADetails || {},
          totalDeclaredAmount: parseFloat(itDecl.totalDeclaredAmount) || 0,
          status: itDecl.status,
          submittedAt: itDecl.submittedAt
        };

        await salaryStructure.update({ extraFields });
        updated++;
        logger.info(`   ✅ Updated IT declaration for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error updating IT declaration for ${employee.employeeCode}:`, error.message);
      }
    }

    logger.info(`\n📊 Summary: Updated ${updated} salary structures with IT declarations`);
    logger.info('\n✅ IT declaration sync completed!');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Error syncing IT declarations:', error);
    await sequelize.close();
    process.exit(1);
  }
};

updateITDeclarationsInSalaryStructure();


