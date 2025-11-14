const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables FIRST before requiring database config
dotenv.config();

const { sequelize } = require('./config/database');
const logger = require('./utils/logger');
const { sanitizeBody, sanitizeQuery, sanitizeParams } = require('./utils/sanitize');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow embedding for API responses
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - stricter for auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use('/api/global-policy', require('./routes/globalPolicy'));
app.use('/api/company', require('./routes/company'));
app.use('/api/statutory', require('./routes/statutory'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/loan', require('./routes/loan'));
app.use('/api/reimbursement', require('./routes/reimbursement'));
app.use('/api/supplementary', require('./routes/supplementary'));
app.use('/api/increment', require('./routes/increment'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/portal', require('./routes/portal'));

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

