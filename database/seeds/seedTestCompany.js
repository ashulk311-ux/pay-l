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
const { Company, Role, User } = require(path.join(backendPath, 'src/models'));

const seedTestCompany = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Get Company Admin role
    const companyAdminRole = await Role.findOne({ where: { name: 'Company Admin' } });
    if (!companyAdminRole) {
      console.error('Company Admin role not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    console.log('\n🏢 Creating test company...\n');

    // Create test company
    const [testCompany, companyCreated] = await Company.findOrCreate({
      where: { code: 'TEST001' },
      defaults: {
        name: 'Test Company Pvt Ltd',
        code: 'TEST001',
        email: 'info@testcompany.com',
        phone: '+91-9876543210',
        website: 'https://www.testcompany.com',
        contactPerson: 'John Manager',
        contactPersonPhone: '+91-9876543211',
        address: '123 Test Street, Test Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001',
        pan: 'ABCDE1234F',
        gstin: '27ABCDE1234F1Z5',
        isActive: true,
        employeeCodeGenerationMode: 'auto',
        employeeCodePrefix: 'TC',
        employeeCodeFormat: '{PREFIX}{NUMBER}'
      }
    });

    if (companyCreated) {
      console.log('✅ Created test company:');
      console.log(`   Name: ${testCompany.name}`);
      console.log(`   Code: ${testCompany.code}`);
      console.log(`   Email: ${testCompany.email}`);
    } else {
      console.log('ℹ️  Test company already exists:');
      console.log(`   Name: ${testCompany.name}`);
      console.log(`   Code: ${testCompany.code}`);
    }

    // Create Company Admin for test company
    const [companyAdmin, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@testcompany.com' },
      defaults: {
        email: 'admin@testcompany.com',
        password: 'admin123',
        firstName: 'Test',
        lastName: 'Admin',
        phone: '+91-9876543212',
        roleId: companyAdminRole.id,
        companyId: testCompany.id,
        isActive: true
      }
    });

    if (adminCreated) {
      console.log('\n✅ Created Company Admin:');
      console.log(`   Email: ${companyAdmin.email}`);
      console.log(`   Password: admin123`);
    } else {
      console.log('\nℹ️  Company Admin already exists:');
      console.log(`   Email: ${companyAdmin.email}`);
    }

    console.log('\n✅ Test company setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log('   Company Admin Email: admin@testcompany.com');
    console.log('   Password: admin123');
    console.log(`   Company: ${testCompany.name} (${testCompany.code})`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test company:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedTestCompany();



