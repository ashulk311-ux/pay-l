const path = require('path');
const backendPath = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendPath, '.env') });
const { sequelize } = require(path.join(backendPath, 'src/config/database'));

// Load all models with associations
require(path.join(backendPath, 'src/models'));
const { Role, Company, User } = require(path.join(backendPath, 'src/models'));

const createCompanyAdmin = async (companyCode, email, password = 'admin123') => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Find the company
    const company = await Company.findOne({ where: { code: companyCode } });
    if (!company) {
      console.error(`❌ Company with code "${companyCode}" not found.`);
      console.log('\nAvailable companies:');
      const companies = await Company.findAll({ attributes: ['id', 'name', 'code', 'email'] });
      companies.forEach(c => console.log(`  - ${c.name} (${c.code}) - ${c.email || 'No email'}`));
      await sequelize.close();
      process.exit(1);
    }

    console.log(`📦 Found company: ${company.name} (${company.code})\n`);

    // Find Company Admin role
    const companyAdminRole = await Role.findOne({ where: { name: 'Company Admin' } });
    if (!companyAdminRole) {
      console.error('❌ Company Admin role not found. Please run seedDefaultData.js first.');
      await sequelize.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`ℹ️  User with email "${email}" already exists.`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Company: ${existingUser.companyId === company.id ? '✅ Matches' : '❌ Different company'}`);
      await sequelize.close();
      process.exit(0);
    }

    // Create Company Admin user
    const adminUser = await User.create({
      email,
      password,
      firstName: 'Company',
      lastName: 'Admin',
      roleId: companyAdminRole.id,
      companyId: company.id,
      isActive: true
    });

    console.log('✅ Created Company Admin user:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Company: ${company.name} (${company.code})`);
    console.log(`   Role: Company Admin`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Company Admin:', error);
    await sequelize.close();
    process.exit(1);
  }
};

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node createCompanyAdmin.js <companyCode> <email> [password]');
  console.log('Example: node createCompanyAdmin.js test2 admin@test2.com admin123');
  process.exit(1);
}

const [companyCode, email, password] = args;
createCompanyAdmin(companyCode, email, password || 'admin123');
