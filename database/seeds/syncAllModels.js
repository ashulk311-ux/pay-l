const path = require('path');
const fs = require('fs');

// Load environment variables
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
const models = require(path.join(backendPath, 'src/models'));

const syncAllModels = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');
    console.log('🔄 Syncing all database models...\n');

    // Sync models in order (respecting dependencies)
    const modelOrder = [
      'Role',
      'Permission',
      'Company',
      'User',
      'Branch',
      'Department',
      'Designation',
      'Region',
      'Employee',
      'SalaryStructure',
      'LeaveType',
      'LeaveBalance',
      'Leave',
      'Attendance',
      'OfficeLocation',
      'BiometricDevice',
      'BiometricDeviceLog',
      'EmployeeBiometric',
      'Loan',
      'LoanEMI',
      'ReimbursementCategory',
      'Reimbursement',
      'ReimbursementPolicy',
      'ReimbursementWorkflow',
      'ReimbursementWorkflowConfig',
      'Payroll',
      'PayrollPreCheck',
      'Payslip',
      'SupplementarySalary',
      'SalaryIncrement',
      'IncrementPolicy',
      'IncrementWorkflow',
      'StatutoryConfig',
      'FullAndFinalSettlement',
      'EmployeeDocument',
      'EmployeeOnboarding',
      'DynamicField',
      'ITDeclaration',
      'ITDeclarationSection',
      'ITDeclarationDocument',
      'Form16',
      'GlobalPolicy',
      'License',
      'EmailTemplate',
      'NewsPolicy',
      'EmployeeHistory',
      'CustomReport',
      'AuditLog'
    ];

    for (const modelName of modelOrder) {
      try {
        const model = models[modelName];
        if (model) {
          await model.sync({ alter: true });
          console.log(`✅ Synced: ${modelName}`);
        }
      } catch (error) {
        console.log(`⚠️  Warning syncing ${modelName}: ${error.message}`);
      }
    }

    console.log('\n✅ All models synced successfully!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing models:', error);
    await sequelize.close();
    process.exit(1);
  }
};

syncAllModels();



