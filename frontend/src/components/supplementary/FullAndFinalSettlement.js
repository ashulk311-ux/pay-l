import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { fullAndFinalService } from '../../services/fullAndFinalService';
import { employeeService } from '../../services/employeeService';
import DataTable from '../DataTable';

export default function FullAndFinalSettlement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const { data: settlementsData, isLoading } = useQuery(
    'fullAndFinalSettlements',
    () => fullAndFinalService.getAll(),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { enabled: false });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      employeeId: '',
      settlementDate: new Date().toISOString().split('T')[0],
      lastWorkingDate: '',
      remarks: ''
    }
  });

  const createMutation = useMutation(
    (data) => fullAndFinalService.create(data),
    {
      onSuccess: () => {
        toast.success('Full & Final Settlement created successfully');
        queryClient.invalidateQueries('fullAndFinalSettlements');
        reset();
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create settlement');
      }
    }
  );

  const approveMutation = useMutation(
    (id) => fullAndFinalService.approve(id),
    {
      onSuccess: () => {
        toast.success('Settlement approved successfully');
        queryClient.invalidateQueries('fullAndFinalSettlements');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve settlement');
      }
    }
  );

  const markPaidMutation = useMutation(
    (id) => fullAndFinalService.markAsPaid(id),
    {
      onSuccess: () => {
        toast.success('Settlement marked as paid successfully');
        queryClient.invalidateQueries('fullAndFinalSettlements');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark settlement as paid');
      }
    }
  );

  const handleViewDetails = (settlement) => {
    setSelectedSettlement(settlement);
    setDetailsDialogOpen(true);
  };

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const settlements = settlementsData?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 150,
      format: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      id: 'settlementDate',
      label: 'Settlement Date',
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'netAmount',
      label: 'Net Amount',
      minWidth: 120,
      format: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => {
        const colors = {
          draft: 'default',
          pending: 'warning',
          approved: 'info',
          paid: 'success',
          cancelled: 'error'
        };
        return <Chip label={value?.toUpperCase()} size="small" color={colors[value] || 'default'} />;
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 200,
      format: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleViewDetails(row)} title="View Details">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {row.status === 'draft' && (
            <IconButton size="small" onClick={() => approveMutation.mutate(row.id)} color="success" title="Approve">
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          )}
          {row.status === 'approved' && (
            <Button size="small" onClick={() => markPaidMutation.mutate(row.id)} color="success">
              Mark Paid
            </Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Full & Final Settlements</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Create Settlement
        </Button>
      </Box>

      <DataTable columns={columns} data={settlements} loading={isLoading} searchable searchPlaceholder="Search settlements..." />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Create Full & Final Settlement</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="employeeId"
                  control={control}
                  rules={{ required: 'Employee is required' }}
                  render={({ field }) => (
                    <TextField {...field} select label="Employee" fullWidth required>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="lastWorkingDate"
                  control={control}
                  rules={{ required: 'Last working date is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Last Working Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="settlementDate"
                  control={control}
                  rules={{ required: 'Settlement date is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Settlement Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Remarks" multiline rows={2} fullWidth />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Full & Final Settlement Details</DialogTitle>
        <DialogContent>
          {selectedSettlement && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Employee</Typography>
                  <Typography variant="body1">
                    {selectedSettlement.employee?.firstName} {selectedSettlement.employee?.lastName} ({selectedSettlement.employee?.employeeCode})
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedSettlement.status?.toUpperCase()}
                    size="small"
                    color={
                      selectedSettlement.status === 'paid' ? 'success' :
                      selectedSettlement.status === 'approved' ? 'info' :
                      selectedSettlement.status === 'pending' ? 'warning' : 'default'
                    }
                  />
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Component</strong></TableCell>
                      <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Notice Period Amount</TableCell>
                      <TableCell align="right">{parseFloat(selectedSettlement.noticePeriodAmount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Earned Leave Encashment</TableCell>
                      <TableCell align="right">{parseFloat(selectedSettlement.earnedLeaveAmount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gratuity</TableCell>
                      <TableCell align="right">{parseFloat(selectedSettlement.gratuity || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bonus</TableCell>
                      <TableCell align="right">{parseFloat(selectedSettlement.bonus || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other Payments</TableCell>
                      <TableCell align="right">{parseFloat(selectedSettlement.otherPayments || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Gross Amount</strong></TableCell>
                      <TableCell align="right"><strong>{parseFloat(selectedSettlement.grossAmount || 0).toFixed(2)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Outstanding Loans</TableCell>
                      <TableCell align="right">-{parseFloat(selectedSettlement.outstandingLoans || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Outstanding Advances</TableCell>
                      <TableCell align="right">-{parseFloat(selectedSettlement.outstandingAdvances || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Unpaid Leave Deduction</TableCell>
                      <TableCell align="right">-{parseFloat(selectedSettlement.unpaidLeaveDeduction || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other Deductions</TableCell>
                      <TableCell align="right">-{parseFloat(selectedSettlement.otherDeductions || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Total Deductions</strong></TableCell>
                      <TableCell align="right"><strong>-{parseFloat(selectedSettlement.totalDeductions || 0).toFixed(2)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Net Amount</strong></TableCell>
                      <TableCell align="right"><strong>{parseFloat(selectedSettlement.netAmount || 0).toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



