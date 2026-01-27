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
  FormControlLabel,
  Switch,
  Chip,
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import DataTable from '../DataTable';

export default function PFConfiguration({ company }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: configsData, isLoading } = useQuery(
    ['statutoryConfigs', company?.id, 'PF'],
    () => statutoryService.getConfigurations(company?.id, { statutoryType: 'PF' }),
    { enabled: !!company?.id, refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      state: '',
      isEnabled: true,
      autoDeduction: true,
      configuration: {
        wageLimit: 15000,
        employeeRate: 12,
        employerRate: 12,
        epfNumber: '',
        establishmentId: ''
      }
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createConfiguration({ ...data, companyId: company.id, statutoryType: 'PF' }),
    {
      onSuccess: () => {
        toast.success('PF configuration created successfully');
        queryClient.invalidateQueries(['statutoryConfigs', company?.id]);
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create PF configuration');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateConfiguration(id, data),
    {
      onSuccess: () => {
        toast.success('PF configuration updated successfully');
        queryClient.invalidateQueries(['statutoryConfigs', company?.id]);
        setDialogOpen(false);
        reset();
        setSelectedConfig(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update PF configuration');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteConfiguration(id),
    {
      onSuccess: () => {
        toast.success('PF configuration deleted successfully');
        queryClient.invalidateQueries(['statutoryConfigs', company?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete PF configuration');
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
        configuration: config.configuration || {}
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
    if (window.confirm(`Are you sure you want to delete PF configuration for ${config.state}?`)) {
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
      format: (value) => (
        <Chip label={value ? 'Enabled' : 'Disabled'} color={value ? 'success' : 'default'} size="small" />
      )
    },
    {
      id: 'autoDeduction',
      label: 'Auto Deduction',
      minWidth: 120,
      format: (value) => (value ? 'Yes' : 'No')
    },
    {
      id: 'wageLimit',
      label: 'Wage Limit',
      minWidth: 120,
      format: (value, row) => `₹${(row.configuration?.wageLimit || 0).toLocaleString()}`
    },
    {
      id: 'rate',
      label: 'Rate',
      minWidth: 100,
      format: (value, row) => `Emp: ${row.configuration?.employeeRate || 0}% | Empr: ${row.configuration?.employerRate || 0}%`
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
        <Typography variant="h6">Provident Fund (PF) Configuration</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add PF Configuration
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={configs}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by state..."
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit PF Configuration' : 'Add PF Configuration'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="state"
                control={control}
                rules={{ required: 'State is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="State"
                    fullWidth
                    error={!!errors.state}
                    helperText={errors.state?.message}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="isEnabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable PF"
                    />
                  )}
                />
                <Controller
                  name="autoDeduction"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Auto Deduction"
                    />
                  )}
                />
              </Box>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>PF Settings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="configuration.wageLimit"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Wage Limit (₹)"
                        type="number"
                        fullWidth
                        value={field.value || ''}
                        onChange={(e) => field.onChange({ ...field.value, wageLimit: parseFloat(e.target.value) || 0 })}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="configuration.employeeRate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Employee Rate (%)"
                        type="number"
                        fullWidth
                        value={field.value?.employeeRate || ''}
                        onChange={(e) => field.onChange({ ...field.value, employeeRate: parseFloat(e.target.value) || 0 })}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="configuration.employerRate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Employer Rate (%)"
                        type="number"
                        fullWidth
                        value={field.value?.employerRate || ''}
                        onChange={(e) => field.onChange({ ...field.value, employerRate: parseFloat(e.target.value) || 0 })}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="configuration.epfNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="EPF Number"
                        fullWidth
                        value={field.value?.epfNumber || ''}
                        onChange={(e) => field.onChange({ ...field.value, epfNumber: e.target.value })}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="configuration.establishmentId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Establishment ID"
                        fullWidth
                        value={field.value?.establishmentId || ''}
                        onChange={(e) => field.onChange({ ...field.value, establishmentId: e.target.value })}
                      />
                    )}
                  />
                </Grid>
              </Grid>
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



