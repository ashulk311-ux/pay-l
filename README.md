# Payroll Management System

A comprehensive, modular payroll management system built with React.js frontend and Node.js backend, designed for flexible deployment and scalable licensing.

## 🏗️ Architecture

- **Frontend**: React.js 18 with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT / OAuth2.0
- **Hosting**: AWS / Azure / On-premise compatible

## 📦 Modules

The application is modular with the following main modules:

1. **Basic Module (Core System)**
   - Employee Master
   - Payroll Processing
   - Statutory Compliance (PF, ESI, TDS, LWF, PT)
   - Salary Structure Management
   - Payslip Generation
   - Reports & Export Options

2. **Employee Portal (Add-on Module)**
   - Payslip Viewing
   - Leave Application & Status
   - Attendance Summary
   - Tax Declaration Submission
   - Personal Information Update

3. **Additional Modules**
   - Global Policy / Master of Master
   - Company Master
   - Statutory Configurations
   - Attendance / Leave Master
   - Loan / Advance Module
   - Reimbursement
   - Supplementary Salary
   - Salary Increment
   - Reports (Statutory, Payroll, Reconciliation, Bank Transfer, Employee History, Audit Logs)

## 🔐 Roles and Permissions

- **Super Admin**: All modules + Global Setup
- **HR/Admin**: Employee + Payroll + Attendance
- **Finance**: Salary Processing + Statutory Reports
- **Employee**: Self-service portal
- **Auditor**: Read-only access to all data

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation

### 1. Clone the repository

```bash
cd AI-sys-POC
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE payroll_db;
```

2. Copy environment file:
```bash
cd backend
cp .env.example .env
```

3. Update `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payroll_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 5. Start the Application

#### Development Mode (Both frontend and backend)

From the root directory:
```bash
npm run dev
```

#### Or run separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
AI-sys-POC/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware (auth, upload, etc.)
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Entry point
│   ├── database/
│   │   ├── migrations/      # Database migrations
│   │   └── seeds/           # Database seeds
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context providers
│   │   ├── config/          # Configuration files
│   │   ├── utils/           # Utility functions
│   │   └── App.js           # Main app component
│   └── package.json
└── README.md
```

## 🔑 License Model

- Licenses are issued in blocks of 50 users
- Each module requires a separate license key
- Modules are independently licensed
- License validation is enforced at the API level

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- Helmet.js for security headers
- Input validation
- Audit logging for all data changes

## 📊 Key Features

### Employee Management
- Employee onboarding wizard
- Document upload (Aadhaar, PAN, Photo, etc.)
- KYC status tracking
- Dynamic extra fields
- Matrix Software integration support

### Payroll Processing
- Month-wise payroll processing
- Attendance locking
- Automatic calculations
- Payslip generation (PDF with branding)
- Bulk salary import
- Full & Final Settlement

### Statutory Compliance
- PF/ESI/PT/LWF configuration
- TDS setup (Old/New regime)
- Auto deduction setup
- Form 16 support

### Reports
- Statutory reports (PF, ESI, TDS, PT)
- Payroll reports (Salary Register, Payslip)
- Reconciliation reports
- Bank transfer reports (NEFT format)
- Employee history
- Audit logs

## 🛠️ Development

### API Endpoints

All API endpoints are prefixed with `/api/`

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Employees:**
- `GET /api/employee` - Get all employees
- `POST /api/employee` - Create employee
- `PUT /api/employee/:id` - Update employee
- `DELETE /api/employee/:id` - Delete employee

**Payroll:**
- `GET /api/payroll` - Get all payrolls
- `POST /api/payroll` - Create payroll
- `POST /api/payroll/:id/process` - Process payroll
- `POST /api/payroll/:id/finalize` - Finalize payroll

See individual route files for complete API documentation.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

## 🚢 Deployment

### Quick Deploy to Render (Backend) + Vercel (Frontend)

See **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** for a 10-minute deployment guide.

### Detailed Deployment Guide

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for comprehensive deployment instructions including:
- Render backend setup
- Vercel frontend setup
- Environment variable configuration
- Database setup and migrations
- Troubleshooting guide

### Production Build (Local)

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
NODE_ENV=production npm start
```

### Generate JWT Secret for Production

```bash
node scripts/generate-jwt-secret.js
```

### Deployment Checklist

See **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** for a complete pre and post-deployment checklist.

## 📄 License

This is a proprietary software. All rights reserved.

## 👥 Support

For support and queries, please contact the development team.

## 🔮 Future Enhancements

- Biometric Integration
- GPS Attendance (Mobile App)
- Integration with Government APIs for PF/ESI
- Payroll Analytics Dashboard
- Gratuity & Final Settlement
- HR Letters Generation
- Mobile Application
- VAPT Certification

---

**Note**: This is a POC (Proof of Concept) application. For production deployment, additional security measures, testing, and optimizations are recommended.

# pay-l
