const path = require('path');
const { sequelize } = require(path.join(__dirname, '../../backend/src/config/database'));
require(path.join(__dirname, '../../backend/src/models'));
const { Role, Permission } = require(path.join(__dirname, '../../backend/src/models'));

/**
 * Seed Role-Based Access Control
 * 
 * Role Access Areas:
 * - Super Admin: All modules + Global Setup
 * - HR/Admin: Employee + Payroll + Attendance
 * - Finance: Salary Processing + Statutory Reports
 * - Employee: Self-service portal
 * - Auditor: Read-only access to all data
 */

const seedRoleBasedAccess = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models
    await Permission.sync({ alter: false });
    console.log('Permission model synchronized.');

    // Define all permissions
    const permissions = [
      // Global Setup permissions
      { name: 'manage_global_setup', module: 'global', description: 'Manage global setup and configuration' },
      { name: 'view_global_setup', module: 'global', description: 'View global setup' },
      
      // Company Management permissions
      { name: 'manage_companies', module: 'company', description: 'Create, update, delete companies' },
      { name: 'view_companies', module: 'company', description: 'View companies' },
      { name: 'manage_company_setup', module: 'company', description: 'Manage company setup (branches, departments, etc.)' },
      
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
      
      // Statutory permissions
      { name: 'view_statutory', module: 'statutory', description: 'View statutory configurations' },
      { name: 'manage_statutory', module: 'statutory', description: 'Manage statutory configurations' },
      
      // Reports permissions
      { name: 'view_reports', module: 'reports', description: 'View reports' },
      { name: 'view_audit_logs', module: 'reports', description: 'View audit logs' },
      { name: 'manage_reports', module: 'reports', description: 'Create and manage custom reports' },
      
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
      { name: 'manage_increment', module: 'increment', description: 'Create, manage salary increments' },
      
      // Analytics permissions
      { name: 'view_analytics', module: 'analytics', description: 'View analytics and dashboards' },
      
      // Biometric permissions
      { name: 'view_biometric', module: 'biometric', description: 'View biometric devices' },
      { name: 'manage_biometric', module: 'biometric', description: 'Manage biometric devices' },
      
      // Office Location permissions
      { name: 'view_office_location', module: 'attendance', description: 'View office locations' },
      { name: 'manage_office_location', module: 'attendance', description: 'Manage office locations' },
      
      // HR Letters permissions
      { name: 'view_hr_letters', module: 'hr_letters', description: 'View HR letters' },
      { name: 'manage_hr_letters', module: 'hr_letters', description: 'Generate HR letters' },
      
      // Government API permissions
      { name: 'view_government_api', module: 'government', description: 'View government API integrations' },
      { name: 'manage_government_api', module: 'government', description: 'Manage government API integrations' }
    ];

    // Create or update permissions
    for (const perm of permissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
    }
    console.log(`✅ ${permissions.length} permissions processed.`);

    // Helper function to assign permissions
    const assignPermissions = async (role, permissionNames) => {
      const perms = await Permission.findAll({
        where: { name: { [require('sequelize').Op.in]: permissionNames } }
      });
      await role.setPermissions(perms);
      console.log(`   ✓ Assigned ${perms.length} permissions to ${role.name}`);
    };

    // Get or create roles
    const superAdminRole = await Role.findOrCreate({
      where: { name: 'Super Admin' },
      defaults: { description: 'Full system access including global setup', isSystemRole: true }
    }).then(([role]) => role);

    const companyAdminRole = await Role.findOrCreate({
      where: { name: 'Company Admin' },
      defaults: { description: 'Company management and user creation', isSystemRole: true }
    }).then(([role]) => role);

    const hrAdminRole = await Role.findOrCreate({
      where: { name: 'HR/Admin' },
      defaults: { description: 'Employee, Payroll, and Attendance management', isSystemRole: true }
    }).then(([role]) => role);

    const financeRole = await Role.findOrCreate({
      where: { name: 'Finance' },
      defaults: { description: 'Salary Processing and Statutory Reports', isSystemRole: true }
    }).then(([role]) => role);

    const employeeRole = await Role.findOrCreate({
      where: { name: 'Employee' },
      defaults: { description: 'Self-service portal access', isSystemRole: true }
    }).then(([role]) => role);

    const auditorRole = await Role.findOrCreate({
      where: { name: 'Auditor' },
      defaults: { description: 'Read-only access to all data', isSystemRole: true }
    }).then(([role]) => role);

    // Assign permissions to Super Admin - ALL permissions
    await assignPermissions(superAdminRole, permissions.map(p => p.name));

    // Assign permissions to Company Admin - Company management + HR/Admin permissions
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
      'view_statutory',
      'view_reports',
      'view_analytics',
      'view_hr_letters',
      'manage_hr_letters',
      'view_office_location',
      'manage_office_location',
      'view_biometric',
      'manage_biometric'
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
      'view_hr_letters',
      'manage_hr_letters',
      'view_office_location',
      'manage_office_location',
      'view_biometric',
      'manage_biometric'
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
      'manage_reports',
      'view_analytics',
      'view_government_api',
      'manage_government_api',
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
      'view_statutory',
      'view_reports',
      'view_audit_logs',
      'view_analytics',
      'view_biometric',
      'view_office_location',
      'view_hr_letters',
      'view_government_api',
      'view_companies',
      'view_global_setup'
    ]);

    // Employee role - No backend permissions (uses portal routes only)
    await assignPermissions(employeeRole, []);

    console.log('\n✅ Role-based access control seeded successfully!');
    console.log('\n📋 Role Access Summary:');
    console.log('   - Super Admin: All modules + Global Setup (*)');
    console.log('   - Company Admin: Company management + HR/Admin permissions');
    console.log('   - HR/Admin: Employee + Payroll + Attendance');
    console.log('   - Finance: Salary Processing + Statutory Reports');
    console.log('   - Employee: Self-service portal (no backend permissions)');
    console.log('   - Auditor: Read-only access to all data');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding role-based access:', error);
    process.exit(1);
  }
};

seedRoleBasedAccess();

