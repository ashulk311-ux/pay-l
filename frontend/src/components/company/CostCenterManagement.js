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
import { costCenterService } from '../../services/costCenterService';
import DataTable from '../DataTable';

export default function CostCenterManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: costCentersData, isLoading, error: costCentersError } = useQuery('costCenters', () => costCenterService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: ''
    }
  });

  const createMutation = useMutation(
    (data) => costCenterService.create(data),
    {
      onSuccess: () => {
        toast.success('Cost Center created successfully');
        queryClient.invalidateQueries('costCenters');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create cost center');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => costCenterService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Cost Center updated successfully');
        queryClient.invalidateQueries('costCenters');
        setDialogOpen(false);
        reset();
        setSelectedCostCenter(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update cost center');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => costCenterService.delete(id),
    {
      onSuccess: () => {
        toast.success('Cost Center deleted successfully');
        queryClient.invalidateQueries('costCenters');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete cost center');
      }
    }
  );

  const handleOpenDialog = (costCenter = null) => {
    if (costCenter) {
      setSelectedCostCenter(costCenter);
      setIsEdit(true);
      reset(costCenter);
    } else {
      setSelectedCostCenter(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedCostCenter(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedCostCenter.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (costCenter) => {
    if (window.confirm(`Are you sure you want to delete cost center "${costCenter.name}"?`)) {
      deleteMutation.mutate(costCenter.id);
    }
  };

  const costCenters = costCentersData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
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
        <Typography variant="h6">Cost Centers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Cost Center
        </Button>
      </Box>

      {costCentersError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading cost centers: {costCentersError?.response?.data?.message || costCentersError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !costCentersError && costCenters.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No cost centers found. Add your first cost center to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !costCentersError && costCenters.length > 0 && (
        <DataTable
          columns={columns}
          data={costCenters}
          loading={isLoading}
          searchable
          searchPlaceholder="Search cost centers..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Cost Center' : 'Add New Cost Center'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="code"
                control={control}
                rules={{ required: 'Code is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cost Center Code"
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
                    label="Cost Center Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
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


