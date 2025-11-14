const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env manually
const backendPath = path.join(__dirname, '../../backend');
const envPath = path.join(backendPath, '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { sequelize } = require(path.join(backendPath, 'src/config/database'));
// Load all models with associations
require(path.join(backendPath, 'src/models'));
const { Role, Company, User } = require(path.join(backendPath, 'src/models'));

const seedDefaultData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database models (create tables if they don't exist)
    // Need to sync in order due to foreign key dependencies
    console.log('Syncing database models...');
    const models = require(path.join(backendPath, 'src/models'));
    await models.Role.sync({ alter: false });
    await models.Company.sync({ alter: false });
    await models.Permission.sync({ alter: false });
    await models.User.sync({ alter: false });
    console.log('Database models synchronized.');

    // Create default roles
    const roles = [
      { name: 'Super Admin', description: 'All modules + Global Setup', isSystemRole: true },
      { name: 'HR/Admin', description: 'Employee + Payroll + Attendance', isSystemRole: true },
      { name: 'Finance', description: 'Salary Processing + Statutory Reports', isSystemRole: true },
      { name: 'Employee', description: 'Self-service portal', isSystemRole: true },
      { name: 'Auditor', description: 'Read-only access to all data', isSystemRole: true }
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });
      createdRoles.push(role);
      console.log(`${created ? 'Created' : 'Found'} role: ${role.name}`);
    }

    // Find Super Admin role
    const superAdminRole = createdRoles.find(r => r.name === 'Super Admin');

    // Create default company
    const [defaultCompany, companyCreated] = await Company.findOrCreate({
      where: { code: 'DEFAULT' },
      defaults: {
        name: 'Default Company',
        code: 'DEFAULT',
        email: 'admin@example.com',
        isActive: true
      }
    });
    console.log(`${companyCreated ? 'Created' : 'Found'} company: ${defaultCompany.name}`);

    // Create default admin user
    const [adminUser, userCreated] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        email: 'admin@example.com',
        password: 'admin123', // Will be hashed by the model hook
        firstName: 'Admin',
        lastName: 'User',
        roleId: superAdminRole.id,
        companyId: defaultCompany.id,
        isActive: true
      }
    });

    if (userCreated) {
      console.log('Created default admin user:');
      console.log('  Email: admin@example.com');
      console.log('  Password: admin123');
    } else {
      console.log('Admin user already exists: admin@example.com');
    }

    console.log('\n✅ Default data seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding default data:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedDefaultData();

