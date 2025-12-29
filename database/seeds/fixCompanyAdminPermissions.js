const path = require('path');
const backendPath = path.join(__dirname, '../../backend');
const { sequelize } = require(path.join(backendPath, 'src/config/database'));

// Load all models with associations
require(path.join(backendPath, 'src/models'));
const { Role, Permission } = require(path.join(backendPath, 'src/models'));

const fixCompanyAdminPermissions = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Get Company Admin role
    const companyAdminRole = await Role.findOne({ where: { name: 'Company Admin' } });
    if (!companyAdminRole) {
      console.error('Company Admin role not found!');
      process.exit(1);
    }

    // Get all required permissions
    const permissionNames = [
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
    ];

    const permissions = await Permission.findAll({
      where: { name: { [require('sequelize').Op.in]: permissionNames } }
    });

    if (permissions.length === 0) {
      console.error('No permissions found! Please run seedPermissions.js first.');
      process.exit(1);
    }

    // Assign permissions to Company Admin
    await companyAdminRole.setPermissions(permissions);
    console.log(`✅ Assigned ${permissions.length} permissions to Company Admin role`);

    // Verify
    const roleWithPerms = await Role.findByPk(companyAdminRole.id, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
    });
    console.log(`\n✅ Verification: Company Admin now has ${roleWithPerms.permissions.length} permissions`);
    console.log(`   Permissions: ${roleWithPerms.permissions.map(p => p.name).join(', ')}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing Company Admin permissions:', error);
    await sequelize.close();
    process.exit(1);
  }
};

fixCompanyAdminPermissions();



