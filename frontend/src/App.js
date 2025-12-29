import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import theme from './config/theme';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import PayrollProcessing from './pages/PayrollProcessing';
import Reports from './pages/Reports';
import CompanySettings from './pages/CompanySettings';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import EmployeeDashboard from './pages/EmployeePortal/Dashboard';
import EmployeePayslips from './pages/EmployeePortal/Payslips';
import EmployeeAttendance from './pages/EmployeePortal/Attendance';
import EmployeeLeaves from './pages/EmployeePortal/Leaves';
import EmployeeProfile from './pages/EmployeePortal/Profile';
import EmployeeHelpdesk from './pages/EmployeePortal/Helpdesk';
import LoanManagement from './pages/LoanManagement';
import ReimbursementManagement from './pages/ReimbursementManagement';
import SupplementarySalary from './pages/SupplementarySalary';
import SalaryIncrement from './pages/SalaryIncrement';
import BiometricManagement from './pages/BiometricManagement';
import PayrollAnalytics from './pages/PayrollAnalytics';
import OfficeLocationManagement from './pages/OfficeLocationManagement';
import UserManagement from './pages/UserManagement';
import CompanyManagement from './pages/CompanyManagement';
import Companies from './pages/Companies';
import StatutoryConfiguration from './pages/StatutoryConfiguration';
import OnboardingWizard from './pages/OnboardingWizard';
import KYCStatus from './pages/KYCStatus';
import DynamicFields from './pages/DynamicFields';
import SalaryStructure from './pages/SalaryStructure';
import ITDeclaration from './pages/ITDeclaration';
import ITDeclarationReview from './pages/ITDeclarationReview';
import AttendanceImport from './pages/AttendanceImport';
import LeaveMaster from './pages/LeaveMaster';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding/:token" element={<OnboardingWizard />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="employees/new" element={<EmployeeForm />} />
                <Route path="employees/:id" element={<EmployeeForm />} />
                <Route path="payroll" element={<PayrollProcessing />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="leaves" element={<LeaveManagement />} />
                <Route path="loans" element={<LoanManagement />} />
                <Route path="reimbursements" element={<ReimbursementManagement />} />
                <Route path="supplementary" element={<SupplementarySalary />} />
                <Route path="increments" element={<SalaryIncrement />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<CompanySettings />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="companies" element={<Companies />} />
                <Route path="company" element={<CompanyManagement />} />
                <Route path="statutory" element={<StatutoryConfiguration />} />
                <Route path="employees/:id/kyc" element={<KYCStatus />} />
                <Route path="employees/:id/salary" element={<SalaryStructure />} />
                <Route path="dynamic-fields" element={<DynamicFields />} />
                <Route path="it-declaration" element={<ITDeclaration />} />
                <Route path="it-declaration/review" element={<ITDeclarationReview />} />
                <Route path="attendance/import" element={<AttendanceImport />} />
                <Route path="leave-master" element={<LeaveMaster />} />
                <Route path="biometric" element={<BiometricManagement />} />
                <Route path="analytics" element={<PayrollAnalytics />} />
                <Route path="office-locations" element={<OfficeLocationManagement />} />
                {/* Employee Portal Routes */}
                <Route path="portal" element={<EmployeeDashboard />} />
                <Route path="portal/payslips" element={<EmployeePayslips />} />
                <Route path="portal/attendance" element={<EmployeeAttendance />} />
                <Route path="portal/leaves" element={<EmployeeLeaves />} />
                <Route path="portal/it-declaration" element={<ITDeclaration />} />
                <Route path="portal/helpdesk" element={<EmployeeHelpdesk />} />
                <Route path="portal/profile" element={<EmployeeProfile />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

