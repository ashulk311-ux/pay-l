# Technical Considerations Implementation

This document outlines the implementation of technical considerations for the Payroll Application.

## 1. Modular Microservice-Based Development

### Architecture
- **API-First Approach**: All functionality exposed via RESTful APIs
- **Modular Structure**: Backend organized into services, controllers, routes, and models
- **Separation of Concerns**: Clear separation between business logic, data access, and API layers

### Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
```

### Benefits
- Easy to scale individual modules
- Independent testing and deployment
- Clear API contracts for mobile app integration
- Future-ready for microservices migration

---

## 2. API-First Approach (Mobile App Support)

### API Documentation
- **Swagger/OpenAPI 3.0** documentation available at `/api-docs`
- Comprehensive API documentation with request/response schemas
- Interactive API testing interface
- Authentication examples included

### API Features
- RESTful API design
- Consistent response format
- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation and sanitization

### Mobile App Endpoints
- GPS Attendance APIs (`/api/gps-attendance/*`)
- Employee Portal APIs (`/api/portal/*`)
- Authentication APIs (`/api/auth/*`)

### API Versioning
- Current version: v1
- Future versions can be added via `/api/v2/*`

---

## 3. GDPR/Data Compliance

### Features Implemented

#### Data Encryption
- **Encryption Service** (`backend/src/services/encryptionService.js`)
  - AES-256-GCM encryption for sensitive data
  - Configurable encryption key via `ENCRYPTION_KEY` environment variable
  - Data masking utilities for display

#### Right to Access (Data Portability)
- **Export Personal Data** (`GET /api/gdpr/export/:employeeId`)
  - Export all personal data in JSON format
  - Download as file option
  - Includes: employee info, payslips, attendance, leaves, loans, reimbursements

#### Right to be Forgotten
- **Anonymize Personal Data** (`POST /api/gdpr/anonymize/:employeeId`)
  - Anonymizes employee personal information
  - Retains data structure for compliance/legal requirements
  - Checks for legal retention requirements before deletion

#### Data Deletion Checks
- **Can Delete Data** (`GET /api/gdpr/can-delete/:employeeId`)
  - Checks if data can be deleted based on:
    - Active payroll records
    - Pending loans
    - Legal retention requirements

### GDPR Compliance Fields
- `isAnonymized`: Flag to mark anonymized records
- `anonymizedAt`: Timestamp of anonymization
- `anonymizedBy`: User who performed anonymization
- `anonymizationReason`: Reason for anonymization

### Data Protection
- Sensitive data (PAN, Aadhaar, Bank Account) masked in exports
- Encryption for sensitive fields
- Audit logging for all GDPR operations

---

## 4. Automated Backups & Audit Logs

### Automated Backups

#### Backup Service (`backend/src/services/backupService.js`)
- **Database Backup**: PostgreSQL database backup using `pg_dump`
- **File Backup**: Uploads and exports directory backup (ZIP format)
- **Full Backup**: Combined database + files backup

#### Scheduled Backups
- **Daily Full Backup**: Runs at 2 AM (configurable via cron)
- **Retention Policy**: Configurable retention period (default: 30 days)
- **Automatic Cleanup**: Old backups automatically deleted based on retention policy

#### Backup Management
- **List Backups** (`GET /api/backup/list`)
- **Download Backup** (`GET /api/backup/download/:filename`)
- **Manual Backup** (`POST /api/backup/full`)
- **Cleanup Old Backups** (`POST /api/backup/cleanup`)
- **Restore Database** (`POST /api/backup/restore`)

#### Configuration
```env
ENABLE_AUTO_BACKUP=true
BACKUP_RETENTION_DAYS=30
```

### Audit Logs

#### Audit Log Model
- Tracks all data changes
- Records: user, action, entity, old/new values, IP address, user agent
- Indexed for fast queries

#### Audit Log Features
- **Automatic Logging**: All create/update/delete operations logged
- **GDPR Operations**: All GDPR operations logged
- **Backup Operations**: All backup operations logged
- **Security Events**: Security-related events logged

#### Audit Log Access
- **View Audit Logs** (`GET /api/reports/audit-logs`)
- **Export Audit Logs** (`GET /api/reports/audit-logs/export`)
- Role-based access (Auditor role has read-only access)

---

## 5. VAPT Certification of Code

### Security Features Implemented

#### Security Headers (Helmet.js)
- **Strict-Transport-Security**: HSTS with preload
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: Enabled
- **Content-Security-Policy**: Strict CSP
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricted permissions

#### Input Validation & Sanitization
- **SQL Injection Prevention**: Parameterized queries (Sequelize ORM)
- **XSS Prevention**: Input sanitization, HTML tag removal
- **Command Injection Prevention**: Pattern detection and blocking
- **Path Traversal Prevention**: File path sanitization

#### Security Middleware
- **VAPT Security Check** (`backend/src/middleware/vaptMiddleware.js`)
  - Validates input against injection patterns
  - Checks for XSS attempts
  - Validates JWT token format
  - Logs security events

#### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- Prevents brute force attacks

#### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with 10 rounds
- **Role-Based Access Control**: Granular permissions
- **Token Validation**: Format and signature validation

#### Security Logging
- **Security Event Logging**: All security events logged
- **Suspicious Activity Detection**: Pattern-based detection
- **Audit Trail**: Complete audit trail for security events

### VAPT Compliance Checklist

- [x] Input validation and sanitization
- [x] SQL injection prevention
- [x] XSS prevention
- [x] CSRF protection (via JWT, not cookies)
- [x] Security headers (Helmet.js)
- [x] Rate limiting
- [x] Authentication & authorization
- [x] Password security (bcrypt)
- [x] Secure file uploads
- [x] Error handling (no sensitive data exposure)
- [x] Audit logging
- [x] Data encryption
- [x] HTTPS enforcement (HSTS)
- [x] API security (JWT validation)

### Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Strong Secrets**: Use strong JWT secrets (32+ characters)
3. **HTTPS**: Always use HTTPS in production
4. **Regular Updates**: Keep dependencies updated
5. **Security Audits**: Regular security audits recommended
6. **Penetration Testing**: Periodic VAPT testing recommended

---

## Environment Variables

### Required
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payroll_db
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key-min-32-characters

# Encryption (for GDPR)
ENCRYPTION_KEY=your-encryption-key-hex-format
```

### Optional
```env
# Backup
ENABLE_AUTO_BACKUP=true
BACKUP_RETENTION_DAYS=30

# API Documentation
ENABLE_SWAGGER=true
API_URL=http://localhost:5000/api

# Security
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

---

## API Documentation

### Swagger UI
- **URL**: `http://localhost:5000/api-docs`
- **Authentication**: Use "Authorize" button to add JWT token
- **Interactive Testing**: Test APIs directly from documentation

### API Endpoints

#### GDPR
- `GET /api/gdpr/export/:employeeId` - Export personal data
- `GET /api/gdpr/can-delete/:employeeId` - Check if data can be deleted
- `POST /api/gdpr/anonymize/:employeeId` - Anonymize personal data

#### Backup
- `POST /api/backup/database` - Create database backup
- `POST /api/backup/files` - Create file backup
- `POST /api/backup/full` - Create full backup
- `GET /api/backup/list` - List all backups
- `GET /api/backup/download/:filename` - Download backup
- `POST /api/backup/cleanup` - Cleanup old backups
- `POST /api/backup/restore` - Restore database

---

## Testing

### Security Testing
```bash
# Run security checks
npm run test:security

# VAPT testing checklist
# - SQL injection tests
# - XSS tests
# - Authentication tests
# - Authorization tests
# - Rate limiting tests
```

### Backup Testing
```bash
# Manual backup
curl -X POST http://localhost:5000/api/backup/full \
  -H "Authorization: Bearer YOUR_TOKEN"

# List backups
curl http://localhost:5000/api/backup/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GDPR Testing
```bash
# Export personal data
curl http://localhost:5000/api/gdpr/export/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check if can delete
curl http://localhost:5000/api/gdpr/can-delete/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Production Deployment Checklist

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set `ENCRYPTION_KEY` for GDPR compliance
- [ ] Enable HTTPS/SSL
- [ ] Configure `FRONTEND_URL` for CORS
- [ ] Set `NODE_ENV=production`
- [ ] Enable automated backups (`ENABLE_AUTO_BACKUP=true`)
- [ ] Configure backup retention period
- [ ] Set up database backups
- [ ] Configure security headers
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting
- [ ] Schedule regular security audits
- [ ] Document API endpoints
- [ ] Set up error tracking
- [ ] Configure logging

---

## Support

For questions or issues related to technical considerations:
- Check API documentation at `/api-docs`
- Review security documentation in `docs/SECURITY.md`
- Contact support: support@payrollapp.com



