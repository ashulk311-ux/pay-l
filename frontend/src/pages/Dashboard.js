import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EventIcon from '@mui/icons-material/Event';
import { employeeService } from '../services/employeeService';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { companyService } from '../services/companyService';
import { useAuth } from '../context/AuthContext';
import BusinessIcon from '@mui/icons-material/Business';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect employees to portal dashboard
  useEffect(() => {
    if (user && user.role?.name === 'Employee') {
      navigate('/portal', { replace: true });
    }
  }, [user, navigate]);

  // Only fetch admin data if user is not an Employee or Super Admin
  const isEmployee = user?.role?.name === 'Employee';
  const isSuperAdmin = user?.role?.name?.toLowerCase() === 'super admin';
  const isCompanyAdmin = user?.role?.name?.toLowerCase() === 'company admin';
  const isHRAdmin = user?.role?.name?.toLowerCase() === 'hr/admin';
  
  // Fetch data for Company Admin and HR/Admin
  const shouldFetchAdminData = !isEmployee && !isSuperAdmin && (isCompanyAdmin || isHRAdmin);
  
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery(
    'employees', 
    () => employeeService.getAll(), 
    { 
      refetchOnWindowFocus: false,
      enabled: shouldFetchAdminData
    }
  );
  
  const { data: payrollsData, isLoading: payrollsLoading, error: payrollsError } = useQuery(
    'payrolls', 
    () => payrollService.getAll(), 
    { 
      refetchOnWindowFocus: false,
      enabled: shouldFetchAdminData
    }
  );
  
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery(
    'dashboardAnalytics', 
    () => reportService.getDashboardAnalytics(), 
    { 
      refetchOnWindowFocus: false,
      enabled: shouldFetchAdminData
    }
  );

  // Super Admin Dashboard - Simple view
  const { data: companiesData, isLoading: companiesLoading, error: companiesError } = useQuery(
    'companies',
    () => companyService.getAll(),
    {
      refetchOnWindowFocus: false,
      enabled: isSuperAdmin,
      retry: 1
    }
  );

  // Super Admin stats
  const companies = companiesData?.data || [];
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.isActive).length;
  const inactiveCompanies = companies.filter(c => !c.isActive).length;

  // Regular Admin/HR/Company Admin stats
  const employees = employeesData?.data || [];
  const payrolls = payrollsData?.data || [];
  const totalEmployees = Array.isArray(employees) ? employees.length : 0;
  const activePayrolls = Array.isArray(payrolls) ? payrolls.filter(p => p.status === 'finalized' || p.status === 'locked').length : 0;
  const pendingPayrolls = Array.isArray(payrolls) ? payrolls.filter(p => p.status === 'draft').length : 0;
  const isLoadingData = employeesLoading || payrollsLoading || analyticsLoading;
  const hasDataError = employeesError || payrollsError || analyticsError;

  const stats = isSuperAdmin ? [
    { title: 'Total Companies', value: totalCompanies.toString(), icon: <BusinessIcon />, color: '#1976d2' },
    { title: 'Active Companies', value: activeCompanies.toString(), icon: <BusinessIcon />, color: '#2e7d32' },
    { title: 'Inactive Companies', value: inactiveCompanies.toString(), icon: <BusinessIcon />, color: '#d32f2f' },
    { title: 'System Status', value: 'Active', icon: <AssessmentIcon />, color: '#9c27b0' },
  ] : [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: <PeopleIcon />, color: '#1976d2' },
    { title: 'Active Payrolls', value: activePayrolls.toString(), icon: <AccountBalanceIcon />, color: '#2e7d32' },
    { title: 'Pending Payrolls', value: pendingPayrolls.toString(), icon: <EventIcon />, color: '#ed6c02' },
    { title: 'Reports Available', value: '8', icon: <AssessmentIcon />, color: '#9c27b0' },
  ];

  const analytics = analyticsData?.data || {};
  const departmentData = Object.entries(analytics.departmentDistribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const statusData = Object.entries(analytics.statusDistribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const monthlyData = analytics.monthlyPayrollData || [];

  const attendanceData = analytics.attendanceSummary ? [
    { name: 'Present', value: analytics.attendanceSummary.present || 0 },
    { name: 'Absent', value: analytics.attendanceSummary.absent || 0 },
    { name: 'Half Day', value: analytics.attendanceSummary.halfDay || 0 }
  ] : [];

  // Super Admin - Simple dashboard
  if (isSuperAdmin) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Super Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage companies and users across the system
        </Typography>

        {/* Loading State */}
        {companiesLoading && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            Loading companies...
          </Typography>
        )}

        {/* Error State */}
        {companiesError && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            Error loading companies: {companiesError.message}
          </Typography>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: stat.color, mr: 2 }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: 40 } })}
                    </Box>
                    <Box>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Companies List */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Companies
              </Typography>
              {companiesLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              ) : companies.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No companies found. Create your first company to get started.
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {companies.map((company) => (
                    <Card key={company.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6">{company.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Code: {company.code} | Email: {company.email || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Status: {company.isActive ? (
                                <span style={{ color: '#2e7d32' }}>Active</span>
                              ) : (
                                <span style={{ color: '#d32f2f' }}>Inactive</span>
                              )}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/companies/${company.id}`)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/companies')}
                  startIcon={<BusinessIcon />}
                >
                  Manage Companies
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Show loading state for Company Admin/HR Admin
  if (shouldFetchAdminData && isLoadingData) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1">Loading dashboard data...</Typography>
        </Box>
      </Container>
    );
  }

  // Show error state with details
  if (shouldFetchAdminData && hasDataError) {
    const errorDetails = employeesError || payrollsError || analyticsError;
    return (
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body1" gutterBottom>
            Error loading dashboard data. Please try refreshing the page.
          </Typography>
          {process.env.NODE_ENV === 'development' && errorDetails && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Error: {errorDetails?.response?.data?.message || errorDetails?.message || 'Unknown error'}
            </Typography>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      {(isCompanyAdmin || isHRAdmin) && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Welcome to your payroll management dashboard
        </Typography>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && shouldFetchAdminData && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Debug: Employees: {totalEmployees} | Payrolls: {payrolls.length} | 
            Active: {activePayrolls} | Pending: {pendingPayrolls}
          </Typography>
        </Box>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Monthly Payroll Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Payroll Trend (Last 6 Months)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'grossSalary' || name === 'netSalary') {
                      return `₹${value.toLocaleString('en-IN')}`;
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="grossSalary"
                  stroke="#8884d8"
                  name="Gross Salary"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="netSalary"
                  stroke="#82ca9d"
                  name="Net Salary"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="employees"
                  stroke="#ffc658"
                  name="Employees"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Payroll Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payroll Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Department Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Employees by Department
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Current Month Attendance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Month Attendance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        {analytics.recentActivity && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity (Last 30 Days)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="primary">
                        {analytics.recentActivity.loans || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New Loans
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="secondary">
                        {analytics.recentActivity.reimbursements || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reimbursements
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="warning.main">
                        {analytics.recentActivity.pendingLeaves || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Leaves
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
