import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Typography, FormControlLabel, Switch, Chip, Grid } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import DataTable from '../DataTable';

export default function PTConfiguration({ company }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: configsData, isLoading } = useQuery(
    ['statutoryConfigs', company?.id, 'PT'],
    () => statutoryService.getConfigurations(company?.id, { statutoryType: 'PT' }),
    { enabled: !!company?.id, refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      state: '',
      isEnabled: true,
      autoDeduction: true,
      configuration: { slabs: {} }
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createConfiguration({ ...data, companyId: company.id, statutoryType: 'PT' }),
    {
      onSuccess: () => {
        toast.success('PT configuration created successfully');
        queryClient.invalidateQueries(['statutoryConfigs', company?.id]);
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create PT configuration');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateConfiguration(id, data),
    {
      onSuccess: () => {
        toast.success('PT configuration updated successfully');
        queryClient.invalidateQueries(['statutoryConfigs', company?.id]);
        setDialogOpen(false);
        reset();
        setSelectedConfig(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update PT configuration');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteConfiguration(id),
    {
      onSuccess: () => {
        toast.success('PT configuration deleted successfully');
        queryClient.invalidateQueries(['statutoryConfigs', company?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete PT configuration');
      }
    }
  );

  const handleOpenDialog = (config = null) => {
    if (config) {
      setSelectedConfig(config);
      setIsEdit(true);
      reset({
        state: config.state,
        isEnabled: config.isEnabled,
        autoDeduction: config.autoDeduction,
        configuration: config.configuration || { slabs: {} }
      });
    } else {
      setSelectedConfig(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedConfig(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (config) => {
    if (window.confirm(`Are you sure you want to delete PT configuration for ${config.state}?`)) {
      deleteMutation.mutate(config.id);
    }
  };

  const configs = configsData?.data || [];

  const columns = [
    { id: 'state', label: 'State', minWidth: 120 },
    {
      id: 'isEnabled',
      label: 'Status',
      minWidth: 100,
      format: (value) => <Chip label={value ? 'Enabled' : 'Disabled'} color={value ? 'success' : 'default'} size="small" />
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      format: (value, row) => (
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
        <Typography variant="h6">Professional Tax (PT) Configuration</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add PT Configuration
        </Button>
      </Box>

      <DataTable columns={columns} data={configs} loading={isLoading} searchable searchPlaceholder="Search by state..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit PT Configuration' : 'Add PT Configuration'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="state"
                control={control}
                rules={{ required: 'State is required' }}
                render={({ field }) => (
                  <TextField {...field} label="State" fullWidth required />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="isEnabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Enable PT" />
                  )}
                />
                <Controller
                  name="autoDeduction"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Auto Deduction" />
                  )}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Professional Tax slabs are state-specific. Configure them based on your state regulations.
              </Typography>
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



