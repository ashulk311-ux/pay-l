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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { reimbursementService } from '../services/reimbursementService';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';

export default function ReimbursementManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '' });

  const { data, isLoading } = useQuery(
    ['reimbursements', filters],
    () => reimbursementService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), {
    refetchOnWindowFocus: false
  });

  const createMutation = useMutation(
    (data) => reimbursementService.create(data),
    {
      onSuccess: () => {
        toast.success('Reimbursement created successfully');
        queryClient.invalidateQueries('reimbursements');
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create reimbursement');
      }
    }
  );

  const approveMutation = useMutation(
    (id) => reimbursementService.approve(id),
    {
      onSuccess: () => {
        toast.success('Reimbursement approved successfully');
        queryClient.invalidateQueries('reimbursements');
        setApproveDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve reimbursement');
      }
    }
  );

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm();

  const handleApprove = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setApproveDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedReimbursement) {
      approveMutation.mutate(selectedReimbursement.id);
    }
  };

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const reimbursements = data?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Employee Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    { field: 'category', header: 'Category' },
    { field: 'amount', header: 'Amount', format: 'currency' },
    { field: 'date', header: 'Date', format: 'date' },
    { field: 'description', header: 'Description' },
    {
      field: 'isTaxable',
      header: 'Taxable',
      render: (value) => value ? <Chip label="Yes" size="small" color="warning" /> : <Chip label="No" size="small" />
    },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        pending: 'warning',
        approved: 'info',
        rejected: 'error',
        paid: 'success'
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
        <Typography variant="h4">Reimbursement Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Reimbursement
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
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={reimbursements}
        loading={isLoading}
        searchable
        searchPlaceholder="Search reimbursements..."
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add Reimbursement</DialogTitle>
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
                label="Category"
                {...register('category', { required: 'Category is required' })}
                sx={{ mb: 2 }}
                error={!!errors.category}
                helperText={errors.category?.message}
              />
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
                label="Date"
                type="date"
                {...register('date', { required: 'Date is required' })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                error={!!errors.date}
                helperText={errors.date?.message}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                {...register('description')}
                sx={{ mb: 2 }}
              />
              <Controller
                name="isTaxable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Taxable"
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
        <DialogTitle>Approve Reimbursement</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this reimbursement of ₹{selectedReimbursement?.amount}?
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

