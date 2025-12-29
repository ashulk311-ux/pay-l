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

const {
  Company,
  User,
  Role,
  Branch,
  Department,
  Designation,
  Region,
  EmailTemplate,
  NewsPolicy,
  Employee,
  SalaryStructure,
  Attendance,
  Leave,
  LeaveType,
  LeaveBalance,
  HolidayCalendar,
  Loan,
  LoanEMI,
  Reimbursement,
  ReimbursementCategory,
  ReimbursementPolicy,
  ReimbursementWorkflowConfig,
  SupplementarySalary,
  SalaryIncrement,
  Payroll,
  Payslip,
  StatutoryConfig,
  OfficeLocation,
  BiometricDevice
} = models;

const seedCompanyAdminTestData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Get Company Admin's company (Default Company)
    const company = await Company.findOne({ where: { code: 'DEFAULT' } });
    if (!company) {
      console.error('❌ Default company not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    console.log(`📦 Seeding test data for Company: ${company.name} (${company.code})\n`);

    // 1. BRANCHES
    console.log('1️⃣  Creating Branches...');
    const branches = [];
    const branchData = [
      { name: 'Head Office', code: 'HO', address: '123 Main Street, Business District', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+91-22-12345678' },
      { name: 'Bangalore Branch', code: 'BLR', address: '456 Tech Park, IT Corridor', city: 'Bangalore', state: 'Karnataka', pincode: '560001', phone: '+91-80-87654321' },
      { name: 'Delhi Branch', code: 'DEL', address: '789 Business Center, Connaught Place', city: 'Delhi', state: 'Delhi', pincode: '110001', phone: '+91-11-11223344' },
      { name: 'Pune Branch', code: 'PUN', address: '321 IT Park, Hinjewadi', city: 'Pune', state: 'Maharashtra', pincode: '411057', phone: '+91-20-55667788' }
    ];

    for (const data of branchData) {
      const [branch, created] = await Branch.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      branches.push(branch);
      if (created) console.log(`   ✅ Created branch: ${branch.name} (${branch.code})`);
    }
    console.log(`   📊 Total branches: ${branches.length}\n`);

    // 2. DEPARTMENTS
    console.log('2️⃣  Creating Departments...');
    const departments = [];
    const departmentData = [
      { name: 'Human Resources', code: 'HR', description: 'HR and Talent Management' },
      { name: 'Information Technology', code: 'IT', description: 'IT Services and Development' },
      { name: 'Finance', code: 'FIN', description: 'Finance and Accounting' },
      { name: 'Sales', code: 'SALES', description: 'Sales and Business Development' },
      { name: 'Marketing', code: 'MKT', description: 'Marketing and Communications' },
      { name: 'Operations', code: 'OPS', description: 'Operations and Administration' },
      { name: 'Customer Support', code: 'CS', description: 'Customer Support and Service' }
    ];

    for (const data of departmentData) {
      const [dept, created] = await Department.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      departments.push(dept);
      if (created) console.log(`   ✅ Created department: ${dept.name} (${dept.code})`);
    }
    console.log(`   📊 Total departments: ${departments.length}\n`);

    // 3. DESIGNATIONS
    console.log('3️⃣  Creating Designations...');
    const designations = [];
    const designationData = [
      { name: 'Chief Executive Officer', code: 'CEO', level: 1, description: 'Top management' },
      { name: 'Chief Technology Officer', code: 'CTO', level: 2, description: 'Technology leadership' },
      { name: 'Vice President', code: 'VP', level: 3, description: 'Senior management' },
      { name: 'Director', code: 'DIR', level: 4, description: 'Department head' },
      { name: 'Senior Manager', code: 'SM', level: 5, description: 'Senior management role' },
      { name: 'Manager', code: 'MGR', level: 6, description: 'Management role' },
      { name: 'Senior Software Engineer', code: 'SSE', level: 7, description: 'Senior technical role' },
      { name: 'Software Engineer', code: 'SE', level: 8, description: 'Technical role' },
      { name: 'Associate', code: 'ASSOC', level: 9, description: 'Entry level' },
      { name: 'Intern', code: 'INT', level: 10, description: 'Internship role' }
    ];

    for (const data of designationData) {
      const [desig, created] = await Designation.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      designations.push(desig);
      if (created) console.log(`   ✅ Created designation: ${desig.name} (${desig.code})`);
    }
    console.log(`   📊 Total designations: ${designations.length}\n`);

    // 4. REGIONS
    console.log('4️⃣  Creating Regions...');
    const regions = [];
    const regionData = [
      { name: 'North India', code: 'NORTH', state: 'Delhi', country: 'India', description: 'Northern region operations' },
      { name: 'South India', code: 'SOUTH', state: 'Karnataka', country: 'India', description: 'Southern region operations' },
      { name: 'West India', code: 'WEST', state: 'Maharashtra', country: 'India', description: 'Western region operations' },
      { name: 'East India', code: 'EAST', state: 'West Bengal', country: 'India', description: 'Eastern region operations' }
    ];

    for (const data of regionData) {
      const [region, created] = await Region.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      regions.push(region);
      if (created) console.log(`   ✅ Created region: ${region.name} (${region.code})`);
    }
    console.log(`   📊 Total regions: ${regions.length}\n`);

    // 5. EMAIL TEMPLATES
    console.log('5️⃣  Creating Email Templates...');
    const emailTemplates = [];
    const templateData = [
      {
        name: 'Birthday Greeting',
        subject: 'Happy Birthday {{employeeName}}!',
        body: '<h2>Happy Birthday!</h2><p>Dear {{employeeName}},</p><p>Wishing you a very happy birthday! May this special day bring you joy and happiness.</p><p>Best regards,<br>{{companyName}} Team</p>',
        type: 'birthday',
        variables: ['employeeName', 'companyName'],
        isActive: true
      },
      {
        name: 'Work Anniversary',
        subject: 'Congratulations on your {{years}} year anniversary!',
        body: '<h2>Work Anniversary</h2><p>Dear {{employeeName}},</p><p>Congratulations on completing {{years}} years with {{companyName}}! Thank you for your dedication and contribution.</p><p>Best regards,<br>{{companyName}} Team</p>',
        type: 'anniversary',
        variables: ['employeeName', 'companyName', 'years'],
        isActive: true
      },
      {
        name: 'Welcome Email',
        subject: 'Welcome to {{companyName}}!',
        body: '<h2>Welcome Aboard!</h2><p>Dear {{employeeName}},</p><p>Welcome to {{companyName}}! We are excited to have you on board.</p><p>Your employee ID is: {{employeeCode}}</p><p>Best regards,<br>HR Team</p>',
        type: 'welcome',
        variables: ['employeeName', 'companyName', 'employeeCode'],
        isActive: true
      },
      {
        name: 'Payslip Notification',
        subject: 'Your payslip for {{month}} {{year}}',
        body: '<h2>Payslip Available</h2><p>Dear {{employeeName}},</p><p>Your payslip for {{month}} {{year}} is now available in your portal.</p><p>Best regards,<br>Payroll Team</p>',
        type: 'payslip',
        variables: ['employeeName', 'month', 'year'],
        isActive: true
      }
    ];

    for (const data of templateData) {
      const { code, ...templateFields } = data; // Remove code field
      const [template, created] = await EmailTemplate.findOrCreate({
        where: { companyId: company.id, type: data.type, name: data.name },
        defaults: { ...templateFields, companyId: company.id }
      });
      emailTemplates.push(template);
      if (created) console.log(`   ✅ Created email template: ${template.name} (${template.type})`);
    }
    console.log(`   📊 Total email templates: ${emailTemplates.length}\n`);

    // 6. NEWS & POLICIES
    console.log('6️⃣  Creating News & Policies...');
    const newsPolicies = [];
    const newsData = [
      {
        title: 'Annual Company Meeting 2024',
        type: 'news',
        content: '<h2>Annual Company Meeting</h2><p>We are pleased to announce our Annual Company Meeting will be held on December 15, 2024. All employees are invited to attend.</p><p>Venue: Main Conference Hall<br>Time: 3:00 PM</p>',
        isPublished: true,
        publishDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: 'Leave Policy Update',
        type: 'policy',
        content: '<h2>Updated Leave Policy</h2><p>Please note that our leave policy has been updated effective January 1, 2024. Key changes include:</p><ul><li>Increased annual leave from 15 to 20 days</li><li>New work-from-home policy</li><li>Flexible working hours option</li></ul>',
        isPublished: true,
        publishDate: new Date(),
        expiryDate: null
      },
      {
        title: 'Holiday Calendar 2024',
        type: 'policy',
        content: '<h2>Holiday Calendar</h2><p>The holiday calendar for 2024 has been published. Please check the HR portal for the complete list of holidays.</p>',
        isPublished: true,
        publishDate: new Date(),
        expiryDate: new Date('2024-12-31')
      },
      {
        title: 'New Employee Onboarding Program',
        type: 'news',
        content: '<h2>Enhanced Onboarding</h2><p>We have launched a new comprehensive onboarding program for all new employees. This includes orientation sessions, buddy program, and training modules.</p>',
        isPublished: true,
        publishDate: new Date(),
        expiryDate: null
      }
    ];

    for (const data of newsData) {
      const newsFields = {
        ...data,
        companyId: company.id,
        publishedAt: data.publishDate,
        expiresAt: data.expiryDate
      };
      delete newsFields.publishDate;
      delete newsFields.expiryDate;
      
      const [news, created] = await NewsPolicy.findOrCreate({
        where: { companyId: company.id, title: data.title },
        defaults: newsFields
      });
      newsPolicies.push(news);
      if (created) console.log(`   ✅ Created ${news.type}: ${news.title}`);
    }
    console.log(`   📊 Total news & policies: ${newsPolicies.length}\n`);

    // 7. OFFICE LOCATIONS (for GPS Attendance)
    console.log('7️⃣  Creating Office Locations...');
    const officeLocations = [];
    const locationData = [
      {
        locationName: 'Head Office - Main Building',
        address: '123 Main Street, Business District, Mumbai',
        latitude: 19.0760,
        longitude: 72.8777,
        allowedRadius: 100, // 100 meters
        isDefault: true,
        branchId: branches[0]?.id,
        workingHours: { start: '09:00', end: '18:00' },
        timezone: 'Asia/Kolkata'
      },
      {
        locationName: 'Bangalore Office',
        address: '456 Tech Park, IT Corridor, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        allowedRadius: 150,
        isDefault: false,
        branchId: branches[1]?.id,
        workingHours: { start: '09:00', end: '18:00' },
        timezone: 'Asia/Kolkata'
      }
    ];

    for (const data of locationData) {
      const [location, created] = await OfficeLocation.findOrCreate({
        where: { companyId: company.id, locationName: data.locationName },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      officeLocations.push(location);
      if (created) console.log(`   ✅ Created office location: ${location.locationName}`);
    }
    console.log(`   📊 Total office locations: ${officeLocations.length}\n`);

    // 8. LEAVE TYPES
    console.log('8️⃣  Creating Leave Types...');
    const leaveTypes = [];
    const leaveTypeData = [
      { name: 'Casual Leave', code: 'CL', maxDays: 12, isPaid: true, carryForward: true, description: 'Casual leave for personal work' },
      { name: 'Sick Leave', code: 'SL', maxDays: 12, isPaid: true, carryForward: true, description: 'Medical leave' },
      { name: 'Privilege Leave', code: 'PL', maxDays: 15, isPaid: true, carryForward: true, description: 'Annual leave' },
      { name: 'Compensatory Off', code: 'CO', maxDays: 5, isPaid: true, carryForward: false, description: 'Compensatory leave' },
      { name: 'Leave Without Pay', code: 'LWP', maxDays: 30, isPaid: false, carryForward: false, description: 'Unpaid leave' }
    ];

    for (const data of leaveTypeData) {
      const [leaveType, created] = await LeaveType.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      leaveTypes.push(leaveType);
      if (created) console.log(`   ✅ Created leave type: ${leaveType.name} (${leaveType.code})`);
    }
    console.log(`   📊 Total leave types: ${leaveTypes.length}\n`);

    // 9. HOLIDAY CALENDAR
    console.log('9️⃣  Creating Holiday Calendar...');
    const holidays = [];
    const currentYear = new Date().getFullYear();
    const holidayData = [
      { name: 'New Year', date: new Date(`${currentYear}-01-01`), year: currentYear, isActive: true },
      { name: 'Republic Day', date: new Date(`${currentYear}-01-26`), year: currentYear, isActive: true },
      { name: 'Holi', date: new Date(`${currentYear}-03-25`), year: currentYear, isActive: true },
      { name: 'Independence Day', date: new Date(`${currentYear}-08-15`), year: currentYear, isActive: true },
      { name: 'Gandhi Jayanti', date: new Date(`${currentYear}-10-02`), year: currentYear, isActive: true },
      { name: 'Diwali', date: new Date(`${currentYear}-11-01`), year: currentYear, isActive: true },
      { name: 'Christmas', date: new Date(`${currentYear}-12-25`), year: currentYear, isActive: true }
    ];

    for (const data of holidayData) {
      const [holiday, created] = await HolidayCalendar.findOrCreate({
        where: { companyId: company.id, date: data.date, name: data.name },
        defaults: { ...data, companyId: company.id }
      });
      holidays.push(holiday);
      if (created) console.log(`   ✅ Created holiday: ${holiday.name} (${holiday.date})`);
    }
    console.log(`   📊 Total holidays: ${holidays.length}\n`);

    // 10. REIMBURSEMENT CATEGORIES
    console.log('🔟 Creating Reimbursement Categories...');
    const reimbursementCategories = [];
    const categoryData = [
      { name: 'Travel', code: 'TRAVEL', isTaxable: false, description: 'Travel expenses' },
      { name: 'Food & Beverages', code: 'FOOD', isTaxable: true, description: 'Food and beverage expenses' },
      { name: 'Internet & Phone', code: 'COMM', isTaxable: false, description: 'Communication expenses' },
      { name: 'Medical', code: 'MED', isTaxable: false, description: 'Medical expenses' },
      { name: 'Office Supplies', code: 'SUPPLIES', isTaxable: false, description: 'Office supplies and equipment' }
    ];

    for (const data of categoryData) {
      const [category, created] = await ReimbursementCategory.findOrCreate({
        where: { companyId: company.id, code: data.code },
        defaults: { ...data, companyId: company.id, isActive: true }
      });
      reimbursementCategories.push(category);
      if (created) console.log(`   ✅ Created reimbursement category: ${category.name} (${category.code})`);
    }
    console.log(`   📊 Total reimbursement categories: ${reimbursementCategories.length}\n`);

    // Summary
    console.log('\n✅ Company Admin Test Data Seeding Completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Branches: ${branches.length}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Designations: ${designations.length}`);
    console.log(`   - Regions: ${regions.length}`);
    console.log(`   - Email Templates: ${emailTemplates.length}`);
    console.log(`   - News & Policies: ${newsPolicies.length}`);
    console.log(`   - Office Locations: ${officeLocations.length}`);
    console.log(`   - Leave Types: ${leaveTypes.length}`);
    console.log(`   - Holidays: ${holidays.length}`);
    console.log(`   - Reimbursement Categories: ${reimbursementCategories.length}`);
    console.log('\n🎉 All Company Admin tabs now have test data!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Company Admin test data:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

seedCompanyAdminTestData();

