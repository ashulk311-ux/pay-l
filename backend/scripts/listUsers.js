/**
 * List all users from the database (email, role, company).
 * Passwords are stored hashed and cannot be retrieved.
 */
require('dotenv').config();
const path = require('path');
const backendPath = path.join(__dirname, '..');
const { sequelize } = require(path.join(backendPath, 'src/config/database'));

require(path.join(backendPath, 'src/models'));
const { User, Role, Company } = require(path.join(backendPath, 'src/models'));

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.\n');

    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Company, as: 'company', attributes: ['id', 'name', 'code'], required: false }
      ],
      order: [['email', 'ASC']]
    });

    if (users.length === 0) {
      console.log('No users found. Run: npm run seed (or node database/seeds/seedDefaultData.js)');
      await sequelize.close();
      process.exit(0);
      return;
    }

    console.log('📋 Users in database:');
    console.log('─'.repeat(80));
    users.forEach((u, i) => {
      const role = u.role ? u.role.name : '-';
      const company = u.company ? `${u.company.name} (${u.company.code})` : '-';
      const active = u.isActive ? '✓' : '✗';
      console.log(`${(i + 1).toString().padStart(2)}. ${u.email.padEnd(35)} ${role.padEnd(18)} ${company.padEnd(25)} ${active}`);
    });
    console.log('─'.repeat(80));
    console.log(`Total: ${users.length} user(s)\n`);
    console.log('Note: Passwords are hashed in the DB and cannot be retrieved.');
    console.log('Use seed defaults (e.g. admin@example.com / admin123) or create a new admin with createCompanyAdmin.js.\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
