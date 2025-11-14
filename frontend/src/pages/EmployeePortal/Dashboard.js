import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import { portalService } from '../../services/portalService';
import { toast } from 'react-toastify';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery('employeeDashboard', () => portalService.getDashboard(), {
    refetchOnWindowFocus: false
  });

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const blob = await portalService.getPayslipPDF(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  if (isLoading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }

  const dashboard = data?.data || {};
  const leaveBalance = dashboard.leaveBalance || {};

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                <Box>
                  <Typography variant="h6">{dashboard.employee?.name || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dashboard.employee?.designation || '-'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon sx={{ fontSize: 40, color: '#2e7d32', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboard.attendance?.presentDays || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Present Days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 40, color: '#ed6c02', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboard.pendingLeaves || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Leaves
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 40, color: '#9c27b0', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboard.recentPayslips?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Payslips
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Leave Balance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Leave Type</TableCell>
                    <TableCell align="right">Allocated</TableCell>
                    <TableCell align="right">Used</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(leaveBalance).map(([type, balance]) => (
                    <TableRow key={type}>
                      <TableCell>{type}</TableCell>
                      <TableCell align="right">{balance.allocated || 0}</TableCell>
                      <TableCell align="right">{balance.used || 0}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={balance.balance || 0}
                          color={balance.balance > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/portal/leaves')}
              >
                View All Leaves
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Payslips
            </Typography>
            {dashboard.recentPayslips && dashboard.recentPayslips.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month/Year</TableCell>
                      <TableCell align="right">Net Salary</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.recentPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          {new Date(2000, payslip.month - 1).toLocaleString('default', { month: 'short' })} {payslip.year}
                        </TableCell>
                        <TableCell align="right">
                          ₹{payslip.netSalary.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payslip.status}
                            size="small"
                            color={payslip.status === 'finalized' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadPayslip(payslip.id)}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No payslips available
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/portal/payslips')}
              >
                View All Payslips
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

