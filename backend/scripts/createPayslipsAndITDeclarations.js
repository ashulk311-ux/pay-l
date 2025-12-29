const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
require('../src/models'); // Load all models with associations
const {
  Company, Employee, User, Role,
  Payroll, Payslip, SalaryStructure, Attendance,
  ITDeclaration
} = require('../src/models');
const logger = require('../src/utils/logger');

const createPayslipsAndITDeclarations = async () => {
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

    // Get admin user
    const adminUser = await User.findOne({
      where: { companyId: company.id },
      include: [{ model: Role, as: 'role' }]
    });

    // Get all employees
    const employees = await Employee.findAll({
      where: { companyId: company.id, isActive: true },
      order: [['employeeCode', 'ASC']]
    });

    if (employees.length === 0) {
      logger.info('No employees found.');
      process.exit(0);
    }

    logger.info(`Found ${employees.length} employees.\n`);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const financialYear = currentMonth >= 4 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    // 1. Create and Process Payroll
    logger.info('💰 Creating Payroll and Payslips...');
    
    // Check if payroll already exists
    let payroll = await Payroll.findOne({
      where: {
        companyId: company.id,
        month: currentMonth,
        year: currentYear
      }
    });

    if (!payroll) {
      // Create payroll
      payroll = await Payroll.create({
        companyId: company.id,
        month: currentMonth,
        year: currentYear,
        status: 'draft',
        attendanceLocked: true,
        processedBy: adminUser ? adminUser.id : null,
        processedAt: new Date()
      });
      logger.info(`   ✅ Created payroll for ${currentMonth}/${currentYear}`);
    } else {
      logger.info(`   ℹ️  Payroll already exists for ${currentMonth}/${currentYear}`);
    }

    // Lock attendance if not already locked
    if (!payroll.attendanceLocked) {
      payroll.attendanceLocked = true;
      await payroll.save();
    }

    // Create payslips for all employees
    let payslipCount = 0;
    for (const employee of employees) {
      try {
        // Get salary structure
        const salaryStructure = await SalaryStructure.findOne({
          where: { employeeId: employee.id, isActive: true }
        });

        if (!salaryStructure) {
          logger.info(`   ⚠️  No salary structure found for ${employee.employeeCode}, skipping...`);
          continue;
        }

        // Get attendance count for the month
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);
        
        const attendanceRecords = await Attendance.findAll({
          where: {
            employeeId: employee.id,
            date: {
              [sequelize.Sequelize.Op.between]: [
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
              ]
            }
          }
        });

        const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
        const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
        const workingDays = presentDays + (halfDays * 0.5);

        // Check if payslip already exists
        const existingPayslip = await Payslip.findOne({
          where: {
            payrollId: payroll.id,
            employeeId: employee.id,
            month: currentMonth,
            year: currentYear
          }
        });

        if (existingPayslip) {
          logger.info(`   ⏭️  Payslip already exists for ${employee.employeeCode}`);
          continue;
        }

        // Calculate pro-rated salary if needed
        const totalDaysInMonth = endDate.getDate();
        const proratedFactor = workingDays / totalDaysInMonth;

        const grossSalary = parseFloat(salaryStructure.grossSalary) * proratedFactor;
        const totalDeductions = parseFloat(salaryStructure.deductions?.pf || 0) + 
                               parseFloat(salaryStructure.deductions?.esi || 0);
        const netSalary = grossSalary - totalDeductions;

        // Create payslip
        await Payslip.create({
          payrollId: payroll.id,
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear,
          earnings: {
            basic: parseFloat(salaryStructure.basicSalary) * proratedFactor,
            hra: parseFloat(salaryStructure.hra) * proratedFactor,
            specialAllowance: parseFloat(salaryStructure.specialAllowance) * proratedFactor,
            otherAllowances: salaryStructure.otherAllowances || {},
            adjustedGrossSalary: grossSalary
          },
          deductions: {
            pf: parseFloat(salaryStructure.deductions?.pf || 0),
            esi: parseFloat(salaryStructure.deductions?.esi || 0),
            totalDeductions: totalDeductions
          },
          grossSalary,
          totalDeductions,
          netSalary,
          daysWorked: totalDaysInMonth,
          daysPresent: presentDays + halfDays,
          daysAbsent: totalDaysInMonth - (presentDays + halfDays)
        });

        payslipCount++;
        logger.info(`   ✅ Created payslip for ${employee.employeeCode}`);
      } catch (error) {
        logger.error(`   ❌ Error creating payslip for ${employee.employeeCode}:`, error.message);
      }
    }

    // Update payroll status
    if (payslipCount > 0) {
      payroll.status = 'finalized';
      payroll.totalEmployees = payslipCount;
      payroll.finalizedBy = adminUser ? adminUser.id : null;
      payroll.finalizedAt = new Date();
      await payroll.save();
      logger.info(`   ✅ Finalized payroll with ${payslipCount} payslips`);
    }

    // 2. Update IT Declarations to Submitted Status
    logger.info('\n📋 Updating IT Declarations...');
    
    const itDeclarations = await ITDeclaration.findAll({
      where: {
        employeeId: { [sequelize.Sequelize.Op.in]: employees.map(e => e.id) },
        financialYear
      }
    });

    let updatedITDeclarations = 0;
    for (const itDecl of itDeclarations) {
      if (itDecl.status !== 'submitted') {
        itDecl.status = 'submitted';
        itDecl.submittedAt = new Date();
        await itDecl.save();
        updatedITDeclarations++;
      }
    }

    logger.info(`   ✅ Updated ${updatedITDeclarations} IT declarations to submitted status`);

    // Summary
    logger.info('\n📊 Summary:');
    logger.info(`   Payslips Created: ${payslipCount}`);
    logger.info(`   IT Declarations Updated: ${updatedITDeclarations}`);
    logger.info('\n✅ Payslips and IT declarations completed!');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Error creating payslips and IT declarations:', error);
    await sequelize.close();
    process.exit(1);
  }
};

createPayslipsAndITDeclarations();


