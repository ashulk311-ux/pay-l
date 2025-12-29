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
import { subDepartmentService } from '../../services/subDepartmentService';
import { departmentService } from '../../services/departmentService';
import DataTable from '../DataTable';

export default function SubDepartmentManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubDept, setSelectedSubDept] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: subDepartmentsData, isLoading, error: subDepartmentsError } = useQuery('subDepartments', () => subDepartmentService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const { data: departmentsData } = useQuery('departments', () => departmentService.getAll());

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      departmentId: ''
    }
  });

  const createMutation = useMutation(
    (data) => subDepartmentService.create(data),
    {
      onSuccess: () => {
        toast.success('Sub-Department created successfully');
        queryClient.invalidateQueries('subDepartments');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create sub-department');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => subDepartmentService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Sub-Department updated successfully');
        queryClient.invalidateQueries('subDepartments');
        setDialogOpen(false);
        reset();
        setSelectedSubDept(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update sub-department');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => subDepartmentService.delete(id),
    {
      onSuccess: () => {
        toast.success('Sub-Department deleted successfully');
        queryClient.invalidateQueries('subDepartments');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete sub-department');
      }
    }
  );

  const handleOpenDialog = (subDept = null) => {
    if (subDept) {
      setSelectedSubDept(subDept);
      setIsEdit(true);
      reset(subDept);
    } else {
      setSelectedSubDept(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedSubDept(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedSubDept.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (subDept) => {
    if (window.confirm(`Are you sure you want to delete sub-department "${subDept.name}"?`)) {
      deleteMutation.mutate(subDept.id);
    }
  };

  const subDepartments = subDepartmentsData?.data || [];
  const departments = departmentsData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { 
      field: 'department', 
      header: 'Department', 
      minWidth: 150,
      render: (value, row) => row.departmentRef?.name || '-'
    },
    { field: 'description', header: 'Description', minWidth: 250 },
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
        <Typography variant="h6">Sub-Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Sub-Department
        </Button>
      </Box>

      {subDepartmentsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading sub-departments: {subDepartmentsError?.response?.data?.message || subDepartmentsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !subDepartmentsError && subDepartments.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No sub-departments found. Add your first sub-department to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !subDepartmentsError && subDepartments.length > 0 && (
        <DataTable
          columns={columns}
          data={subDepartments}
          loading={isLoading}
          searchable
          searchPlaceholder="Search sub-departments..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Sub-Department' : 'Add New Sub-Department'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="departmentId"
                control={control}
                rules={{ required: 'Department is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.departmentId}>
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department">
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="code"
                  control={control}
                  rules={{ required: 'Code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sub-Department Code"
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
                      label="Sub-Department Name"
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


