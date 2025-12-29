import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { departmentService } from '../../services/departmentService';
import { employeeService } from '../../services/employeeService';
import DataTable from '../DataTable';

export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: departmentsData, isLoading, error: departmentsError } = useQuery('departments', () => departmentService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const { data: employeesData } = useQuery('employees', () => employeeService.getAll());

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      headEmployeeId: ''
    }
  });

  const createMutation = useMutation(
    (data) => departmentService.create(data),
    {
      onSuccess: () => {
        toast.success('Department created successfully');
        queryClient.invalidateQueries('departments');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create department');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => departmentService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Department updated successfully');
        queryClient.invalidateQueries('departments');
        setDialogOpen(false);
        reset();
        setSelectedDept(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update department');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => departmentService.delete(id),
    {
      onSuccess: () => {
        toast.success('Department deleted successfully');
        queryClient.invalidateQueries('departments');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete department');
      }
    }
  );

  const handleOpenDialog = (dept = null) => {
    if (dept) {
      setSelectedDept(dept);
      setIsEdit(true);
      reset(dept);
    } else {
      setSelectedDept(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedDept(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedDept.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (dept) => {
    if (window.confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
      deleteMutation.mutate(dept.id);
    }
  };

  const departments = departmentsData?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 150 },
    {
      field: 'head',
      header: 'Head',
      minWidth: 150,
      accessor: (row) => row.head ? `${row.head.firstName} ${row.head.lastName}` : 'N/A',
      render: (value, row) => row.head ? `${row.head.firstName} ${row.head.lastName}` : 'N/A'
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 120,
      render: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(row)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Departments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Department
        </Button>
      </Box>

      {departmentsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading departments: {departmentsError?.response?.data?.message || departmentsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !departmentsError && departments.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No departments found. Add your first department to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !departmentsError && departments.length > 0 && (
        <DataTable
          columns={columns}
          data={departments}
          loading={isLoading}
          searchable
          searchPlaceholder="Search departments..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="code"
                  control={control}
                  rules={{ required: 'Code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Department Code"
                      fullWidth
                      error={!!errors.code}
                      helperText={errors.code?.message}
                    />
                  )}
                />
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Department Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}
              />
              <Controller
                name="headEmployeeId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Department Head</InputLabel>
                    <Select {...field} label="Department Head">
                      <MenuItem value="">None</MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

