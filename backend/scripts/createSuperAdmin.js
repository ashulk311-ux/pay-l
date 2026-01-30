const path = require('path');
const backendPath = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendPath, '.env') });
const { sequelize } = require(path.join(backendPath, 'src/config/database'));

// Load all models with associations
require(path.join(backendPath, 'src/models'));
const { Role, Company, User } = require(path.join(backendPath, 'src/models'));

const createSuperAdmin = async (email, password = 'Admin123!') => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Find default company (Super Admin is tied to default company)
    const company = await Company.findOne({ where: { code: 'DEFAULT' } });
    if (!company) {
      console.error('❌ Default company (DEFAULT) not found. Please run seedDefaultData.js first.');
      console.log('\nAvailable companies:');
      const companies = await Company.findAll({ attributes: ['id', 'name', 'code', 'email'] });
      companies.forEach(c => console.log(`  - ${c.name} (${c.code}) - ${c.email || 'No email'}`));
      await sequelize.close();
      process.exit(1);
    }

    console.log(`📦 Using company: ${company.name} (${company.code})\n`);

    // Find Super Admin role
    const superAdminRole = await Role.findOne({ where: { name: 'Super Admin' } });
    if (!superAdminRole) {
      console.error('❌ Super Admin role not found. Please run seedDefaultData.js first.');
      await sequelize.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`ℹ️  User with email "${email}" already exists.`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.roleId === superAdminRole.id ? 'Super Admin' : 'Other'}`);
      await sequelize.close();
      process.exit(0);
    }

    // Create Super Admin user
    const adminUser = await User.create({
      email,
      password,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      companyId: company.id,
      isActive: true
    });

    console.log('✅ Created Super Admin user:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Company: ${company.name} (${company.code})`);
    console.log(`   Role: Super Admin`);
    console.log('\n💡 Use this account to log in. Change the password after first login in production.\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    await sequelize.close();
    process.exit(1);
  }
};

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node createSuperAdmin.js <email> [password]');
  console.log('Example: node createSuperAdmin.js superadmin@mycompany.com Admin123!');
  console.log('         node createSuperAdmin.js admin@example.com');
  process.exit(1);
}

const [email, password] = args;
createSuperAdmin(email, password || 'Admin123!');
