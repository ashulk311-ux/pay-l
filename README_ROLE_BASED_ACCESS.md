# Role-Based Access Control (RBAC)

This document describes the role-based access control implementation for the Payroll Application.

## Roles and Access Areas

### 1. Super Admin
**Access:** All modules + Global Setup

**Permissions:**
- Full access to all modules and features
- Global setup and configuration
- Company management
- User management
- System settings

**Menu Items:**
- Dashboard
- Companies
- Users
- Settings

---

### 2. HR/Admin
**Access:** Employee + Payroll + Attendance

**Permissions:**
- View and manage employees
- View and manage payroll
- View and manage attendance
- Manage leaves
- Manage loans
- Manage reimbursements
- Manage supplementary salary
- Manage salary increments
- View reports
- Manage biometric devices
- Manage office locations
- Generate HR letters

**Menu Items:**
- Dashboard
- Employees
- Payroll
- Attendance
- Biometric Devices
- Office Locations
- Leaves
- Loans
- Reimbursements
- Supplementary
- Increments
- Reports
- Company Management (if Company Admin)

---

### 3. Finance
**Access:** Salary Processing + Statutory Reports

**Permissions:**
- View employees (for payroll processing)
- View payroll
- Process salary (create, process, finalize payroll)
- View and manage statutory configurations
- View reports
- View analytics
- View loans, reimbursements, supplementary, increments (for payroll processing)
- Government API integration (PF/ESI challan submission)

**Menu Items:**
- Dashboard
- Payroll
- Statutory Config
- Reports
- Analytics

---

### 4. Employee
**Access:** Self-service portal

**Permissions:**
- Access portal routes only (`/api/portal/*`, `/api/gps-attendance/*`)
- View own payslips
- View own attendance
- Apply for leaves
- View own profile
- Update own profile
- GPS attendance check-in/check-out

**Menu Items:**
- My Dashboard
- My Payslips
- My Attendance
- My Leaves
- My Profile

---

### 5. Auditor
**Access:** Read-only access to all data

**Permissions:**
- View employees (read-only)
- View payroll (read-only)
- View attendance (read-only)
- View loans (read-only)
- View reimbursements (read-only)
- View supplementary salary (read-only)
- View increments (read-only)
- View statutory configurations (read-only)
- View reports (read-only)
- View audit logs (read-only)
- View analytics (read-only)

**Restrictions:**
- Cannot create, update, or delete any data
- All POST, PUT, PATCH, DELETE operations are blocked
- Only GET operations are allowed

**Menu Items:**
- Dashboard
- Employees
- Payroll
- Attendance
- Leaves
- Loans
- Reimbursements
- Supplementary
- Increments
- Statutory Config
- Reports
- Analytics

---

## Permission Structure

### Permission Naming Convention
- `view_<module>` - View/read access to a module
- `manage_<module>` - Full CRUD access to a module
- `process_<module>` - Specific processing actions (e.g., `process_salary`)

### Key Permissions

#### Employee Module
- `view_employee` - View employees
- `manage_employee` - Create, update, delete employees

#### Payroll Module
- `view_payroll` - View payroll records
- `manage_payroll` - Create, update payroll
- `process_salary` - Process salary (Finance role)

#### Attendance Module
- `view_attendance` - View attendance records
- `manage_attendance` - Create, update attendance

#### Statutory Module
- `view_statutory` - View statutory configurations
- `manage_statutory` - Manage statutory configurations

#### Reports Module
- `view_reports` - View reports
- `view_audit_logs` - View audit logs
- `manage_reports` - Create and manage custom reports

---

## Implementation Details

### Backend Middleware

1. **Authentication Middleware** (`backend/src/middleware/auth.js`)
   - Verifies JWT token
   - Loads user with role and permissions
   - Super Admin bypasses permission checks
   - Employee role restricted to portal routes only

2. **Authorization Middleware** (`backend/src/middleware/auth.js`)
   - Checks if user has required permission
   - Super Admin has all permissions
   - Employee role restricted to portal routes

3. **Auditor Protection Middleware** (`backend/src/middleware/auditorProtection.js`)
   - Blocks write operations (POST, PUT, PATCH, DELETE) for Auditor role
   - Allows only GET operations for Auditor

4. **Role-Based Access Middleware** (`backend/src/middleware/roleBasedAccess.js`)
   - Module-level access control
   - Write access checks
   - Global setup access control

### Frontend Implementation

1. **Navigation Menu** (`frontend/src/components/Layout.js`)
   - Menu items filtered based on user role
   - Each role sees only authorized menu items

2. **Route Protection**
   - Routes protected at backend level
   - Frontend navigation hides unauthorized items

---

## Seeding Permissions

To seed/update permissions, run:

```bash
cd database/seeds
node seedRoleBasedAccess.js
```

This will:
1. Create all required permissions
2. Assign permissions to each role according to access areas
3. Set up role-permission mappings

---

## API Endpoint Protection

All API endpoints are protected with:
1. `authenticate` - Verifies user is logged in
2. `authorize('<permission>')` - Checks if user has required permission
3. `protectAuditorWrite` - Blocks write operations for Auditor (on write endpoints)

Example:
```javascript
router.post('/', authenticate, authorize('manage_employee'), protectAuditorWrite, controller.create);
router.get('/', authenticate, authorize('view_employee'), controller.getAll);
```

---

## Testing Role Access

1. **Super Admin**: Login and verify access to all modules
2. **HR/Admin**: Login and verify access to Employee, Payroll, Attendance modules
3. **Finance**: Login and verify access to Payroll and Statutory modules only
4. **Employee**: Login and verify access to portal routes only
5. **Auditor**: Login and verify read-only access (try to create/update - should be blocked)

---

## Notes

- Super Admin always has full access regardless of permissions
- Employee role can only access portal routes (`/api/portal/*`, `/api/gps-attendance/*`)
- Auditor role is blocked from all write operations (POST, PUT, PATCH, DELETE)
- Permissions are checked at both route level and middleware level
- Frontend navigation automatically hides unauthorized menu items



