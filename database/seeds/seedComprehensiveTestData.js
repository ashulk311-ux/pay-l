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
const models = require(path.join(backendPath, 'src/models'));
const { Op } = models.Sequelize;

const {
  Company,
  Employee,
  User,
  Role,
  Branch,
  Department,
  Designation,
  Region,
  SalaryStructure,
  Attendance,
  Leave,
  LeaveType,
  LeaveBalance,
  Loan,
  LoanEMI,
  Reimbursement,
  ReimbursementCategory,
  Payroll,
  Payslip,
  SupplementarySalary,
  SalaryIncrement,
  StatutoryConfig,
  OfficeLocation,
  BiometricDevice
} = models;

const seedComprehensiveTestData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Sync database models first (create tables if they don't exist)
    console.log('🔄 Syncing database models...');
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.\n');
    } catch (error) {
      console.warn('⚠️  Warning during sync:', error.message);
      console.log('Continuing with test data creation...\n');
    }

    // Get default company
    const company = await Company.findOne({ where: { code: 'DEFAULT' } });
    if (!company) {
      console.error('Default company not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    // Get roles
    const roles = await Role.findAll();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name.toLowerCase()] = role;
    });

    console.log('📦 Seeding comprehensive test data...\n');

    // 1. Create Branches
    console.log('1️⃣  Creating Branches...');
    const branches = [];
    const branchData = [
      { name: 'Head Office', code: 'HO', address: '123 Main Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      { name: 'Bangalore Branch', code: 'BLR', address: '456 Tech Park', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      { name: 'Delhi Branch', code: 'DEL', address: '789 Business Center', city: 'Delhi', state: 'Delhi', pincode: '110001' }
    ];

    for (const data of branchData) {
      const [branch, created] = await Branch.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      branches.push(branch);
      if (created) console.log(`   ✅ Created branch: ${branch.name}`);
    }

    // 2. Create Departments
    console.log('\n2️⃣  Creating Departments...');
    const departments = [];
    const deptData = [
      { name: 'Engineering', code: 'ENG' },
      { name: 'Human Resources', code: 'HR' },
      { name: 'Finance', code: 'FIN' },
      { name: 'Sales', code: 'SAL' },
      { name: 'Marketing', code: 'MKT' },
      { name: 'Operations', code: 'OPS' }
    ];

    for (const data of deptData) {
      const [dept, created] = await Department.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      departments.push(dept);
      if (created) console.log(`   ✅ Created department: ${dept.name}`);
    }

    // 3. Create Designations
    console.log('\n3️⃣  Creating Designations...');
    const designations = [];
    const desigData = [
      { name: 'Software Engineer', code: 'SE', level: 1 },
      { name: 'Senior Software Engineer', code: 'SSE', level: 2 },
      { name: 'Tech Lead', code: 'TL', level: 3 },
      { name: 'HR Executive', code: 'HRE', level: 1 },
      { name: 'HR Manager', code: 'HRM', level: 2 },
      { name: 'Finance Executive', code: 'FE', level: 1 },
      { name: 'Finance Manager', code: 'FM', level: 2 },
      { name: 'Sales Executive', code: 'SAE', level: 1 },
      { name: 'Sales Manager', code: 'SM', level: 2 }
    ];

    for (const data of desigData) {
      const [desig, created] = await Designation.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      designations.push(desig);
      if (created) console.log(`   ✅ Created designation: ${desig.name}`);
    }

    // 4. Create Regions
    console.log('\n4️⃣  Creating Regions...');
    const regions = [];
    const regionData = [
      { name: 'North', code: 'NORTH' },
      { name: 'South', code: 'SOUTH' },
      { name: 'East', code: 'EAST' },
      { name: 'West', code: 'WEST' }
    ];

    for (const data of regionData) {
      const [region, created] = await Region.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      regions.push(region);
      if (created) console.log(`   ✅ Created region: ${region.name}`);
    }

    // 5. Create Office Locations
    console.log('\n5️⃣  Creating Office Locations...');
    const officeLocations = [];
    try {
      const locationData = [
        {
          locationName: 'Mumbai Head Office',
          address: '123 Main Street, Mumbai',
          latitude: 19.0760,
          longitude: 72.8777,
          allowedRadius: 100,
          isDefault: true
        },
        {
          locationName: 'Bangalore Office',
          address: '456 Tech Park, Bangalore',
          latitude: 12.9716,
          longitude: 77.5946,
          allowedRadius: 150
        }
      ];

      for (const data of locationData) {
        const [location, created] = await OfficeLocation.findOrCreate({
          where: { companyId: company.id, locationName: data.locationName },
          defaults: { ...data, companyId: company.id, branchId: branches[0].id, isActive: true }
        });
        officeLocations.push(location);
        if (created) console.log(`   ✅ Created office location: ${location.locationName}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Skipping office locations: ${error.message}`);
    }

    // 6. Create Employees
    console.log('\n6️⃣  Creating Employees...');
    const employees = [];
    const employeeData = [
      {
        employeeCode: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+91-9876543210',
        dateOfBirth: '1990-05-15',
        dateOfJoining: '2020-01-15',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        pan: 'ABCDE1234F',
        aadhaar: '123456789012',
        bankAccountNumber: '1234567890',
        bankName: 'HDFC Bank',
        bankIfsc: 'HDFC0001234',
        branch: 'Bangalore',
        isActive: true
      },
      {
        employeeCode: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+91-9876543211',
        dateOfBirth: '1992-08-20',
        dateOfJoining: '2021-03-01',
        department: 'HR',
        designation: 'HR Manager',
        branch: 'Mumbai',
        pan: 'FGHIJ5678K',
        aadhaar: '234567890123',
        bankAccountNumber: '2345678901',
        bankName: 'ICICI Bank',
        bankIfsc: 'ICIC0002345',
        isActive: true
      },
      {
        employeeCode: 'EMP003',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@example.com',
        phone: '+91-9876543212',
        dateOfBirth: '1988-12-10',
        dateOfJoining: '2019-06-15',
        department: 'Finance',
        designation: 'Finance Manager',
        branch: 'Delhi',
        pan: 'KLMNO9012P',
        aadhaar: '345678901234',
        bankAccountNumber: '3456789012',
        bankName: 'SBI',
        bankIfsc: 'SBIN0003456',
        isActive: true
      },
      {
        employeeCode: 'EMP004',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        phone: '+91-9876543213',
        dateOfBirth: '1991-03-25',
        dateOfJoining: '2022-01-10',
        department: 'Sales',
        designation: 'Sales Manager',
        branch: 'Mumbai',
        pan: 'PQRST3456U',
        aadhaar: '456789012345',
        bankAccountNumber: '4567890123',
        bankName: 'Axis Bank',
        bankIfsc: 'UTIB0004567',
        isActive: true
      },
      {
        employeeCode: 'EMP005',
        firstName: 'Michael',
        lastName: 'Wilson',
        email: 'michael.wilson@example.com',
        phone: '+91-9876543214',
        dateOfBirth: '1989-07-18',
        dateOfJoining: '2020-08-20',
        department: 'Engineering',
        designation: 'Tech Lead',
        branch: 'Bangalore',
        pan: 'VWXYZ7890A',
        aadhaar: '567890123456',
        bankAccountNumber: '5678901234',
        bankName: 'HDFC Bank',
        bankIfsc: 'HDFC0005678',
        isActive: true
      }
    ];

    for (const data of employeeData) {
      const [employee, created] = await Employee.findOrCreate({
        where: { companyId: company.id, employeeCode: data.employeeCode },
        defaults: { ...data, companyId: company.id }
      });
      employees.push(employee);
      if (created) console.log(`   ✅ Created employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`);
    }

    // 7. Create Salary Structures
    console.log('\n7️⃣  Creating Salary Structures...');
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const baseSalary = 50000 + (i * 10000); // Varying salaries
      
      const [salary, created] = await SalaryStructure.findOrCreate({
        where: { employeeId: employee.id },
        defaults: {
          employeeId: employee.id,
          basicSalary: baseSalary * 0.5,
          hra: baseSalary * 0.2,
          specialAllowance: baseSalary * 0.3,
          effectiveDate: employee.dateOfJoining,
          isActive: true
        }
      });
      if (created) console.log(`   ✅ Created salary structure for ${employee.employeeCode}`);
    }

    // 8. Create Leave Types
    console.log('\n8️⃣  Creating Leave Types...');
    const leaveTypes = [];
    const leaveTypeData = [
      { name: 'Casual Leave', code: 'CL', maxDays: 12, isPaid: true },
      { name: 'Sick Leave', code: 'SL', maxDays: 12, isPaid: true },
      { name: 'Privilege Leave', code: 'PL', maxDays: 15, isPaid: true },
      { name: 'Earned Leave', code: 'EL', maxDays: 15, isPaid: true }
    ];

    for (const data of leaveTypeData) {
      const [leaveType, created] = await LeaveType.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      leaveTypes.push(leaveType);
      if (created) console.log(`   ✅ Created leave type: ${leaveType.name}`);
    }

    // 9. Create Leave Balances
    console.log('\n9️⃣  Creating Leave Balances...');
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        await LeaveBalance.findOrCreate({
          where: { employeeId: employee.id, leaveTypeId: leaveType.id },
          defaults: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            balance: leaveType.maxDays,
            year: new Date().getFullYear()
          }
        });
      }
    }
    console.log(`   ✅ Created leave balances for ${employees.length} employees`);

    // 10. Create Attendance Records (Last 30 days)
    console.log('\n🔟 Creating Attendance Records...');
    const today = new Date();
    let attendanceCount = 0;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      for (const employee of employees) {
        const [attendance, created] = await Attendance.findOrCreate({
          where: { employeeId: employee.id, date: dateStr },
          defaults: {
            employeeId: employee.id,
            date: dateStr,
            status: 'present',
            checkIn: '09:00',
            checkOut: '18:00',
            hoursWorked: 9.0,
            isManual: false
          }
        });
        if (created) attendanceCount++;
      }
    }
    console.log(`   ✅ Created ${attendanceCount} attendance records`);

    // 11. Create Leave Applications
    console.log('\n1️⃣1️⃣ Creating Leave Applications...');
    const leaveCount = 0;
    for (let i = 0; i < 3; i++) {
      const employee = employees[i];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7 + i);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      await Leave.findOrCreate({
        where: {
          employeeId: employee.id,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        defaults: {
          employeeId: employee.id,
          leaveType: 'CL',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days: 2,
          reason: 'Personal work',
          status: i === 0 ? 'approved' : 'pending'
        }
      });
    }
    console.log(`   ✅ Created 3 leave applications`);

    // 12. Create Loans
    console.log('\n1️⃣2️⃣ Creating Loans...');
    for (let i = 0; i < 2; i++) {
      const employee = employees[i];
      const loanAmount = 50000 + (i * 25000);
      
      const [loan, created] = await Loan.findOrCreate({
        where: { employeeId: employee.id, loanType: 'loan' },
        defaults: {
          employeeId: employee.id,
          loanType: 'loan',
          amount: loanAmount,
          emiAmount: loanAmount / 12,
          outstandingAmount: loanAmount,
          startDate: new Date(),
          status: i === 0 ? 'approved' : 'pending',
          requestedBy: employee.id
        }
      });
      if (created) {
        console.log(`   ✅ Created loan for ${employee.employeeCode}: ₹${loanAmount}`);
        
        // Create EMI records
        for (let month = 1; month <= 3; month++) {
          const emiDate = new Date();
          emiDate.setMonth(emiDate.getMonth() + month);
          await LoanEMI.create({
            loanId: loan.id,
            emiNumber: month,
            emiDate: emiDate,
            amount: loan.emiAmount,
            status: 'pending'
          });
        }
      }
    }

    // 13. Create Reimbursement Categories
    console.log('\n1️⃣3️⃣ Creating Reimbursement Categories...');
    const reimbCategories = [];
    const reimbCatData = [
      { name: 'Travel', code: 'TRAVEL', isTaxable: false },
      { name: 'Food', code: 'FOOD', isTaxable: false },
      { name: 'Medical', code: 'MEDICAL', isTaxable: false },
      { name: 'Internet', code: 'INTERNET', isTaxable: true }
    ];

    for (const data of reimbCatData) {
      const [cat, created] = await ReimbursementCategory.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      reimbCategories.push(cat);
      if (created) console.log(`   ✅ Created reimbursement category: ${cat.name}`);
    }

    // 14. Create Reimbursements
    console.log('\n1️⃣4️⃣ Creating Reimbursements...');
    for (let i = 0; i < 3; i++) {
      const employee = employees[i];
      const category = reimbCategories[i % reimbCategories.length];
      
      await Reimbursement.findOrCreate({
        where: {
          employeeId: employee.id,
          category: category.name,
          date: new Date().toISOString().split('T')[0]
        },
        defaults: {
          employeeId: employee.id,
          category: category.name,
          categoryId: category.id,
          amount: 2000 + (i * 500),
          date: new Date().toISOString().split('T')[0],
          description: `Reimbursement for ${category.name.toLowerCase()}`,
          status: i === 0 ? 'approved' : 'pending',
          isTaxable: category.isTaxable
        }
      });
    }
    console.log(`   ✅ Created 3 reimbursement requests`);

    // 15. Create Supplementary Salary
    console.log('\n1️⃣5️⃣ Creating Supplementary Salary...');
    for (let i = 0; i < 2; i++) {
      const employee = employees[i];
      await SupplementarySalary.findOrCreate({
        where: {
          employeeId: employee.id,
          type: 'incentive',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        },
        defaults: {
          employeeId: employee.id,
          type: 'incentive',
          amount: 10000 + (i * 5000),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          description: 'Performance incentive',
          status: 'approved'
        }
      });
    }
    console.log(`   ✅ Created 2 supplementary salary entries`);

    // 16. Create Salary Increments
    console.log('\n1️⃣6️⃣ Creating Salary Increments...');
    for (let i = 0; i < 2; i++) {
      const employee = employees[i];
      await SalaryIncrement.findOrCreate({
        where: {
          employeeId: employee.id,
          effectiveDate: new Date().toISOString().split('T')[0]
        },
        defaults: {
          employeeId: employee.id,
          previousSalary: 50000 + (i * 10000),
          newSalary: 55000 + (i * 10000),
          incrementAmount: 5000,
          incrementPercent: 10,
          effectiveDate: new Date().toISOString().split('T')[0],
          reason: 'Annual increment',
          status: 'approved'
        }
      });
    }
    console.log(`   ✅ Created 2 salary increments`);

    // 17. Create Statutory Configurations
    console.log('\n1️⃣7️⃣ Creating Statutory Configurations...');
    try {
      await StatutoryConfig.findOrCreate({
        where: { companyId: company.id, state: 'Maharashtra', statutoryType: 'PF' },
        defaults: {
          companyId: company.id,
          state: 'Maharashtra',
          statutoryType: 'PF',
          isEnabled: true,
          configuration: {
            employeeContribution: 12,
            employerContribution: 12
          }
        }
      });
      await StatutoryConfig.findOrCreate({
        where: { companyId: company.id, state: 'Maharashtra', statutoryType: 'ESI' },
        defaults: {
          companyId: company.id,
          state: 'Maharashtra',
          statutoryType: 'ESI',
          isEnabled: true,
          configuration: {
            employeeContribution: 0.75,
            employerContribution: 3.25
          }
        }
      });
      console.log(`   ✅ Created statutory configurations (PF, ESI)`);
    } catch (error) {
      console.log(`   ⚠️  Skipping statutory config: ${error.message}`);
    }

    // 18. Create Biometric Devices
    console.log('\n1️⃣8️⃣ Creating Biometric Devices...');
    try {
      for (let i = 0; i < 2; i++) {
        await BiometricDevice.findOrCreate({
          where: { companyId: company.id, deviceSerialNumber: `DEV${i + 1}001` },
          defaults: {
            companyId: company.id,
            branchId: branches[i % branches.length].id,
            deviceName: `Biometric Device ${i + 1}`,
            deviceSerialNumber: `DEV${i + 1}001`,
            deviceType: 'fingerprint',
            ipAddress: `192.168.1.${100 + i}`,
            port: 8080,
            location: branches[i % branches.length].name,
            apiKey: `api_key_${i + 1}_${Date.now()}`,
            isActive: true,
            status: 'active'
          }
        });
      }
      console.log(`   ✅ Created 2 biometric devices`);
    } catch (error) {
      console.log(`   ⚠️  Skipping biometric devices: ${error.message}`);
    }

    // 19. Create Payroll (Current Month)
    console.log('\n1️⃣9️⃣ Creating Payroll...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const [payroll, payrollCreated] = await Payroll.findOrCreate({
      where: {
        companyId: company.id,
        month: currentMonth,
        year: currentYear
      },
      defaults: {
        companyId: company.id,
        month: currentMonth,
        year: currentYear,
        status: 'draft',
        totalEmployees: employees.length
      }
    });
    
    if (payrollCreated) {
      console.log(`   ✅ Created payroll for ${currentMonth}/${currentYear}`);
      
      // Create payslips for employees
      for (const employee of employees) {
        const salary = await SalaryStructure.findOne({ where: { employeeId: employee.id } });
        if (salary) {
          const grossSalary = parseFloat(salary.basicSalary) + parseFloat(salary.hra || 0) + parseFloat(salary.specialAllowance || 0);
          const pf = grossSalary * 0.12;
          const esi = grossSalary * 0.0375;
          const netSalary = grossSalary - pf - esi;
          
          await Payslip.create({
            payrollId: payroll.id,
            employeeId: employee.id,
            payrollMonth: currentMonth,
            payrollYear: currentYear,
            grossSalary: grossSalary,
            netSalary: netSalary,
            earnings: {
              basic: salary.basicSalary,
              hra: salary.hra || 0,
              specialAllowance: salary.specialAllowance || 0
            },
            deductions: {
              pf: pf,
              esi: esi
            }
          });
        }
      }
      console.log(`   ✅ Created ${employees.length} payslips`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ COMPREHENSIVE TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   • Branches: ${branches.length}`);
    console.log(`   • Departments: ${departments.length}`);
    console.log(`   • Designations: ${designations.length}`);
    console.log(`   • Regions: ${regions.length}`);
    console.log(`   • Office Locations: ${officeLocations.length}`);
    console.log(`   • Employees: ${employees.length}`);
    console.log(`   • Salary Structures: ${employees.length}`);
    console.log(`   • Leave Types: ${leaveTypes.length}`);
    console.log(`   • Attendance Records: ${attendanceCount}`);
    console.log(`   • Loans: 2`);
    console.log(`   • Reimbursements: 3`);
    console.log(`   • Supplementary Salary: 2`);
    console.log(`   • Salary Increments: 2`);
    console.log(`   • Payroll: 1 (with ${employees.length} payslips)`);
    console.log(`   • Biometric Devices: 2`);
    console.log('\n💡 Test data is ready for testing all modules!\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

seedComprehensiveTestData();

