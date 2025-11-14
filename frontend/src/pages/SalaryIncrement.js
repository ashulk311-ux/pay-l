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
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { incrementService } from '../services/incrementService';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';

export default function SalaryIncrement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState(null);
  const [filters, setFilters] = useState({ status: '' });

  const { data, isLoading } = useQuery(
    ['increments', filters],
    () => incrementService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), {
    refetchOnWindowFocus: false
  });

  const createMutation = useMutation(
    (data) => incrementService.create(data),
    {
      onSuccess: () => {
        toast.success('Salary increment created successfully');
        queryClient.invalidateQueries('increments');
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create increment');
      }
    }
  );

  const approveMutation = useMutation(
    (id) => incrementService.approve(id),
    {
      onSuccess: () => {
        toast.success('Increment approved successfully');
        queryClient.invalidateQueries('increments');
        setApproveDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve increment');
      }
    }
  );

  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm();

  const newSalary = watch('newSalary');

  const handleApprove = (increment) => {
    setSelectedIncrement(increment);
    setApproveDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedIncrement) {
      approveMutation.mutate(selectedIncrement.id);
    }
  };

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const increments = data?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Employee Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    { field: 'effectiveDate', header: 'Effective Date', format: 'date' },
    { field: 'previousSalary', header: 'Previous Salary', format: 'currency' },
    { field: 'newSalary', header: 'New Salary', format: 'currency' },
    { field: 'incrementAmount', header: 'Increment Amount', format: 'currency' },
    { field: 'incrementPercentage', header: 'Increment %', accessor: (row) => `${row.incrementPercentage}%` },
    { field: 'reason', header: 'Reason' },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        pending: 'warning',
        approved: 'success',
        rejected: 'error'
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
        <Typography variant="h4">Salary Increment</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Increment
        </Button>
      </Box>

      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={increments}
        loading={isLoading}
        searchable
        searchPlaceholder="Search increments..."
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add Salary Increment</DialogTitle>
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
              </FormControl>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                {...register('effectiveDate', { required: 'Effective date is required' })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                error={!!errors.effectiveDate}
                helperText={errors.effectiveDate?.message}
              />
              <TextField
                fullWidth
                label="New Salary"
                type="number"
                {...register('newSalary', { required: 'New salary is required', min: 1 })}
                sx={{ mb: 2 }}
                error={!!errors.newSalary}
                helperText={errors.newSalary?.message}
              />
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                {...register('reason')}
                sx={{ mb: 2 }}
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
        <DialogTitle>Approve Increment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this salary increment of ₹{selectedIncrement?.incrementAmount} ({selectedIncrement?.incrementPercentage}%)?
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

