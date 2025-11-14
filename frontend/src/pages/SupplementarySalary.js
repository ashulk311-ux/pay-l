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
import DeleteIcon from '@mui/icons-material/Delete';
import { supplementaryService } from '../services/supplementaryService';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';

export default function SupplementarySalary() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ type: '', month: '', year: '' });

  const { data, isLoading } = useQuery(
    ['supplementary', filters],
    () => supplementaryService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), {
    refetchOnWindowFocus: false
  });

  const createMutation = useMutation(
    (data) => supplementaryService.create(data),
    {
      onSuccess: () => {
        toast.success('Supplementary salary created successfully');
        queryClient.invalidateQueries('supplementary');
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create supplementary salary');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => supplementaryService.delete(id),
    {
      onSuccess: () => {
        toast.success('Supplementary salary deleted successfully');
        queryClient.invalidateQueries('supplementary');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete supplementary salary');
      }
    }
  );

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm();

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this supplementary salary?')) {
      deleteMutation.mutate(id);
    }
  };

  const supplementary = data?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Employee Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    {
      field: 'type',
      header: 'Type',
      type: 'chip',
      chipColors: {
        arrears: 'info',
        incentive: 'success',
        bonus: 'warning',
        'full-final': 'error',
        other: 'default'
      }
    },
    { field: 'amount', header: 'Amount', format: 'currency' },
    {
      field: 'period',
      header: 'Period',
      accessor: (row) => row.month && row.year ? `${row.month}/${row.year}` : '-'
    },
    { field: 'description', header: 'Description' },
    {
      field: 'isProcessed',
      header: 'Processed',
      render: (value) => value ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" />
    },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        !row.isProcessed && (
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row.id)}
          >
            <DeleteIcon />
          </IconButton>
        )
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Supplementary Salary</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Supplementary Salary
        </Button>
      </Box>

      <Box mb={3} display="flex" gap={2}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.type}
            label="Type"
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="arrears">Arrears</MenuItem>
            <MenuItem value="incentive">Incentive</MenuItem>
            <MenuItem value="bonus">Bonus</MenuItem>
            <MenuItem value="full-final">Full & Final</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={supplementary}
        loading={isLoading}
        searchable
        searchPlaceholder="Search supplementary salaries..."
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add Supplementary Salary</DialogTitle>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Type</InputLabel>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <Select {...field} label="Type">
                      <MenuItem value="arrears">Arrears</MenuItem>
                      <MenuItem value="incentive">Incentive</MenuItem>
                      <MenuItem value="bonus">Bonus</MenuItem>
                      <MenuItem value="full-final">Full & Final</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
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
                label="Month (Optional)"
                type="number"
                {...register('month', { min: 1, max: 12 })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Year (Optional)"
                type="number"
                {...register('year')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                {...register('description')}
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
    </Container>
  );
}

