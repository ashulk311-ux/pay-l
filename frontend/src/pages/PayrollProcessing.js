import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { payrollService } from '../services/payrollService';
import DataTable from '../components/DataTable';

const steps = ['Select Period', 'Lock Attendance', 'Process Payroll', 'Finalize', 'Generate Payslips'];

export default function PayrollProcessing() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  const { data: payrollsData, isLoading } = useQuery(
    'payrolls',
    () => payrollService.getAll(),
    { refetchOnWindowFocus: false }
  );

  const { data: payslipsData } = useQuery(
    ['payslips', selectedPayroll?.id],
    () => payrollService.getPayslips(selectedPayroll?.id),
    { enabled: !!selectedPayroll?.id, refetchOnWindowFocus: false }
  );

  const createMutation = useMutation(
    (data) => payrollService.create(data),
    {
      onSuccess: () => {
        toast.success('Payroll created successfully');
        queryClient.invalidateQueries('payrolls');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create payroll');
      }
    }
  );

  const lockAttendanceMutation = useMutation(
    (id) => payrollService.lockAttendance(id),
    {
      onSuccess: () => {
        toast.success('Attendance locked successfully');
        queryClient.invalidateQueries('payrolls');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to lock attendance');
      }
    }
  );

  const processMutation = useMutation(
    (id) => payrollService.process(id),
    {
      onSuccess: () => {
        toast.success('Payroll processed successfully');
        queryClient.invalidateQueries('payrolls');
        queryClient.invalidateQueries(['payslips', selectedPayroll?.id]);
        setProcessDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to process payroll');
      }
    }
  );

  const finalizeMutation = useMutation(
    (id) => payrollService.finalize(id),
    {
      onSuccess: () => {
        toast.success('Payroll finalized successfully');
        queryClient.invalidateQueries('payrolls');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to finalize payroll');
      }
    }
  );

  const generatePayslipsMutation = useMutation(
    (id) => payrollService.generatePayslips(id),
    {
      onSuccess: () => {
        toast.success('Payslips generated successfully');
        queryClient.invalidateQueries(['payslips', selectedPayroll?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate payslips');
      }
    }
  );

  const handleCreatePayroll = () => {
    createMutation.mutate({
      month: selectedMonth,
      year: selectedYear
    });
  };

  const handleLockAttendance = (payrollId) => {
    if (window.confirm('Are you sure you want to lock attendance? This action cannot be undone.')) {
      lockAttendanceMutation.mutate(payrollId);
    }
  };

  const handleProcess = (payrollId) => {
    setSelectedPayroll(payrollsData?.data?.find(p => p.id === payrollId));
    setProcessDialogOpen(true);
  };

  const confirmProcess = () => {
    if (selectedPayroll) {
      processMutation.mutate(selectedPayroll.id);
    }
  };

  const handleFinalize = (payrollId) => {
    if (window.confirm('Are you sure you want to finalize this payroll? This action cannot be undone.')) {
      finalizeMutation.mutate(payrollId);
    }
  };

  const handleGeneratePayslips = (payrollId) => {
    generatePayslipsMutation.mutate(payrollId);
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const blob = await payrollService.getPayslipPDF(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  const getActiveStep = (payroll) => {
    if (payroll.status === 'paid') return 4;
    if (payroll.status === 'finalized') return 3;
    if (payroll.status === 'locked') return 2;
    if (payroll.attendanceLocked) return 1;
    return 0;
  };

  const payrolls = payrollsData?.data || [];
  const payslips = payslipsData?.data || [];

  const payslipColumns = [
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    { field: 'grossSalary', header: 'Gross Salary', format: 'currency' },
    { field: 'totalDeductions', header: 'Deductions', format: 'currency' },
    { field: 'netSalary', header: 'Net Salary', format: 'currency' },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        <IconButton size="small" onClick={() => handleDownloadPayslip(row.id)}>
          <DownloadIcon />
        </IconButton>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Payroll Processing
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create New Payroll
              </Typography>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Month"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <MenuItem key={month} value={month}>
                        {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Year"
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCreatePayroll}
                  disabled={createMutation.isLoading}
                >
                  Create Payroll
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Payroll List
      </Typography>

      {payrolls.map((payroll) => {
        const activeStep = getActiveStep(payroll);
        return (
          <Paper key={payroll.id} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">
                  {new Date(2000, payroll.month - 1).toLocaleString('default', { month: 'long' })} {payroll.year}
                </Typography>
                <Chip
                  label={payroll.status}
                  color={
                    payroll.status === 'paid' ? 'success' :
                    payroll.status === 'finalized' ? 'primary' :
                    payroll.status === 'locked' ? 'warning' : 'default'
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box>
                {!payroll.attendanceLocked && (
                  <Button
                    startIcon={<LockIcon />}
                    onClick={() => handleLockAttendance(payroll.id)}
                    disabled={lockAttendanceMutation.isLoading}
                    sx={{ mr: 1 }}
                  >
                    Lock Attendance
                  </Button>
                )}
                {payroll.attendanceLocked && payroll.status === 'draft' && (
                  <Button
                    startIcon={<PlayArrowIcon />}
                    variant="contained"
                    onClick={() => handleProcess(payroll.id)}
                    disabled={processMutation.isLoading}
                    sx={{ mr: 1 }}
                  >
                    Process
                  </Button>
                )}
                {payroll.status === 'locked' && (
                  <Button
                    startIcon={<CheckCircleIcon />}
                    variant="contained"
                    color="success"
                    onClick={() => handleFinalize(payroll.id)}
                    disabled={finalizeMutation.isLoading}
                    sx={{ mr: 1 }}
                  >
                    Finalize
                  </Button>
                )}
                {payroll.status === 'finalized' && (
                  <Button
                    startIcon={<DownloadIcon />}
                    variant="contained"
                    onClick={() => handleGeneratePayslips(payroll.id)}
                    disabled={generatePayslipsMutation.isLoading}
                  >
                    Generate Payslips
                  </Button>
                )}
              </Box>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                <Typography variant="h6">{payroll.totalEmployees || 0}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">Gross Salary</Typography>
                <Typography variant="h6">₹{parseFloat(payroll.totalGrossSalary || 0).toLocaleString('en-IN')}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                <Typography variant="h6">₹{parseFloat(payroll.totalDeductions || 0).toLocaleString('en-IN')}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">Net Salary</Typography>
                <Typography variant="h6">₹{parseFloat(payroll.totalNetSalary || 0).toLocaleString('en-IN')}</Typography>
              </Grid>
            </Grid>

            {selectedPayroll?.id === payroll.id && payslips.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Payslips</Typography>
                <DataTable
                  columns={payslipColumns}
                  data={payslips}
                  pagination
                />
              </Box>
            )}
          </Paper>
        );
      })}

      <Dialog open={processDialogOpen} onClose={() => setProcessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payroll</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to process payroll for {selectedPayroll && `${new Date(2000, selectedPayroll.month - 1).toLocaleString('default', { month: 'long' })} ${selectedPayroll.year}`}?
            This will calculate salaries for all employees.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmProcess} variant="contained" disabled={processMutation.isLoading}>
            Process
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
