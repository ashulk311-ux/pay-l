const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const useSSL = isProduction && process.env.DB_SSL !== 'false';

const commonOptions = {
  dialect: 'postgres',
  logging: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(msg);
    }
  },
  dialectOptions: {
    ssl: useSSL ? { require: true, rejectUnauthorized: false } : false
  },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  define: { timestamps: true, underscored: true, freezeTableName: false }
};

// Render/Heroku provide DATABASE_URL; use it when set so connection works without separate DB_* vars
const databaseUrl = process.env.DATABASE_URL;
const isPostgresUrl = databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));
const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      ...commonOptions,
      dialectOptions: {
        ...commonOptions.dialectOptions,
        ssl: isPostgresUrl && useSSL ? { require: true, rejectUnauthorized: false } : false
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'payroll_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        ...commonOptions
      }
    );

module.exports = { sequelize, Sequelize };

