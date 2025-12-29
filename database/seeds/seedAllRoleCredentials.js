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

const seedAllRoleCredentials = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Get or create default company
    const [defaultCompany] = await Company.findOrCreate({
      where: { code: 'DEFAULT' },
      defaults: {
        name: 'Default Company',
        code: 'DEFAULT',
        email: 'admin@example.com',
        isActive: true
      }
    });

    // Get all roles
    const roles = await Role.findAll();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name.toLowerCase()] = role;
    });

    console.log('📋 Creating credentials for all roles...\n');

    const credentials = [];

    // 1. Super Admin
    if (roleMap['super admin']) {
      const [user, created] = await User.findOrCreate({
        where: { email: 'superadmin@payroll.com' },
        defaults: {
          email: 'superadmin@payroll.com',
          password: 'superadmin123',
          firstName: 'Super',
          lastName: 'Admin',
          roleId: roleMap['super admin'].id,
          companyId: defaultCompany.id,
          isActive: true
        }
      });
      if (created) {
        console.log('✅ Created Super Admin user');
        credentials.push({ role: 'Super Admin', email: user.email, password: 'superadmin123' });
      } else {
        console.log('ℹ️  Super Admin user already exists');
        credentials.push({ role: 'Super Admin', email: user.email, password: 'superadmin123 (existing)' });
      }
    }

    // 2. Company Admin
    if (roleMap['company admin']) {
      const [user, created] = await User.findOrCreate({
        where: { email: 'companyadmin@payroll.com' },
        defaults: {
          email: 'companyadmin@payroll.com',
          password: 'companyadmin123',
          firstName: 'Company',
          lastName: 'Admin',
          roleId: roleMap['company admin'].id,
          companyId: defaultCompany.id,
          isActive: true
        }
      });
      if (created) {
        console.log('✅ Created Company Admin user');
        credentials.push({ role: 'Company Admin', email: user.email, password: 'companyadmin123' });
      } else {
        console.log('ℹ️  Company Admin user already exists');
        credentials.push({ role: 'Company Admin', email: user.email, password: 'companyadmin123 (existing)' });
      }
    }

    // 3. HR/Admin
    if (roleMap['hr/admin']) {
      const [user, created] = await User.findOrCreate({
        where: { email: 'hradmin@payroll.com' },
        defaults: {
          email: 'hradmin@payroll.com',
          password: 'hradmin123',
          firstName: 'HR',
          lastName: 'Admin',
          roleId: roleMap['hr/admin'].id,
          companyId: defaultCompany.id,
          isActive: true
        }
      });
      if (created) {
        console.log('✅ Created HR/Admin user');
        credentials.push({ role: 'HR/Admin', email: user.email, password: 'hradmin123' });
      } else {
        console.log('ℹ️  HR/Admin user already exists');
        credentials.push({ role: 'HR/Admin', email: user.email, password: 'hradmin123 (existing)' });
      }
    }

    // 4. Finance
    if (roleMap['finance']) {
      const [user, created] = await User.findOrCreate({
        where: { email: 'finance@payroll.com' },
        defaults: {
          email: 'finance@payroll.com',
          password: 'finance123',
          firstName: 'Finance',
          lastName: 'Manager',
          roleId: roleMap['finance'].id,
          companyId: defaultCompany.id,
          isActive: true
        }
      });
      if (created) {
        console.log('✅ Created Finance user');
        credentials.push({ role: 'Finance', email: user.email, password: 'finance123' });
      } else {
        console.log('ℹ️  Finance user already exists');
        credentials.push({ role: 'Finance', email: user.email, password: 'finance123 (existing)' });
      }
    }

    // 5. Employee
    if (roleMap['employee']) {
      const [user, created] = await User.findOrCreate({
        where: { email: 'employee@payroll.com' },
        defaults: {
          email: 'employee@payroll.com',
          password: 'employee123',
          firstName: 'Test',
          lastName: 'Employee',
          roleId: roleMap['employee'].id,
          companyId: defaultCompany.id,
          isActive: true
        }
      });
      if (created) {
        console.log('✅ Created Employee user');
        credentials.push({ role: 'Employee', email: user.email, password: 'employee123' });
      } else {
        console.log('ℹ️  Employee user already exists');
        credentials.push({ role: 'Employee', email: user.email, password: 'employee123 (existing)' });
      }
    }

    // 6. Auditor
    if (roleMap['auditor']) {
      const [user, created] = await User.findOrCreate({
        where: { email: 'auditor@payroll.com' },
        defaults: {
          email: 'auditor@payroll.com',
          password: 'auditor123',
          firstName: 'Auditor',
          lastName: 'User',
          roleId: roleMap['auditor'].id,
          companyId: defaultCompany.id,
          isActive: true
        }
      });
      if (created) {
        console.log('✅ Created Auditor user');
        credentials.push({ role: 'Auditor', email: user.email, password: 'auditor123' });
      } else {
        console.log('ℹ️  Auditor user already exists');
        credentials.push({ role: 'Auditor', email: user.email, password: 'auditor123 (existing)' });
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 LOGIN CREDENTIALS FOR ALL ROLES');
    console.log('='.repeat(70));
    console.log('\n');
    
    credentials.forEach(cred => {
      console.log(`Role: ${cred.role.padEnd(20)} Email: ${cred.email.padEnd(30)} Password: ${cred.password}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ All role credentials created successfully!');
    console.log('\n💡 Note: Passwords are in plain text for testing purposes.');
    console.log('   In production, ensure strong passwords are used.\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating role credentials:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedAllRoleCredentials();



