const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables FIRST before requiring database config
dotenv.config();

// Fail fast if required env vars are missing (prevents 500 on login on Render etc.)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('FATAL: JWT_SECRET must be set and at least 16 characters. Set it in Environment (e.g. Render dashboard).');
  process.exit(1);
}

const { sequelize } = require('./config/database');
const logger = require('./utils/logger');
const { sanitizeBody, sanitizeQuery, sanitizeParams } = require('./utils/sanitize');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { vaptSecurityCheck } = require('./middleware/vaptMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Start scheduled backup jobs
if (process.env.ENABLE_AUTO_BACKUP === 'true') {
  const { startBackupJobs } = require('./jobs/backupJob');
  startBackupJobs();
}

// Enhanced security middleware with VAPT compliance
const vaptSecurity = require('./utils/vaptSecurity');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for API responses
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Additional VAPT security headers
app.use((req, res, next) => {
  Object.entries(vaptSecurity.securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - stricter for auth endpoints
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20, // 20 failed attempts per 15 min (successful logins don't count)
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// VAPT Security check (before parsing body)
app.use(vaptSecurityCheck);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware (apply before routes)
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(sanitizeParams);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/roles', require('./routes/role'));
app.use('/api/global-policy', require('./routes/globalPolicy'));
app.use('/api/company', require('./routes/company'));
app.use('/api/branches', require('./routes/branch'));
app.use('/api/departments', require('./routes/department'));
app.use('/api/sub-departments', require('./routes/subDepartment'));
app.use('/api/designations', require('./routes/designation'));
app.use('/api/regions', require('./routes/region'));
app.use('/api/cost-centers', require('./routes/costCenter'));
app.use('/api/units', require('./routes/unit'));
app.use('/api/grades', require('./routes/grade'));
app.use('/api/levels', require('./routes/level'));
app.use('/api/countries', require('./routes/country'));
app.use('/api/states', require('./routes/state'));
app.use('/api/cities', require('./routes/city'));
app.use('/api/email-templates', require('./routes/emailTemplate'));
app.use('/api/news-policies', require('./routes/newsPolicy'));
app.use('/api/statutory', require('./routes/statutory'));
app.use('/api/form16', require('./routes/form16'));
app.use('/api/employees', require('./routes/employee'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/documents', require('./routes/document'));
app.use('/api/dynamic-fields', require('./routes/dynamicField'));
app.use('/api/matrix', require('./routes/matrix'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/it-declaration', require('./routes/itDeclaration'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/attendance-matrix', require('./routes/attendanceMatrix'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/leave-master', require('./routes/leaveMaster'));
app.use('/api/loan', require('./routes/loan'));
app.use('/api/reimbursement', require('./routes/reimbursement'));
app.use('/api/reimbursement-master', require('./routes/reimbursementMaster'));
app.use('/api/supplementary', require('./routes/supplementary'));
app.use('/api/full-and-final', require('./routes/fullAndFinal'));
app.use('/api/increment', require('./routes/increment'));
app.use('/api/increment-policy', require('./routes/incrementPolicy'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/biometric', require('./routes/biometric'));
app.use('/api/government', require('./routes/governmentApi'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/hr-letters', require('./routes/hrLetters'));
app.use('/api/gps-attendance', require('./routes/gpsAttendance'));
app.use('/api/office-locations', require('./routes/officeLocation'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/gdpr', require('./routes/gdpr'));
app.use('/api/backup', require('./routes/backup'));

// API Documentation (Swagger)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Payroll API Documentation'
  }));
  logger.info('Swagger API documentation available at /api-docs');
}

// 404 handler (must be before error handler)
app.use(notFound);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // Sync database models (set force: false in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized.');
    }
  } catch (error) {
    logger.warn('Database connection failed. Server will start but database features will be unavailable.');
    logger.warn('Please ensure PostgreSQL is running and database credentials are correct in .env file');
    logger.warn('Error:', error.message);
  }
  
  // Start server even if database connection fails (for development)
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Frontend should be available at http://localhost:3000`);
      logger.info(`Backend API available at http://localhost:${PORT}`);
    }
  });
};

startServer();

module.exports = app;

