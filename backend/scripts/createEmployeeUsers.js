const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
require('../src/models'); // Load all models with associations
const { Company, Employee, User, Role } = require('../src/models');
const logger = require('../src/utils/logger');

const createEmployeeUsers = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // Find the test2 company
    const company = await Company.findOne({ where: { name: 'test2' } });
    if (!company) {
      logger.error('Company "test2" not found. Please create the company first.');
      process.exit(1);
    }

    logger.info(`Found company: ${company.name} (${company.code}) - ID: ${company.id}`);

    // Find Employee role
    const employeeRole = await Role.findOne({ where: { name: 'Employee' } });
    if (!employeeRole) {
      logger.error('Employee role not found. Please ensure default roles are seeded.');
      process.exit(1);
    }

    // Get all employees for this company
    const employees = await Employee.findAll({
      where: { companyId: company.id, isActive: true },
      order: [['employeeCode', 'ASC']]
    });

    if (employees.length === 0) {
      logger.info('No employees found for this company.');
      process.exit(0);
    }

    logger.info(`Found ${employees.length} employees. Creating user accounts...\n`);

    let created = 0;
    let skipped = 0;
    const credentials = [];

    for (const employee of employees) {
      if (!employee.email) {
        logger.info(`⚠️  Skipped ${employee.employeeCode} - No email address`);
        skipped++;
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: employee.email } });
      if (existingUser) {
        logger.info(`ℹ️  User account already exists for ${employee.employeeCode} - ${employee.email}`);
        skipped++;
        continue;
      }

      // Default password for all employees
      const defaultPassword = 'emp123';

      // Create user account
      const user = await User.create({
        email: employee.email,
        password: defaultPassword,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        roleId: employeeRole.id,
        companyId: company.id,
        isActive: true
      });

      created++;
      credentials.push({
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        password: defaultPassword
      });

      logger.info(`✅ Created user account for ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`);
      logger.info(`   Email: ${employee.email}`);
      logger.info(`   Password: ${defaultPassword}`);
    }

    logger.info(`\n📊 Summary:`);
    logger.info(`   Created: ${created} user accounts`);
    logger.info(`   Skipped: ${skipped} employees`);
    logger.info(`   Total: ${employees.length} employees\n`);

    if (credentials.length > 0) {
      logger.info('📋 Employee Login Credentials:');
      logger.info('   All employees use password: emp123\n');
      logger.info('   Employee Accounts:');
      credentials.forEach(cred => {
        logger.info(`   - ${cred.employeeCode} (${cred.name}): ${cred.email} / emp123`);
      });
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Error creating employee user accounts:', error);
    await sequelize.close();
    process.exit(1);
  }
};

createEmployeeUsers();


