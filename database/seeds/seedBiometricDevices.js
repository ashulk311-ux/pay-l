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
  Branch,
  BiometricDevice
} = models;

const seedBiometricDevices = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Get Company Admin's company (Default Company)
    const company = await Company.findOne({ where: { code: 'DEFAULT' } });
    if (!company) {
      console.error('❌ Default company not found. Please run seedDefaultData.js first.');
      process.exit(1);
    }

    // Get branches
    const branches = await Branch.findAll({ where: { companyId: company.id }, limit: 3 });

    console.log(`📦 Seeding biometric devices for Company: ${company.name} (${company.code})\n`);

    // Helper function to generate API credentials
    const generateApiCredentials = () => {
      const crypto = require('crypto');
      const apiKey = `bio_${crypto.randomBytes(16).toString('hex')}`;
      const apiSecret = crypto.randomBytes(32).toString('hex');
      return { apiKey, apiSecret };
    };

    // Create Biometric Devices
    console.log('1️⃣  Creating Biometric Devices...');
    const deviceData = [
      {
        deviceName: 'Fingerprint Scanner - Main Entrance',
        deviceSerialNumber: 'BIO001',
        deviceType: 'fingerprint',
        ipAddress: '192.168.1.100',
        port: 8080,
        location: 'Main Entrance',
        branchId: branches[0]?.id,
        isActive: true
      },
      {
        deviceName: 'Face Recognition - HR Department',
        deviceSerialNumber: 'BIO002',
        deviceType: 'face',
        ipAddress: '192.168.1.101',
        port: 8080,
        location: 'HR Department',
        branchId: branches[0]?.id,
        isActive: true
      },
      {
        deviceName: 'Fingerprint Scanner - Bangalore Office',
        deviceSerialNumber: 'BIO003',
        deviceType: 'fingerprint',
        ipAddress: '192.168.1.102',
        port: 8080,
        location: 'Bangalore Office',
        branchId: branches[1]?.id,
        isActive: true
      }
    ];

    const devices = [];
    for (const data of deviceData) {
      const credentials = generateApiCredentials();
      const deviceFields = {
        ...data,
        companyId: company.id,
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret
      };
      
      const [device, created] = await BiometricDevice.findOrCreate({
        where: { companyId: company.id, deviceSerialNumber: data.deviceSerialNumber },
        defaults: deviceFields
      });
      devices.push(device);
      if (created) {
        console.log(`   ✅ Created device: ${device.deviceName} (${device.deviceSerialNumber})`);
      } else {
        console.log(`   ℹ️  Device already exists: ${device.deviceName} (${device.deviceSerialNumber})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Biometric Devices: ${devices.length}`);
    console.log('\n🎉 Biometric devices test data created!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding biometric devices:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
};

seedBiometricDevices();

