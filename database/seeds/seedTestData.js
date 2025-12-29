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
const { 
  Company, 
  Employee, 
  User, 
  Role, 
  SalaryStructure, 
  Attendance, 
  Leave, 
  Loan, 
  Reimbursement, 
  Payroll, 
  Payslip, 
  SupplementarySalary, 
  SalaryIncrement 
} = require(path.join(backendPath, 'src/models'));
// Get Op from models
const models = require(path.join(backendPath, 'src/models'));
const { Op } = models.Sequelize;

const seedTestData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Get default company
    const company = await Company.findOne({ where: { code: 'DEFAULT' } });
    if (!company) {
      console.error('Default company not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    // Get Super Admin role
    const superAdminRole = await Role.findOne({ where: { name: 'Super Admin' } });
    const hrRole = await Role.findOne({ where: { name: 'HR/Admin' } });
    const employeeRole = await Role.findOne({ where: { name: 'Employee' } });

    console.log('\n📦 Seeding test data...\n');

    // Create test employees
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
        dateOfBirth: '1995-03-25',
        dateOfJoining: '2022-01-10',
        department: 'Engineering',
        designation: 'Software Engineer',
        branch: 'Bangalore',
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
        dateOfBirth: '1991-07-18',
        dateOfJoining: '2021-09-01',
        department: 'Sales',
        designation: 'Sales Executive',
        branch: 'Pune',
        pan: 'UVWXY6789Z',
        aadhaar: '567890123456',
        bankAccountNumber: '5678901234',
        bankName: 'Kotak Bank',
        bankIfsc: 'KKBK0005678',
        isActive: true
      }
    ];

    for (const empData of employeeData) {
      const [employee, created] = await Employee.findOrCreate({
        where: { employeeCode: empData.employeeCode, companyId: company.id },
        defaults: {
          ...empData,
          companyId: company.id
        }
      });
      employees.push(employee);
      console.log(`${created ? 'Created' : 'Found'} employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`);
    }

    // Create salary structures
    console.log('\n💰 Creating salary structures...');
    const salaryStructures = [];
    const baseSalaries = [80000, 100000, 120000, 60000, 70000];
    
    for (let i = 0; i < employees.length; i++) {
      const baseSalary = baseSalaries[i];
      const basicSalary = baseSalary * 0.4;
      const hra = baseSalary * 0.2;
      const specialAllowance = baseSalary * 0.3;
      const otherAllowances = {
        transportAllowance: 2000,
        medicalAllowance: 1500,
        otherAllowances: 500
      };
      const grossSalary = basicSalary + hra + specialAllowance + 2000 + 1500 + 500;
      const deductions = {
        pf: baseSalary * 0.12,
        esi: baseSalary * 0.0175,
        professionalTax: 200,
        tds: 0
      };
      const totalDeductions = deductions.pf + deductions.esi + deductions.professionalTax + deductions.tds;
      const netSalary = grossSalary - totalDeductions;
      
      const [salaryStructure, created] = await SalaryStructure.findOrCreate({
        where: { employeeId: employees[i].id },
        defaults: {
          employeeId: employees[i].id,
          effectiveDate: employees[i].dateOfJoining,
          basicSalary: basicSalary,
          hra: hra,
          specialAllowance: specialAllowance,
          otherAllowances: otherAllowances,
          deductions: deductions,
          grossSalary: grossSalary,
          netSalary: netSalary,
          isActive: true
        }
      });
      salaryStructures.push(salaryStructure);
      console.log(`${created ? 'Created' : 'Found'} salary structure for ${employees[i].employeeCode}`);
    }

    // Create attendance records for current month
    console.log('\n📅 Creating attendance records...');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (const employee of employees) {
      let presentDays = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Random attendance: 85% present, 10% absent, 5% half-day
        const rand = Math.random();
        let status = 'present';
        if (rand > 0.85) status = 'absent';
        else if (rand > 0.80) status = 'half-day';
        
        if (status === 'present' || status === 'half-day') presentDays++;

        await Attendance.findOrCreate({
          where: {
            employeeId: employee.id,
            date: date.toISOString().split('T')[0]
          },
          defaults: {
            employeeId: employee.id,
            date: date.toISOString().split('T')[0],
            status: status,
            checkIn: status !== 'absent' ? '09:00:00' : null,
            checkOut: status === 'present' ? '18:00:00' : (status === 'half-day' ? '13:00:00' : null),
            hoursWorked: status === 'present' ? 8 : (status === 'half-day' ? 4 : 0)
          }
        });
      }
      console.log(`Created attendance for ${employee.employeeCode} - ${presentDays} working days`);
    }

    // Create leave records
    console.log('\n🏖️ Creating leave records...');
    const leaveTypes = ['CL', 'SL', 'PL', 'EL'];
    const leaveStatuses = ['pending', 'approved', 'rejected', 'approved'];
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const numLeaves = Math.floor(Math.random() * 3) + 1; // 1-3 leaves per employee
      
      for (let j = 0; j < numLeaves; j++) {
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const status = leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)];
        const startDate = new Date(currentYear, currentMonth - 1, Math.floor(Math.random() * 15) + 1);
        const days = Math.floor(Math.random() * 3) + 1;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);

        await Leave.create({
          employeeId: employee.id,
          leaveType: leaveType,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days: days,
          reason: `Personal ${leaveType} leave`,
          status: status,
          approvedBy: status !== 'pending' ? (await User.findOne({ where: { roleId: superAdminRole.id } }))?.id : null,
          approvedAt: status !== 'pending' ? new Date() : null
        });
      }
      console.log(`Created ${numLeaves} leave records for ${employee.employeeCode}`);
    }

    // Create loan records
    console.log('\n💳 Creating loan records...');
    const loanStatuses = ['pending', 'approved', 'active', 'closed'];
    
    for (let i = 0; i < 3; i++) {
      const employee = employees[i];
      const loanAmount = [50000, 100000, 75000][i];
      const status = loanStatuses[Math.floor(Math.random() * loanStatuses.length)];
      
      await Loan.create({
        employeeId: employee.id,
        loanType: 'loan',
        amount: loanAmount,
        interestRate: 8.5,
        tenure: 12,
        emiAmount: Math.round(loanAmount / 12),
        startDate: new Date(currentYear, currentMonth - 2, 1).toISOString().split('T')[0],
        status: status,
        approvedBy: status !== 'pending' ? (await User.findOne({ where: { roleId: superAdminRole.id } }))?.id : null,
        approvedAt: status !== 'pending' ? new Date() : null,
        autoDeduct: true,
        outstandingAmount: status === 'active' ? loanAmount * 0.7 : loanAmount,
        paidAmount: status === 'active' ? loanAmount * 0.3 : 0
      });
      console.log(`Created loan for ${employee.employeeCode} - ₹${loanAmount}`);
    }

    // Create reimbursement records
    console.log('\n🧾 Creating reimbursement records...');
    const categories = ['Travel', 'Food', 'Medical', 'Internet', 'Phone'];
    const reimbStatuses = ['pending', 'approved', 'paid', 'rejected'];
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const numReimbursements = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < numReimbursements; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const amount = Math.floor(Math.random() * 5000) + 500;
        const status = reimbStatuses[Math.floor(Math.random() * reimbStatuses.length)];
        
        await Reimbursement.create({
          employeeId: employee.id,
          category: category,
          amount: amount,
          description: `${category} reimbursement`,
          date: new Date(currentYear, currentMonth - 1, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          status: status,
          approvedBy: status !== 'pending' ? (await User.findOne({ where: { roleId: superAdminRole.id } }))?.id : null,
          approvedAt: status !== 'pending' ? new Date() : null,
          isTaxable: category === 'Food' || category === 'Travel'
        });
      }
      console.log(`Created ${numReimbursements} reimbursements for ${employee.employeeCode}`);
    }

    // Create payroll for last month
    console.log('\n💵 Creating payroll records...');
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const [payroll, payrollCreated] = await Payroll.findOrCreate({
      where: {
        companyId: company.id,
        month: lastMonth + 1,
        year: lastMonthYear
      },
      defaults: {
        companyId: company.id,
        month: lastMonth + 1,
        year: lastMonthYear,
        status: 'finalized',
        totalEmployees: employees.length,
        totalGrossSalary: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        processedBy: (await User.findOne({ where: { roleId: superAdminRole.id } }))?.id,
        processedAt: new Date()
      }
    });

    if (payrollCreated) {
      console.log(`Created payroll for ${lastMonth + 1}/${lastMonthYear}`);
    } else {
      console.log(`Found existing payroll for ${lastMonth + 1}/${lastMonthYear}`);
    }

    // Create payslips
    console.log('\n📄 Creating payslips...');
    let totalGross = 0, totalDeductions = 0, totalNet = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const salaryStructure = salaryStructures[i];
      const otherAllowances = salaryStructure.otherAllowances || {};
      const deductions = salaryStructure.deductions || {};
      
      const grossSalary = parseFloat(salaryStructure.grossSalary) || 0;
      const empTotalDeductions = parseFloat(salaryStructure.deductions?.pf || 0) + 
                                 parseFloat(salaryStructure.deductions?.esi || 0) + 
                                 parseFloat(salaryStructure.deductions?.professionalTax || 0) + 
                                 parseFloat(salaryStructure.deductions?.tds || 0);
      const netSalary = parseFloat(salaryStructure.netSalary) || 0;
      
      totalGross += grossSalary;
      totalDeductions += empTotalDeductions;
      totalNet += netSalary;

      const earnings = {
        basicSalary: parseFloat(salaryStructure.basicSalary) || 0,
        hra: parseFloat(salaryStructure.hra) || 0,
        specialAllowance: parseFloat(salaryStructure.specialAllowance) || 0,
        ...otherAllowances
      };

      await Payslip.create({
        payrollId: payroll.id,
        employeeId: employee.id,
        month: lastMonth + 1,
        year: lastMonthYear,
        earnings: earnings,
        deductions: deductions,
        grossSalary: grossSalary,
        totalDeductions: empTotalDeductions,
        netSalary: netSalary
      });
      console.log(`Created payslip for ${employee.employeeCode} - Net: ₹${netSalary.toFixed(2)}`);
    }

    // Update payroll totals
    payroll.totalGrossSalary = totalGross;
    payroll.totalDeductions = totalDeductions;
    payroll.totalNetSalary = totalNet;
    await payroll.save();

    // Create supplementary salary
    console.log('\n➕ Creating supplementary salary records...');
    for (let i = 0; i < 2; i++) {
      const employee = employees[i];
      await SupplementarySalary.create({
        employeeId: employee.id,
        type: 'bonus',
        amount: 10000,
        description: 'Performance bonus',
        month: lastMonth + 1,
        year: lastMonthYear,
        isProcessed: true,
        processedInPayrollId: payroll.id
      });
      console.log(`Created supplementary salary for ${employee.employeeCode}`);
    }

    // Create salary increment
    console.log('\n📈 Creating salary increment records...');
    for (let i = 0; i < 2; i++) {
      const employee = employees[i];
      const previousSalary = parseFloat(salaryStructures[i].basicSalary) || 0;
      const newSalary = previousSalary * 1.1;
      const incrementAmount = newSalary - previousSalary;
      
      await SalaryIncrement.create({
        employeeId: employee.id,
        effectiveDate: new Date(currentYear, currentMonth + 1, 1).toISOString().split('T')[0],
        previousSalary: previousSalary,
        newSalary: newSalary,
        incrementAmount: incrementAmount,
        incrementPercentage: 10,
        reason: 'Annual increment',
        status: 'approved',
        approvedBy: (await User.findOne({ where: { roleId: superAdminRole.id } }))?.id,
        approvedAt: new Date(),
        isApplied: false
      });
      console.log(`Created salary increment for ${employee.employeeCode}`);
    }

    console.log('\n✅ Test data seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Salary Structures: ${salaryStructures.length}`);
    console.log(`   - Attendance Records: ~${employees.length * 20} records`);
    console.log(`   - Leave Records: Multiple per employee`);
    console.log(`   - Loans: 3`);
    console.log(`   - Reimbursements: Multiple per employee`);
    console.log(`   - Payroll: 1 (${lastMonth + 1}/${lastMonthYear})`);
    console.log(`   - Payslips: ${employees.length}`);
    console.log(`   - Supplementary Salaries: 2`);
    console.log(`   - Salary Increments: 2`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

seedTestData();

