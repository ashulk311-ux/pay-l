import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { loanService } from '../services/loanService';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';

export default function LoanManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filters, setFilters] = useState({ status: '', loanType: '' });

  const { data, isLoading } = useQuery(
    ['loans', filters],
    () => loanService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), {
    refetchOnWindowFocus: false
  });

  const createMutation = useMutation(
    (data) => loanService.create(data),
    {
      onSuccess: () => {
        toast.success('Loan created successfully');
        queryClient.invalidateQueries('loans');
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create loan');
      }
    }
  );

  const approveMutation = useMutation(
    (id) => loanService.approve(id),
    {
      onSuccess: () => {
        toast.success('Loan approved successfully');
        queryClient.invalidateQueries('loans');
        setApproveDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve loan');
      }
    }
  );

  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      employeeId: '',
      loanType: 'loan',
      amount: '',
      interestRate: '0',
      tenure: '',
      startDate: '',
      autoDeduct: true
    }
  });

  const loanType = watch('loanType');
  const amount = watch('amount');
  const interestRate = watch('interestRate');
  const tenure = watch('tenure');

  const handleApprove = (loan) => {
    setSelectedLoan(loan);
    setApproveDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedLoan) {
      approveMutation.mutate(selectedLoan.id);
    }
  };

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const loans = data?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Employee Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    { field: 'loanType', header: 'Type' },
    { field: 'amount', header: 'Amount', format: 'currency' },
    { field: 'interestRate', header: 'Interest Rate', accessor: (row) => `${row.interestRate}%` },
    { field: 'tenure', header: 'Tenure (Months)' },
    { field: 'emiAmount', header: 'EMI Amount', format: 'currency' },
    { field: 'outstandingAmount', header: 'Outstanding', format: 'currency' },
    { field: 'startDate', header: 'Start Date', format: 'date' },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        pending: 'warning',
        approved: 'info',
        active: 'success',
        closed: 'default'
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        row.status === 'pending' && (
          <IconButton
            size="small"
            color="success"
            onClick={() => handleApprove(row)}
          >
            <CheckCircleIcon />
          </IconButton>
        )
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Loan & Advance Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Loan/Advance
        </Button>
      </Box>

      <Box mb={3} display="flex" gap={2}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.loanType}
            label="Type"
            onChange={(e) => setFilters({ ...filters, loanType: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="loan">Loan</MenuItem>
            <MenuItem value="advance">Advance</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={loans}
        loading={isLoading}
        searchable
        searchPlaceholder="Search loans..."
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add Loan/Advance</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Employee</InputLabel>
                <Controller
                  name="employeeId"
                  control={control}
                  rules={{ required: 'Employee is required' }}
                  render={({ field }) => (
                    <Select {...field} label="Employee">
                      {employees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.employeeCode} - {emp.firstName} {emp.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.employeeId && (
                  <Typography variant="caption" color="error">{errors.employeeId.message}</Typography>
                )}
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Type</InputLabel>
                <Controller
                  name="loanType"
                  control={control}
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <Select {...field} label="Type">
                      <MenuItem value="loan">Loan</MenuItem>
                      <MenuItem value="advance">Advance</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                {...register('amount', { required: 'Amount is required', min: 1 })}
                sx={{ mb: 2 }}
                error={!!errors.amount}
                helperText={errors.amount?.message}
              />
              <TextField
                fullWidth
                label="Interest Rate (%)"
                type="number"
                {...register('interestRate', { min: 0, max: 100 })}
                sx={{ mb: 2 }}
                disabled={loanType === 'advance'}
                helperText={loanType === 'advance' ? 'Advance has no interest' : ''}
              />
              <TextField
                fullWidth
                label="Tenure (Months)"
                type="number"
                {...register('tenure', { required: 'Tenure is required', min: 1 })}
                sx={{ mb: 2 }}
                error={!!errors.tenure}
                helperText={errors.tenure?.message}
              />
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
              />
              {amount && tenure && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated EMI: ₹{loanType === 'advance' || !interestRate || interestRate === '0'
                      ? (parseFloat(amount) / parseInt(tenure || 1)).toFixed(2)
                      : (() => {
                          const principal = parseFloat(amount);
                          const rate = parseFloat(interestRate || 0) / 100 / 12;
                          const months = parseInt(tenure || 1);
                          const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
                          return emi.toFixed(2);
                        })()}
                  </Typography>
                </Box>
              )}
              <Controller
                name="autoDeduct"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Auto Deduct from Salary"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDialogOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Loan</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this {selectedLoan?.loanType} of ₹{selectedLoan?.amount}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmApprove} variant="contained" color="success" disabled={approveMutation.isLoading}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

