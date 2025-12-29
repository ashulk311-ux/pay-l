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
const { Role, Permission } = require(path.join(backendPath, 'src/models'));

const seedPermissions = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync Permission model
    await Permission.sync({ alter: false });
    console.log('Permission model synchronized.');

    // Define all permissions
    const permissions = [
      // Employee permissions
      { name: 'view_employee', module: 'employee', description: 'View employees' },
      { name: 'manage_employee', module: 'employee', description: 'Create, update, delete employees' },
      
      // Payroll permissions
      { name: 'view_payroll', module: 'payroll', description: 'View payroll records' },
      { name: 'manage_payroll', module: 'payroll', description: 'Create, process, finalize payroll' },
      { name: 'process_salary', module: 'payroll', description: 'Process salary (Finance role)' },
      
      // Attendance permissions
      { name: 'view_attendance', module: 'attendance', description: 'View attendance records' },
      { name: 'manage_attendance', module: 'attendance', description: 'Create, update attendance and manage leaves' },
      
      // Loan permissions
      { name: 'view_loan', module: 'loan', description: 'View loan records' },
      { name: 'manage_loan', module: 'loan', description: 'Create, approve, manage loans' },
      
      // Reimbursement permissions
      { name: 'view_reimbursement', module: 'reimbursement', description: 'View reimbursement records' },
      { name: 'manage_reimbursement', module: 'reimbursement', description: 'Create, approve reimbursements' },
      
      // Supplementary salary permissions
      { name: 'view_supplementary', module: 'supplementary', description: 'View supplementary salary records' },
      { name: 'manage_supplementary', module: 'supplementary', description: 'Create, manage supplementary salary' },
      
      // Increment permissions
      { name: 'view_increment', module: 'increment', description: 'View salary increment records' },
      { name: 'manage_increment', module: 'increment', description: 'Create, approve salary increments' },
      
      // Reports permissions
      { name: 'view_reports', module: 'reports', description: 'View all reports' },
      { name: 'view_audit_logs', module: 'reports', description: 'View audit logs' },
      
      // Statutory permissions
      { name: 'view_statutory', module: 'statutory', description: 'View statutory configurations' },
      { name: 'manage_statutory', module: 'statutory', description: 'Manage statutory configurations' },
      
      // Company management permissions
      { name: 'view_company', module: 'company', description: 'View company details' },
      { name: 'manage_company', module: 'company', description: 'Manage company settings' },
      { name: 'manage_company_users', module: 'company', description: 'Create and manage company users' },
      { name: 'manage_branches', module: 'company', description: 'Manage branches' },
      { name: 'manage_departments', module: 'company', description: 'Manage departments' },
      { name: 'manage_designations', module: 'company', description: 'Manage designations' },
      { name: 'manage_regions', module: 'company', description: 'Manage regions' },
      { name: 'manage_templates', module: 'company', description: 'Manage email templates' },
      { name: 'manage_news_policies', module: 'company', description: 'Manage news and policies' },
      
      // User management (Super Admin only)
      { name: '*', module: 'system', description: 'All permissions (Super Admin)' }
    ];

    // Create permissions
    const createdPermissions = [];
    for (const permData of permissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { name: permData.name },
        defaults: permData
      });
      createdPermissions.push(permission);
      if (created) {
        console.log(`Created permission: ${permission.name}`);
      }
    }

    // Get roles
    const superAdminRole = await Role.findOne({ where: { name: 'Super Admin' } });
    const companyAdminRole = await Role.findOne({ where: { name: 'Company Admin' } });
    const hrAdminRole = await Role.findOne({ where: { name: 'HR/Admin' } });
    const financeRole = await Role.findOne({ where: { name: 'Finance' } });
    const employeeRole = await Role.findOne({ where: { name: 'Employee' } });
    const auditorRole = await Role.findOne({ where: { name: 'Auditor' } });

    if (!superAdminRole || !companyAdminRole || !hrAdminRole || !financeRole || !employeeRole || !auditorRole) {
      console.error('Roles not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    // Helper function to assign permissions to role
    const assignPermissions = async (role, permissionNames) => {
      const perms = createdPermissions.filter(p => permissionNames.includes(p.name));
      if (perms.length > 0) {
        await role.setPermissions(perms);
        console.log(`Assigned ${perms.length} permissions to ${role.name}`);
      }
    };

    // Assign permissions to Super Admin (all permissions)
    await assignPermissions(superAdminRole, ['*']);

    // Assign permissions to Company Admin
    await assignPermissions(companyAdminRole, [
      'view_company',
      'manage_company',
      'manage_company_users',
      'manage_branches',
      'manage_departments',
      'manage_designations',
      'manage_regions',
      'manage_templates',
      'manage_news_policies',
      'view_employee',
      'manage_employee',
      'view_payroll',
      'view_attendance',
      'view_reports'
    ]);

    // Assign permissions to HR/Admin - Employee + Payroll + Attendance
    await assignPermissions(hrAdminRole, [
      'view_employee',
      'manage_employee',
      'view_payroll',
      'manage_payroll',
      'view_attendance',
      'manage_attendance',
      'view_loan',
      'manage_loan',
      'view_reimbursement',
      'manage_reimbursement',
      'view_supplementary',
      'manage_supplementary',
      'view_increment',
      'manage_increment',
      'view_reports'
    ]);

    // Assign permissions to Finance - Salary Processing + Statutory Reports
    await assignPermissions(financeRole, [
      'view_employee', // Need to view employees for payroll
      'view_payroll',
      'process_salary',
      'manage_payroll',
      'view_statutory',
      'manage_statutory',
      'view_reports',
      'view_loan', // View loans for payroll processing
      'view_reimbursement', // View reimbursements for payroll processing
      'view_supplementary', // View supplementary for payroll processing
      'view_increment' // View increments for payroll processing
    ]);

    // Assign permissions to Auditor - Read-only access to all data
    await assignPermissions(auditorRole, [
      'view_employee',
      'view_payroll',
      'view_attendance',
      'view_loan',
      'view_reimbursement',
      'view_supplementary',
      'view_increment',
      'view_reports',
      'view_audit_logs',
      'view_statutory'
    ]);

    // Employee role has no backend permissions (uses portal routes)
    console.log('Employee role uses portal routes (no backend permissions assigned)');

    console.log('\n✅ Permissions seeded successfully!');
    console.log('\n📋 Permission Summary:');
    console.log('   - Super Admin: All permissions (*)');
    console.log('   - Company Admin: Company management, user creation, branches, departments, designations, regions, templates, news/policies');
    console.log('   - HR/Admin: Employee, Payroll, Attendance, Loan, Reimbursement, Supplementary, Increment, Reports');
    console.log('   - Finance: Payroll, Reports, Statutory (view/manage)');
    console.log('   - Auditor: Read-only access to all modules');
    console.log('   - Employee: Portal access only');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding permissions:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedPermissions();

