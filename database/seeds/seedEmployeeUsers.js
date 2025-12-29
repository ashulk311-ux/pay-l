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
const { Company, Employee, User, Role } = require(path.join(backendPath, 'src/models'));

const seedEmployeeUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Get default company
    const company = await Company.findOne({ where: { code: 'DEFAULT' } });
    if (!company) {
      console.error('Default company not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    // Get Employee role
    const employeeRole = await Role.findOne({ where: { name: 'Employee' } });
    if (!employeeRole) {
      console.error('Employee role not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    console.log('\n👤 Creating employee user accounts...\n');

    // Get all employeeService        
    const employees = await Employee.findAll({
      where: { companyId: company.id, isActive: true }
    });

    const employeeUsers = [
      { email: 'john.doe@example.com', password: 'emp123', firstName: 'John', lastName: 'Doe' },
      { email: 'jane.smith@example.com', password: 'emp123', firstName: 'Jane', lastName: 'Smith' },
      { email: 'robert.johnson@example.com', password: 'emp123', firstName: 'Robert', lastName: 'Johnson' },
      { email: 'emily.davis@example.com', password: 'emp123', firstName: 'Emily', lastName: 'Davis' },
      { email: 'michael.wilson@example.com', password: 'emp123', firstName: 'Michael', lastName: 'Wilson' }
    ];

    for (const employee of employees) {
      // Find matching user data
      const userData = employeeUsers.find(u => 
        employee.email && employee.email.toLowerCase() === u.email.toLowerCase()
      );

      if (userData && employee.email) {
        const [user, created] = await User.findOrCreate({
          where: { email: employee.email },
          defaults: {
            email: employee.email,
            password: userData.password,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone,
            roleId: employeeRole.id,
            companyId: company.id,
            isActive: true
          }
        });

        if (created) {
          console.log(`✅ Created user account for ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`);
          console.log(`   Email: ${employee.email}`);
          console.log(`   Password: ${userData.password}`);
        } else {
          console.log(`ℹ️  User account already exists for ${employee.employeeCode} - ${employee.email}`);
        }
      } else {
        console.log(`⚠️  Skipped ${employee.employeeCode} - No email or matching user data`);
      }
    }

    console.log('\n✅ Employee user accounts created successfully!');
    console.log('\n📋 Employee Login Credentials:');
    console.log('   All employees use password: emp123');
    console.log('\n   Employee Accounts:');
    employeeUsers.forEach(u => {
      console.log(`   - ${u.email} / emp123`);
    });
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding employee users:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

seedEmployeeUsers();



