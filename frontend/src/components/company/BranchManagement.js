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
import { branchService } from '../../services/branchService';
import DataTable from '../DataTable';

export default function BranchManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: branchesData, isLoading, error: branchesError } = useQuery('branches', () => branchService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      phone: '',
      email: '',
      contactPerson: ''
    }
  });

  const createMutation = useMutation(
    (data) => branchService.create(data),
    {
      onSuccess: () => {
        toast.success('Branch created successfully');
        queryClient.invalidateQueries('branches');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create branch');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => branchService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Branch updated successfully');
        queryClient.invalidateQueries('branches');
        setDialogOpen(false);
        reset();
        setSelectedBranch(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update branch');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => branchService.delete(id),
    {
      onSuccess: () => {
        toast.success('Branch deleted successfully');
        queryClient.invalidateQueries('branches');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete branch');
      }
    }
  );

  const handleOpenDialog = (branch = null) => {
    if (branch) {
      setSelectedBranch(branch);
      setIsEdit(true);
      reset(branch);
    } else {
      setSelectedBranch(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedBranch(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (branch) => {
    if (window.confirm(`Are you sure you want to delete branch "${branch.name}"?`)) {
      deleteMutation.mutate(branch.id);
    }
  };

  const branches = branchesData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 150 },
    { field: 'city', header: 'City', minWidth: 120 },
    { field: 'state', header: 'State', minWidth: 120 },
    { field: 'phone', header: 'Phone', minWidth: 120 },
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
        <Typography variant="h6">Branches</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Branch
        </Button>
      </Box>

      {branchesError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading branches: {branchesError?.response?.data?.message || branchesError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !branchesError && branches.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No branches found. Add your first branch to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !branchesError && branches.length > 0 && (
        <DataTable
          columns={columns}
          data={branches}
          loading={isLoading}
          searchable
          searchPlaceholder="Search branches..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
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
                      label="Branch Code"
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
                      label="Branch Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address"
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="City" fullWidth />
                  )}
                />
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="State" fullWidth />
                  )}
                />
                <Controller
                  name="pincode"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Pincode" fullWidth />
                  )}
                />
              </Box>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Country" fullWidth />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Phone" fullWidth />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Email" type="email" fullWidth />
                  )}
                />
              </Box>
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Contact Person" fullWidth />
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

