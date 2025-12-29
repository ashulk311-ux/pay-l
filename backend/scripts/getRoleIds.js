require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { Role, Company } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    const roles = await Role.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] });
    console.log('📋 Available Roles:');
    roles.forEach(r => console.log(`   ${r.name.padEnd(20)} : ${r.id}`));

    const company = await Company.findOne({ where: { code: 'DEFAULT' }, attributes: ['id', 'name', 'code'] });
    if (company) {
      console.log('\n🏢 Default Company:');
      console.log(`   ${company.name} (${company.code})`);
      console.log(`   ID: ${company.id}`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();



