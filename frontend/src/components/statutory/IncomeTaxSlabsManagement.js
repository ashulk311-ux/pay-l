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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import DataTable from '../DataTable';

export default function IncomeTaxSlabsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [tabValue, setTabValue] = useState('new');

  const { data: slabsData, isLoading, error: slabsError } = useQuery(
    ['incomeTaxSlabs', tabValue],
    () => statutoryService.getIncomeTaxSlabs({ taxRegime: tabValue }),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      taxRegime: 'new',
      slabType: 'individual',
      serialNumber: 1,
      lowerLimit: 0,
      upperLimit: 0,
      taxPercent: 0,
      startFinancialYear: new Date().toISOString().split('T')[0],
      endFinancialYear: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }
  });


  const createMutation = useMutation(
    (data) => statutoryService.createIncomeTaxSlab(data),
    {
      onSuccess: () => {
        toast.success('Income Tax Slab created successfully');
        queryClient.invalidateQueries('incomeTaxSlabs');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create income tax slab');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateIncomeTaxSlab(id, data),
    {
      onSuccess: () => {
        toast.success('Income Tax Slab updated successfully');
        queryClient.invalidateQueries('incomeTaxSlabs');
        setDialogOpen(false);
        reset();
        setSelectedSlab(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update income tax slab');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteIncomeTaxSlab(id),
    {
      onSuccess: () => {
        toast.success('Income Tax Slab deleted successfully');
        queryClient.invalidateQueries('incomeTaxSlabs');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete income tax slab');
      }
    }
  );

  const handleOpenDialog = (slab = null) => {
    if (slab) {
      setSelectedSlab(slab);
      setIsEdit(true);
      reset({
        ...slab,
        startFinancialYear: slab.startFinancialYear ? new Date(slab.startFinancialYear).toISOString().split('T')[0] : '',
        endFinancialYear: slab.endFinancialYear ? new Date(slab.endFinancialYear).toISOString().split('T')[0] : ''
      });
    } else {
      setSelectedSlab(null);
      setIsEdit(false);
      reset({
        taxRegime: tabValue,
        slabType: 'individual',
        serialNumber: 1,
        lowerLimit: 0,
        upperLimit: 0,
        taxPercent: 0,
        startFinancialYear: new Date().toISOString().split('T')[0],
        endFinancialYear: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedSlab(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    const submitData = {
      ...data,
      startFinancialYear: new Date(data.startFinancialYear),
      endFinancialYear: new Date(data.endFinancialYear)
    };
    if (isEdit) {
      updateMutation.mutate({ id: selectedSlab.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (slab) => {
    if (window.confirm(`Are you sure you want to delete this income tax slab?`)) {
      deleteMutation.mutate(slab.id);
    }
  };

  const slabs = slabsData?.data || [];

  const columns = [
    { field: 'serialNumber', header: 'Serial No.', minWidth: 80 },
    { field: 'slabType', header: 'Slab Type', minWidth: 120, render: (value) => value?.replace('_', ' ').toUpperCase() },
    { 
      field: 'lowerLimit', 
      header: 'Lower Limit', 
      minWidth: 120,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN')}`
    },
    { 
      field: 'upperLimit', 
      header: 'Upper Limit', 
      minWidth: 120,
      render: (value) => value >= 999999999 ? '∞' : `₹${parseFloat(value || 0).toLocaleString('en-IN')}`
    },
    { 
      field: 'taxPercent', 
      header: 'Tax %', 
      minWidth: 80,
      render: (value) => `${parseFloat(value || 0).toFixed(2)}%`
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
        <Typography variant="h6">Income Tax Slabs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Tax Slab
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="New Tax Regime" value="new" />
          <Tab label="Old Tax Regime" value="old" />
        </Tabs>
      </Box>

      {slabsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading income tax slabs: {slabsError?.response?.data?.message || slabsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !slabsError && slabs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No income tax slabs found for {tabValue === 'new' ? 'new' : 'old'} regime. Add your first slab to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !slabsError && slabs.length > 0 && (
        <DataTable
          columns={columns}
          data={slabs}
          loading={isLoading}
          searchable
          searchPlaceholder="Search slabs..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Income Tax Slab' : 'Add New Income Tax Slab'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="taxRegime"
                  control={control}
                  rules={{ required: 'Tax regime is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.taxRegime}>
                      <InputLabel>Tax Regime</InputLabel>
                      <Select {...field} label="Tax Regime">
                        <MenuItem value="new">New Tax Regime</MenuItem>
                        <MenuItem value="old">Old Tax Regime</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="slabType"
                  control={control}
                  rules={{ required: 'Slab type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.slabType}>
                      <InputLabel>Slab Type</InputLabel>
                      <Select {...field} label="Slab Type">
                        <MenuItem value="individual">Individual</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="senior_citizen">Senior Citizen</MenuItem>
                        <MenuItem value="super_senior_citizen">Super Senior Citizen</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="serialNumber"
                  control={control}
                  rules={{ required: 'Serial number is required', min: { value: 1, message: 'Must be at least 1' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Serial Number"
                      type="number"
                      fullWidth
                      error={!!errors.serialNumber}
                      helperText={errors.serialNumber?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="lowerLimit"
                  control={control}
                  rules={{ required: 'Lower limit is required', min: { value: 0, message: 'Must be 0 or greater' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Lower Limit (₹)"
                      type="number"
                      fullWidth
                      error={!!errors.lowerLimit}
                      helperText={errors.lowerLimit?.message}
                    />
                  )}
                />
                <Controller
                  name="upperLimit"
                  control={control}
                  rules={{ required: 'Upper limit is required', min: { value: 0, message: 'Must be 0 or greater' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Upper Limit (₹)"
                      type="number"
                      fullWidth
                      error={!!errors.upperLimit}
                      helperText={errors.upperLimit?.message}
                    />
                  )}
                />
                <Controller
                  name="taxPercent"
                  control={control}
                  rules={{ required: 'Tax percent is required', min: { value: 0, message: 'Must be 0 or greater' }, max: { value: 100, message: 'Must be 100 or less' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tax Percent (%)"
                      type="number"
                      fullWidth
                      error={!!errors.taxPercent}
                      helperText={errors.taxPercent?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="startFinancialYear"
                  control={control}
                  rules={{ required: 'Start financial year is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Financial Year"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.startFinancialYear}
                      helperText={errors.startFinancialYear?.message}
                    />
                  )}
                />
                <Controller
                  name="endFinancialYear"
                  control={control}
                  rules={{ required: 'End financial year is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Financial Year"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.endFinancialYear}
                      helperText={errors.endFinancialYear?.message}
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


