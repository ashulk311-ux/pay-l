const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
require('../src/models'); // Load all models with associations
const { Company, Employee, Department, Designation, Branch } = require('../src/models');
const logger = require('../src/utils/logger');

const testEmployees = [
  {
    employeeCode: 'TST001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test2.com',
    phone: '9876543210',
    dateOfBirth: new Date('1990-05-15'),
    dateOfJoining: new Date('2023-01-15'),
    designation: 'Software Engineer',
    department: 'Engineering',
    branch: 'Mumbai',
    pan: 'ABCDE1234F',
    aadhaar: '123456789012',
    uan: '123456789012',
    bankAccountNumber: '1234567890',
    bankIfsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    address: '123 Main Street, Mumbai',
    isActive: true
  },
  {
    employeeCode: 'TST002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@test2.com',
    phone: '9876543211',
    dateOfBirth: new Date('1992-08-20'),
    dateOfJoining: new Date('2023-02-01'),
    designation: 'Senior Software Engineer',
    department: 'Engineering',
    branch: 'Mumbai',
    pan: 'FGHIJ5678K',
    aadhaar: '234567890123',
    uan: '234567890123',
    bankAccountNumber: '2345678901',
    bankIfsc: 'ICIC0005678',
    bankName: 'ICICI Bank',
    address: '456 Park Avenue, Mumbai',
    isActive: true
  },
  {
    employeeCode: 'TST003',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@test2.com',
    phone: '9876543212',
    dateOfBirth: new Date('1988-12-10'),
    dateOfJoining: new Date('2022-11-01'),
    designation: 'Product Manager',
    department: 'Product',
    branch: 'Delhi',
    pan: 'KLMNO9012P',
    aadhaar: '345678901234',
    uan: '345678901234',
    bankAccountNumber: '3456789012',
    bankIfsc: 'SBIN0009012',
    bankName: 'State Bank of India',
    address: '789 Business Park, Delhi',
    isActive: true
  },
  {
    employeeCode: 'TST004',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@test2.com',
    phone: '9876543213',
    dateOfBirth: new Date('1995-03-25'),
    dateOfJoining: new Date('2023-03-15'),
    designation: 'HR Manager',
    department: 'Human Resources',
    branch: 'Mumbai',
    pan: 'PQRST3456U',
    aadhaar: '456789012345',
    uan: '456789012345',
    bankAccountNumber: '4567890123',
    bankIfsc: 'AXIS0003456',
    bankName: 'Axis Bank',
    address: '321 Corporate Tower, Mumbai',
    isActive: true
  },
  {
    employeeCode: 'TST005',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@test2.com',
    phone: '9876543214',
    dateOfBirth: new Date('1991-07-18'),
    dateOfJoining: new Date('2023-04-01'),
    designation: 'QA Engineer',
    department: 'Quality Assurance',
    branch: 'Bangalore',
    pan: 'VWXYZ7890A',
    aadhaar: '567890123456',
    uan: '567890123456',
    bankAccountNumber: '5678901234',
    bankIfsc: 'KOTAK0007890',
    bankName: 'Kotak Mahindra Bank',
    address: '654 Tech Hub, Bangalore',
    isActive: true
  },
  {
    employeeCode: 'TST006',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@test2.com',
    phone: '9876543215',
    dateOfBirth: new Date('1993-09-30'),
    dateOfJoining: new Date('2023-05-10'),
    designation: 'UI/UX Designer',
    department: 'Design',
    branch: 'Mumbai',
    pan: 'BCDEF2345G',
    aadhaar: '678901234567',
    uan: '678901234567',
    bankAccountNumber: '6789012345',
    bankIfsc: 'HDFC0002345',
    bankName: 'HDFC Bank',
    address: '987 Design Studio, Mumbai',
    isActive: true
  },
  {
    employeeCode: 'TST007',
    firstName: 'Robert',
    lastName: 'Miller',
    email: 'robert.miller@test2.com',
    phone: '9876543216',
    dateOfBirth: new Date('1989-11-05'),
    dateOfJoining: new Date('2022-12-01'),
    designation: 'DevOps Engineer',
    department: 'Engineering',
    branch: 'Delhi',
    pan: 'HIJKL6789M',
    aadhaar: '789012345678',
    uan: '789012345678',
    bankAccountNumber: '7890123456',
    bankIfsc: 'ICIC0006789',
    bankName: 'ICICI Bank',
    address: '147 Cloud Center, Delhi',
    isActive: true
  },
  {
    employeeCode: 'TST008',
    firstName: 'Lisa',
    lastName: 'Wilson',
    email: 'lisa.wilson@test2.com',
    phone: '9876543217',
    dateOfBirth: new Date('1994-02-14'),
    dateOfJoining: new Date('2023-06-01'),
    designation: 'Business Analyst',
    department: 'Business',
    branch: 'Mumbai',
    pan: 'NOPQR0123S',
    aadhaar: '890123456789',
    uan: '890123456789',
    bankAccountNumber: '8901234567',
    bankIfsc: 'SBIN0000123',
    bankName: 'State Bank of India',
    address: '258 Analytics Street, Mumbai',
    isActive: true
  },
  {
    employeeCode: 'TST009',
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james.taylor@test2.com',
    phone: '9876543218',
    dateOfBirth: new Date('1990-06-22'),
    dateOfJoining: new Date('2023-07-15'),
    designation: 'Sales Executive',
    department: 'Sales',
    branch: 'Bangalore',
    pan: 'TUVWX4567Y',
    aadhaar: '901234567890',
    uan: '901234567890',
    bankAccountNumber: '9012345678',
    bankIfsc: 'AXIS0004567',
    bankName: 'Axis Bank',
    address: '369 Sales Plaza, Bangalore',
    isActive: true
  },
  {
    employeeCode: 'TST010',
    firstName: 'Maria',
    lastName: 'Anderson',
    email: 'maria.anderson@test2.com',
    phone: '9876543219',
    dateOfBirth: new Date('1992-10-08'),
    dateOfJoining: new Date('2023-08-01'),
    designation: 'Finance Manager',
    department: 'Finance',
    branch: 'Mumbai',
    pan: 'ZABCD8901E',
    aadhaar: '012345678901',
    uan: '012345678901',
    bankAccountNumber: '0123456789',
    bankIfsc: 'KOTAK0008901',
    bankName: 'Kotak Mahindra Bank',
    address: '741 Finance Tower, Mumbai',
    isActive: true
  }
];

const seedTestEmployees = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // Find the test2 company
    const company = await Company.findOne({ where: { name: 'test2' } });
    if (!company) {
      logger.error('Company "test2" not found. Please create the company first.');
      process.exit(1);
    }

    logger.info(`Found company: ${company.name} (${company.code}) - ID: ${company.id}`);

    // Get or create departments, designations, and branches
    const departments = {};
    const designations = {};
    const branches = {};

    for (const emp of testEmployees) {
      // Get or create department
      if (!departments[emp.department]) {
        let dept = await Department.findOne({
          where: { companyId: company.id, name: emp.department }
        });
        if (!dept) {
          dept = await Department.create({
            name: emp.department,
            code: emp.department.substring(0, 3).toUpperCase(),
            companyId: company.id,
            isActive: true
          });
          logger.info(`Created department: ${emp.department}`);
        }
        departments[emp.department] = dept;
      }

      // Get or create designation
      if (!designations[emp.designation]) {
        let desig = await Designation.findOne({
          where: { companyId: company.id, name: emp.designation }
        });
        if (!desig) {
          desig = await Designation.create({
            name: emp.designation,
            code: emp.designation.substring(0, 3).toUpperCase(),
            companyId: company.id,
            isActive: true
          });
          logger.info(`Created designation: ${emp.designation}`);
        }
        designations[emp.designation] = desig;
      }

      // Get or create branch
      if (!branches[emp.branch]) {
        let branch = await Branch.findOne({
          where: { companyId: company.id, name: emp.branch }
        });
        if (!branch) {
          branch = await Branch.create({
            name: emp.branch,
            code: emp.branch.substring(0, 3).toUpperCase(),
            companyId: company.id,
            isActive: true
          });
          logger.info(`Created branch: ${emp.branch}`);
        }
        branches[emp.branch] = branch;
      }
    }

    // Create employees
    let created = 0;
    let skipped = 0;

    for (const empData of testEmployees) {
      // Check if employee already exists
      const existing = await Employee.findOne({
        where: {
          companyId: company.id,
          employeeCode: empData.employeeCode
        }
      });

      if (existing) {
        logger.info(`Employee ${empData.employeeCode} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Get related IDs
      const department = departments[empData.department];
      const designation = designations[empData.designation];
      const branch = branches[empData.branch];

      // Create employee using raw SQL to avoid model field issues
      const [result] = await sequelize.query(`
        INSERT INTO employees (
          id, company_id, employee_code, first_name, last_name, email, phone,
          date_of_birth, date_of_joining, designation, designation_id,
          department, department_id, branch, branch_id,
          pan, aadhaar, uan, bank_account_number, bank_ifsc, bank_name, address,
          kyc_status, is_active, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), :companyId, :employeeCode, :firstName, :lastName, :email, :phone,
          :dateOfBirth, :dateOfJoining, :designation, :designationId,
          :department, :departmentId, :branch, :branchId,
          :pan, :aadhaar, :uan, :bankAccountNumber, :bankIfsc, :bankName, :address,
          'pending', true, NOW(), NOW()
        ) RETURNING id, employee_code, first_name, last_name
      `, {
        replacements: {
          companyId: company.id,
          employeeCode: empData.employeeCode,
          firstName: empData.firstName,
          lastName: empData.lastName,
          email: empData.email,
          phone: empData.phone,
          dateOfBirth: empData.dateOfBirth,
          dateOfJoining: empData.dateOfJoining,
          designation: empData.designation,
          designationId: designation.id,
          department: empData.department,
          departmentId: department.id,
          branch: empData.branch,
          branchId: branch.id,
          pan: empData.pan,
          aadhaar: empData.aadhaar,
          uan: empData.uan,
          bankAccountNumber: empData.bankAccountNumber,
          bankIfsc: empData.bankIfsc,
          bankName: empData.bankName,
          address: empData.address
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      const employee = result[0];

      created++;
      logger.info(`✅ Created employee: ${empData.employeeCode} - ${empData.firstName} ${empData.lastName}`);
    }

    logger.info(`\n📊 Summary:`);
    logger.info(`   Created: ${created} employees`);
    logger.info(`   Skipped: ${skipped} employees (already exist)`);
    logger.info(`   Total: ${testEmployees.length} employees`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Error seeding test employees:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedTestEmployees();

