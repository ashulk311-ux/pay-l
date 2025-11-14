import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { refetchOnWindowFocus: false });
  const { data: payrollsData } = useQuery('payrolls', () => payrollService.getAll(), { refetchOnWindowFocus: false });
  const { data: analyticsData } = useQuery('dashboardAnalytics', () => reportService.getDashboardAnalytics(), { refetchOnWindowFocus: false });

  const totalEmployees = employeesData?.data?.length || 0;
  const activePayrolls = payrollsData?.data?.filter(p => p.status === 'finalized' || p.status === 'locked').length || 0;
  const pendingPayrolls = payrollsData?.data?.filter(p => p.status === 'draft').length || 0;

  const stats = [
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

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

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
