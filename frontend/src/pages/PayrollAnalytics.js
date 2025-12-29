import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { useQuery } from 'react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { analyticsService } from '../services/analyticsService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PayrollAnalytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: analyticsData, isLoading } = useQuery(
    ['payrollAnalytics', year, startDate, endDate],
    () => analyticsService.getPayrollAnalytics({ year, startDate, endDate }),
    { enabled: true }
  );

  const analytics = analyticsData?.data || {};

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Payroll Analytics Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive payroll insights and trends
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              fullWidth
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Payrolls</Typography>
              <Typography variant="h4">{analytics.overview?.totalPayrolls || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Employees</Typography>
              <Typography variant="h4">{analytics.overview?.totalEmployees || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Gross Salary</Typography>
              <Typography variant="h4">₹{parseFloat(analytics.overview?.totalGrossSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Net Salary</Typography>
              <Typography variant="h4">₹{parseFloat(analytics.overview?.totalNetSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly Trend Chart */}
      {analytics.monthlyTrend && analytics.monthlyTrend.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Monthly Payroll Trend</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Line type="monotone" dataKey="grossSalary" stroke="#8884d8" name="Gross Salary" />
              <Line type="monotone" dataKey="netSalary" stroke="#82ca9d" name="Net Salary" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Department Wise */}
        {analytics.departmentWise && analytics.departmentWise.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Department Wise Breakdown</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.departmentWise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="totalGross" fill="#8884d8" name="Gross Salary" />
                  <Bar dataKey="totalNet" fill="#82ca9d" name="Net Salary" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Statutory Breakdown */}
        {analytics.statutoryBreakdown && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Statutory Contributions</Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">PF (Employee)</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.statutoryBreakdown.pf?.employee || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">PF (Employer)</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.statutoryBreakdown.pf?.employer || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">ESI (Employee)</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.statutoryBreakdown.esi?.employee || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">ESI (Employer)</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.statutoryBreakdown.esi?.employer || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">TDS</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.statutoryBreakdown.tds || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">PT</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.statutoryBreakdown.pt || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Cost Analysis */}
        {analytics.costAnalysis && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Cost Analysis</Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Gross Salary</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.costAnalysis.grossSalary || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Statutory Contributions</Typography>
                    <Typography variant="h6">₹{parseFloat(analytics.costAnalysis.statutoryContributions || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Total CTC</Typography>
                    <Typography variant="h5" color="primary">₹{parseFloat(analytics.costAnalysis.ctc || 0).toLocaleString('en-IN')}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Employee Metrics */}
        {analytics.employeeMetrics && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Employee Metrics</Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Active Employees</Typography>
                    <Typography variant="h6">{analytics.employeeMetrics.activeEmployees || 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">New Joinings</Typography>
                    <Typography variant="h6">{analytics.employeeMetrics.newJoinings || 0}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}



