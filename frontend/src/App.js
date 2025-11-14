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
import LoanManagement from './pages/LoanManagement';
import ReimbursementManagement from './pages/ReimbursementManagement';
import SupplementarySalary from './pages/SupplementarySalary';
import SalaryIncrement from './pages/SalaryIncrement';

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
                {/* Employee Portal Routes */}
                <Route path="portal" element={<EmployeeDashboard />} />
                <Route path="portal/payslips" element={<EmployeePayslips />} />
                <Route path="portal/attendance" element={<EmployeeAttendance />} />
                <Route path="portal/leaves" element={<EmployeeLeaves />} />
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

