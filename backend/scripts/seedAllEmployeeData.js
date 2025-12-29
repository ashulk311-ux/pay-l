const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
require('../src/models'); // Load all models with associations
const {
  Company, Employee, User, Role,
  SalaryStructure, Attendance, Leave, LeaveBalance, LeaveType,
  Loan, LoanEMI, Reimbursement, ReimbursementCategory,
  SupplementarySalary, SalaryIncrement, Payroll,
  ITDeclaration, AuditLog
} = require('../src/models');
const logger = require('../src/utils/logger');

const seedAllEmployeeData = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // Find the test2 company
    const company = await Company.findOne({ where: { name: 'test2' } });
    if (!company) {
      logger.error('Company "test2" not found.');
      process.exit(1);
    }

    logger.info(`Found company: ${company.name} (${company.code}) - ID: ${company.id}`);

    // Get all employees
    const employees = await Employee.findAll({
      where: { companyId: company.id, isActive: true },
      order: [['employeeCode', 'ASC']]
    });

    if (employees.length === 0) {
      logger.info('No employees found for this company.');
      process.exit(0);
    }

    logger.info(`Found ${employees.length} employees. Seeding data...\n`);

    // Get admin user for approvals
    const adminUser = await User.findOne({
      where: { companyId: company.id },
      include: [{ model: Role, as: 'role' }]
    });

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const financialYear = currentMonth >= 4 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    let stats = {
      salaryStructures: 0,
      attendance: 0,
      leaves: 0,
      leaveBalances: 0,
      loans: 0,
      reimbursements: 0,
      supplementary: 0,
      increments: 0,
      itDeclarations: 0,
      helpdesk: 0
    };

    // 1. Create Salary Structures
    logger.info('📊 Creating Salary Structures...');
    for (const employee of employees) {
      try {
        const existing = await SalaryStructure.findOne({ where: { employeeId: employee.id } });
        if (existing) {
          logger.info(`   ⏭️  Salary structure already exists for ${employee.employeeCode}`);
          continue;
        }

        const basicSalary = 50000 + Math.floor(Math.random() * 100000);
        const hra = Math.floor(basicSalary * 0.4);
        const specialAllowance = Math.floor(basicSalary * 0.3);
        const otherAllowances = 8000; // transport + medical
        const grossSalary = basicSalary + hra + specialAllowance + otherAllowances;
        const pf = Math.floor(basicSalary * 0.12);
        const esi = Math.floor(basicSalary * 0.0175);
        const deductions = pf + esi;
        const netSalary = grossSalary - deductions;

        await SalaryStructure.create({
          employeeId: employee.id,
          effectiveDate: employee.dateOfJoining || new Date(),
          basicSalary,
          hra,
          specialAllowance,
          otherAllowances: {
            transport: 5000,
            medical: 3000
          },
          fixedHeads: {
            basic: basicSalary,
            hra: hra,
            specialAllowance: specialAllowance
          },
          variableHeads: {},
          deductions: {
            pf: pf,
            esi: esi
          },
          salaryHeads: {},
          grossSalary,
          netSalary,
          isActive: true
        });
        stats.salaryStructures++;
        logger.info(`   ✅ Created salary structure for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating salary structure for ${employee.employeeCode}:`, error.message);
      }
    }

    // 2. Create Attendance Records (last 30 days)
    logger.info('\n📅 Creating Attendance Records...');
    for (const employee of employees) {
      try {
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayOfWeek = date.getDay();

          // Skip weekends
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;

          const existing = await Attendance.findOne({
            where: { employeeId: employee.id, date: date.toISOString().split('T')[0] }
          });
          if (existing) continue;

          const statuses = ['present', 'present', 'present', 'present', 'absent', 'half-day'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          await Attendance.create({
            employeeId: employee.id,
            date: date.toISOString().split('T')[0],
            status,
            checkIn: status === 'present' || status === 'half-day' ? '09:00:00' : null,
            checkOut: status === 'present' ? '18:00:00' : status === 'half-day' ? '13:00:00' : null,
            hoursWorked: status === 'present' ? 9 : status === 'half-day' ? 4.5 : 0,
            remarks: status === 'absent' ? 'Sick leave' : null,
            isManual: false,
            isLocked: false
          });
          stats.attendance++;
        }
        logger.info(`   ✅ Created attendance records for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating attendance for ${employee.employeeCode}:`, error.message);
      }
    }

    // 3. Create Leave Types and Leave Balances
    logger.info('\n🏖️  Creating Leave Types and Balances...');
    const leaveTypes = ['CL', 'SL', 'PL', 'EL'];
    
    // Create leave types if they don't exist
    for (const leaveTypeName of leaveTypes) {
      try {
        await LeaveType.findOrCreate({
          where: { companyId: company.id, name: leaveTypeName },
          defaults: {
            companyId: company.id,
            name: leaveTypeName,
            maxDays: leaveTypeName === 'PL' ? 12 : leaveTypeName === 'CL' ? 12 : leaveTypeName === 'SL' ? 12 : 0,
            isActive: true
          }
        });
      } catch (error) {
        // Table might not exist, continue
      }
    }

    // Get or create leave types first
    const leaveTypeMap = {};
    for (const leaveTypeName of leaveTypes) {
      try {
        const [leaveType] = await LeaveType.findOrCreate({
          where: { companyId: company.id, name: leaveTypeName },
          defaults: {
            companyId: company.id,
            name: leaveTypeName,
            isActive: true
          }
        });
        leaveTypeMap[leaveTypeName] = leaveType;
      } catch (error) {
        // Table might not exist, continue
      }
    }

    for (const employee of employees) {
      try {
        for (const leaveTypeName of leaveTypes) {
          try {
            const leaveType = leaveTypeMap[leaveTypeName];
            if (!leaveType) continue;

            const existing = await LeaveBalance.findOne({
              where: { employeeId: employee.id, leaveTypeId: leaveType.id, year: currentYear }
            });
            if (existing) continue;

            const allocated = leaveTypeName === 'PL' ? 12 : leaveTypeName === 'CL' ? 12 : leaveTypeName === 'SL' ? 12 : 0;
            const used = Math.floor(Math.random() * 5);
            const balance = allocated - used;

            await LeaveBalance.create({
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              year: currentYear,
              openingBalance: allocated,
              allocated,
              used,
              balance,
              carryForward: 0,
              isEditable: true
            });
            stats.leaveBalances++;
          } catch (error) {
            // Table might not exist, continue
          }
        }
        logger.info(`   ✅ Created leave balances for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating leave balances for ${employee.employeeCode}:`, error.message);
      }
    }

    // 4. Create Leave Records
    logger.info('\n📝 Creating Leave Records...');
    for (const employee of employees.slice(0, 5)) { // Create for first 5 employees
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 10);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2);

        await Leave.create({
          employeeId: employee.id,
          leaveType: 'CL',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days: 3,
          reason: 'Personal work',
          status: Math.random() > 0.5 ? 'approved' : 'pending',
          approvedBy: adminUser ? adminUser.id : null,
          approvedAt: Math.random() > 0.5 ? new Date() : null
        });
        stats.leaves++;
        logger.info(`   ✅ Created leave record for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating leave for ${employee.employeeCode}:`, error.message);
      }
    }

    // 5. Create Loan Records
    logger.info('\n💰 Creating Loan Records...');
    for (const employee of employees.slice(0, 3)) { // Create for first 3 employees
      try {
        const loanAmount = 50000 + Math.floor(Math.random() * 100000);
        const tenure = 12;
        const emiAmount = Math.floor(loanAmount / tenure);

        const loan = await Loan.create({
          employeeId: employee.id,
          loanType: 'loan',
          amount: loanAmount,
          interestRate: 8.5,
          tenure,
          emiAmount,
          startDate: new Date().toISOString().split('T')[0],
          status: 'approved',
          approvedBy: adminUser ? adminUser.id : null,
          approvedAt: new Date(),
          outstandingAmount: loanAmount
        });
        stats.loans++;
        logger.info(`   ✅ Created loan record for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating loan for ${employee.employeeCode}:`, error.message);
      }
    }

    // 6. Create Reimbursement Records
    logger.info('\n🧾 Creating Reimbursement Records...');
    
    // Create reimbursement categories if they don't exist
    const categories = ['Travel', 'Food', 'Medical', 'Internet', 'Phone'];
    const categoryMap = {};
    for (const catName of categories) {
      try {
        const [category] = await ReimbursementCategory.findOrCreate({
          where: { companyId: company.id, name: catName },
          defaults: {
            companyId: company.id,
            name: catName,
            isActive: true
          }
        });
        categoryMap[catName] = category;
      } catch (error) {
        // Table might not exist, continue
      }
    }

    for (const employee of employees.slice(0, 5)) {
      try {
        const categoryName = categories[Math.floor(Math.random() * categories.length)];
        const category = categoryMap[categoryName];

        await Reimbursement.create({
          employeeId: employee.id,
          category: categoryName,
          categoryId: category ? category.id : null,
          amount: 1000 + Math.floor(Math.random() * 5000),
          date: new Date().toISOString().split('T')[0],
          description: `${categoryName} expense reimbursement`,
          documents: [],
          status: Math.random() > 0.5 ? 'approved' : 'pending',
          approvedBy: Math.random() > 0.5 && adminUser ? adminUser.id : null,
          approvedAt: Math.random() > 0.5 ? new Date() : null,
          isTaxable: false
        });
        stats.reimbursements++;
        logger.info(`   ✅ Created reimbursement for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating reimbursement for ${employee.employeeCode}:`, error.message);
      }
    }

    // 7. Create Supplementary Salary Records
    logger.info('\n💵 Creating Supplementary Salary Records...');
    for (const employee of employees.slice(0, 3)) {
      try {
        const types = ['arrears', 'incentive', 'bonus'];
        const type = types[Math.floor(Math.random() * types.length)];

        await SupplementarySalary.create({
          employeeId: employee.id,
          type,
          amount: 10000 + Math.floor(Math.random() * 50000),
          month: currentMonth,
          year: currentYear,
          description: `${type} payment`,
          isProcessed: false,
          isTaxable: true
        });
        stats.supplementary++;
        logger.info(`   ✅ Created supplementary salary for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating supplementary salary for ${employee.employeeCode}:`, error.message);
      }
    }

    // 8. Create Salary Increment Records
    logger.info('\n📈 Creating Salary Increment Records...');
    for (const employee of employees.slice(0, 2)) {
      try {
        const previousSalary = 50000;
        const incrementAmount = 10000;
        const newSalary = previousSalary + incrementAmount;

        await SalaryIncrement.create({
          employeeId: employee.id,
          effectiveDate: new Date().toISOString().split('T')[0],
          previousSalary,
          newSalary,
          incrementAmount,
          incrementPercentage: 20,
          reason: 'Annual increment',
          status: 'approved',
          approvedBy: adminUser ? adminUser.id : null,
          approvedAt: new Date(),
          incrementType: 'individual'
        });
        stats.increments++;
        logger.info(`   ✅ Created salary increment for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating increment for ${employee.employeeCode}:`, error.message);
      }
    }

    // 9. Create IT Declarations
    logger.info('\n📋 Creating IT Declarations...');
    for (const employee of employees.slice(0, 5)) {
      try {
        const existing = await ITDeclaration.findOne({
          where: { employeeId: employee.id, financialYear }
        });
        if (existing) {
          logger.info(`   ⏭️  IT declaration already exists for ${employee.employeeCode}`);
          continue;
        }

        await ITDeclaration.create({
          employeeId: employee.id,
          financialYear,
          assessmentYear: (parseInt(financialYear.split('-')[1]) + 1).toString(),
          section80C: 150000,
          section80CDetails: {
            ppf: 50000,
            elss: 50000,
            lifeInsurance: 50000
          },
          section80D: 25000,
          section80DDetails: {
            healthInsurance: 25000
          },
          section80G: 0,
          section80GDetails: {},
          section80TTA: 10000,
          section80TTADetails: {
            savingsInterest: 10000
          },
          totalDeductions: 185000,
          status: 'submitted',
          submittedAt: new Date()
        });
        stats.itDeclarations++;
        logger.info(`   ✅ Created IT declaration for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating IT declaration for ${employee.employeeCode}:`, error.message);
      }
    }

    // 10. Create Helpdesk Queries (via Audit Logs)
    logger.info('\n🎫 Creating Helpdesk Queries...');
    for (const employee of employees.slice(0, 3)) {
      try {
        const employeeUser = await User.findOne({ where: { email: employee.email } });
        if (!employeeUser) continue;

        const subjects = [
          'Salary query',
          'Leave balance inquiry',
          'IT declaration help',
          'Reimbursement status',
          'Loan EMI question'
        ];
        const categories = ['Payroll', 'Leave', 'IT Declaration', 'Reimbursement', 'Loan'];

        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];

        await AuditLog.create({
          userId: employeeUser.id,
          companyId: company.id,
          action: 'create',
          entityType: 'Helpdesk',
          entityId: employee.id,
          module: 'helpdesk',
          description: `Helpdesk query: ${subject}`,
          metadata: {
            category,
            subject,
            description: `Need help with ${subject.toLowerCase()}`,
            status: 'open'
          }
        });
        stats.helpdesk++;
        logger.info(`   ✅ Created helpdesk query for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating helpdesk query for ${employee.employeeCode}:`, error.message);
      }
    }

    // Summary
    logger.info('\n📊 Summary:');
    logger.info(`   Salary Structures: ${stats.salaryStructures}`);
    logger.info(`   Attendance Records: ${stats.attendance}`);
    logger.info(`   Leave Records: ${stats.leaves}`);
    logger.info(`   Leave Balances: ${stats.leaveBalances}`);
    logger.info(`   Loan Records: ${stats.loans}`);
    logger.info(`   Reimbursement Records: ${stats.reimbursements}`);
    logger.info(`   Supplementary Salary: ${stats.supplementary}`);
    logger.info(`   Salary Increments: ${stats.increments}`);
    logger.info(`   IT Declarations: ${stats.itDeclarations}`);
    logger.info(`   Helpdesk Queries: ${stats.helpdesk}`);
    logger.info('\n✅ Employee data seeding completed!');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Error seeding employee data:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedAllEmployeeData();

