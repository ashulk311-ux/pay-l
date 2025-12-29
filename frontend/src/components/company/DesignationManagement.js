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
  Typography
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { designationService } from '../../services/designationService';
import DataTable from '../DataTable';

export default function DesignationManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: designationsData, isLoading, error: designationsError } = useQuery('designations', () => designationService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      level: 0,
      description: '',
      minSalary: '',
      maxSalary: ''
    }
  });

  const createMutation = useMutation(
    (data) => designationService.create(data),
    {
      onSuccess: () => {
        toast.success('Designation created successfully');
        queryClient.invalidateQueries('designations');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create designation');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => designationService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Designation updated successfully');
        queryClient.invalidateQueries('designations');
        setDialogOpen(false);
        reset();
        setSelectedDesignation(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update designation');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => designationService.delete(id),
    {
      onSuccess: () => {
        toast.success('Designation deleted successfully');
        queryClient.invalidateQueries('designations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete designation');
      }
    }
  );

  const handleOpenDialog = (designation = null) => {
    if (designation) {
      setSelectedDesignation(designation);
      setIsEdit(true);
      reset(designation);
    } else {
      setSelectedDesignation(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedDesignation(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedDesignation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (designation) => {
    if (window.confirm(`Are you sure you want to delete designation "${designation.name}"?`)) {
      deleteMutation.mutate(designation.id);
    }
  };

  const designations = designationsData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 150 },
    { field: 'level', header: 'Level', minWidth: 80 },
    {
      field: 'salaryRange',
      header: 'Salary Range',
      minWidth: 150,
      render: (value, row) => {
        const min = row.minSalary ? `₹${parseFloat(row.minSalary).toLocaleString()}` : 'N/A';
        const max = row.maxSalary ? `₹${parseFloat(row.maxSalary).toLocaleString()}` : 'N/A';
        return `${min} - ${max}`;
      }
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
        <Typography variant="h6">Designations</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Designation
        </Button>
      </Box>

      {designationsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading designations: {designationsError?.response?.data?.message || designationsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !designationsError && designations.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No designations found. Add your first designation to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !designationsError && designations.length > 0 && (
        <DataTable
          columns={columns}
          data={designations}
          loading={isLoading}
          searchable
          searchPlaceholder="Search designations..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Designation' : 'Add New Designation'}</DialogTitle>
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
                      label="Designation Code"
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
                      label="Designation Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Level"
                    type="number"
                    fullWidth
                  />
                )}
              />
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="minSalary"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Min Salary"
                      type="number"
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="maxSalary"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Max Salary"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Box>
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

