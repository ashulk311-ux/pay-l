# Security Documentation

## Security Features Implemented

### 1. Input Validation
- **express-validator** middleware on all API endpoints
- Comprehensive validation rules for:
  - Email addresses (format validation + normalization)
  - Passwords (minimum 8 characters, uppercase, lowercase, number)
  - PAN numbers (format: ABCDE1234F)
  - Aadhaar numbers (12 digits)
  - IFSC codes (format: ABCD0123456)
  - Bank account numbers (9-18 digits)
  - Phone numbers (international format support)
  - UUIDs for all ID parameters
  - Dates (ISO8601 format)
  - Numbers (with min/max constraints)

### 2. Input Sanitization
- **Automatic sanitization** of all request body, query, and params
- HTML tag removal to prevent XSS
- String trimming and whitespace removal
- Email normalization (lowercase, trim)
- Phone number sanitization
- Recursive object sanitization

### 3. Security Headers (Helmet.js)
- **Content Security Policy (CSP)** configured
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: enabled
- **Strict-Transport-Security**: HSTS headers
- **Referrer-Policy**: configured

### 4. CORS Configuration
- **Whitelist-based** origin control
- Configurable via `FRONTEND_URL` environment variable
- Credentials support enabled
- Specific HTTP methods allowed
- Specific headers allowed

### 5. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- Prevents brute force attacks
- Standard rate limit headers included

### 6. SQL Injection Prevention
- **Sequelize ORM** uses parameterized queries
- All database queries are automatically protected
- No raw SQL queries with user input

### 7. XSS Protection
- **Input sanitization** removes HTML tags
- **HTML escaping** utilities available
- **Content Security Policy** prevents inline scripts
- Response sanitization (optional, can be enabled)

### 8. Error Handling
- **Consistent error response format**
- Error codes for different error types
- Detailed logging without exposing sensitive data
- Production-safe error messages
- Stack traces only in development

### 9. Authentication & Authorization
- **JWT-based authentication**
- Token expiration (configurable, default 7 days)
- Role-based access control (RBAC)
- Permission-based authorization
- Password hashing with bcrypt (10 rounds)

### 10. File Upload Security
- **File type validation** (whitelist approach)
- **File size limits** (configurable, default 10MB)
- **Secure file storage** in uploads directory
- **Path traversal protection** in file downloads

## CSRF Protection Note

**CSRF protection is not implemented** because:
- The application uses **JWT tokens** stored in localStorage (not cookies)
- JWT tokens are not automatically sent by browsers
- CSRF attacks require cookies that are automatically sent
- CORS configuration provides additional protection

If you switch to cookie-based authentication in the future, CSRF protection should be added using `csurf` or similar middleware.

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong JWT secrets (minimum 32 characters)
- Use different secrets for development and production
- Rotate secrets periodically

### Password Policy
- Minimum 8 characters
- Must contain uppercase, lowercase, and number
- Consider adding special character requirement
- Implement password history (prevent reuse)

### API Security
- Always use HTTPS in production
- Implement API versioning
- Monitor for suspicious activity
- Regular security audits

### Database Security
- Use strong database passwords
- Limit database user permissions
- Regular backups
- Encrypt sensitive data at rest

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting appropriate for your traffic
- [ ] Enable XSS sanitization if needed
- [ ] Configure proper file upload limits
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Penetration testing
- [ ] VAPT certification (as mentioned in requirements)

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly to the development team.

