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
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import { stateService } from '../../services/stateService';
import DataTable from '../DataTable';

export default function ProfessionalTaxSlabsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: slabsData, isLoading, error: slabsError } = useQuery(
    'professionalTaxSlabs',
    () => statutoryService.getProfessionalTaxSlabs(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { data: statesData } = useQuery('states', () => stateService.getAll());

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      state: '',
      personType: 'all',
      minimumLimit: 0,
      maximumLimit: 0,
      startFinancialYear: new Date().toISOString().split('T')[0],
      endFinancialYear: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      seniorCitizenAge: 60,
      monthlyAmounts: {
        apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
        oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
      }
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createProfessionalTaxSlab(data),
    {
      onSuccess: () => {
        toast.success('Professional Tax Slab created successfully');
        queryClient.invalidateQueries('professionalTaxSlabs');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create professional tax slab');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateProfessionalTaxSlab(id, data),
    {
      onSuccess: () => {
        toast.success('Professional Tax Slab updated successfully');
        queryClient.invalidateQueries('professionalTaxSlabs');
        setDialogOpen(false);
        reset();
        setSelectedSlab(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update professional tax slab');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteProfessionalTaxSlab(id),
    {
      onSuccess: () => {
        toast.success('Professional Tax Slab deleted successfully');
        queryClient.invalidateQueries('professionalTaxSlabs');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete professional tax slab');
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
        endFinancialYear: slab.endFinancialYear ? new Date(slab.endFinancialYear).toISOString().split('T')[0] : '',
        monthlyAmounts: slab.monthlyAmounts || {
          apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
          oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
        }
      });
    } else {
      setSelectedSlab(null);
      setIsEdit(false);
      reset();
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
    if (window.confirm(`Are you sure you want to delete this professional tax slab?`)) {
      deleteMutation.mutate(slab.id);
    }
  };

  const slabs = slabsData?.data || [];
  const states = statesData?.data || [];

  const months = [
    { key: 'apr', label: 'April' },
    { key: 'may', label: 'May' },
    { key: 'jun', label: 'June' },
    { key: 'jul', label: 'July' },
    { key: 'aug', label: 'August' },
    { key: 'sep', label: 'September' },
    { key: 'oct', label: 'October' },
    { key: 'nov', label: 'November' },
    { key: 'dec', label: 'December' },
    { key: 'jan', label: 'January' },
    { key: 'feb', label: 'February' },
    { key: 'mar', label: 'March' }
  ];

  const columns = [
    { field: 'state', header: 'State', minWidth: 150 },
    { field: 'personType', header: 'Person Type', minWidth: 120, render: (value) => value?.replace('_', ' ').toUpperCase() },
    { 
      field: 'minimumLimit', 
      header: 'Min Limit', 
      minWidth: 120,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN')}`
    },
    { 
      field: 'maximumLimit', 
      header: 'Max Limit', 
      minWidth: 120,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN')}`
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
        <Typography variant="h6">Professional Tax Slabs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add PT Slab
        </Button>
      </Box>

      {slabsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading professional tax slabs: {slabsError?.response?.data?.message || slabsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !slabsError && slabs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No professional tax slabs found. Add your first slab to get started.
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Professional Tax Slab' : 'Add New Professional Tax Slab'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="state"
                  control={control}
                  rules={{ required: 'State is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.state}>
                      <InputLabel>State</InputLabel>
                      <Select {...field} label="State">
                        {states.map((state) => (
                          <MenuItem key={state.id} value={state.description}>
                            {state.description}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="personType"
                  control={control}
                  rules={{ required: 'Person type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.personType}>
                      <InputLabel>Person Type</InputLabel>
                      <Select {...field} label="Person Type">
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="senior_citizen">Senior Citizen</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="seniorCitizenAge"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Senior Citizen Age"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="minimumLimit"
                  control={control}
                  rules={{ required: 'Minimum limit is required', min: { value: 0, message: 'Must be 0 or greater' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Minimum Limit (₹)"
                      type="number"
                      fullWidth
                      error={!!errors.minimumLimit}
                      helperText={errors.minimumLimit?.message}
                    />
                  )}
                />
                <Controller
                  name="maximumLimit"
                  control={control}
                  rules={{ required: 'Maximum limit is required', min: { value: 0, message: 'Must be 0 or greater' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Maximum Limit (₹)"
                      type="number"
                      fullWidth
                      error={!!errors.maximumLimit}
                      helperText={errors.maximumLimit?.message}
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
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Monthly Amounts (Apr - Mar)</Typography>
              <Grid container spacing={2}>
                {months.map((month) => (
                  <Grid item xs={6} sm={4} md={3} key={month.key}>
                    <Controller
                      name={`monthlyAmounts.${month.key}`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={month.label}
                          type="number"
                          fullWidth
                          size="small"
                          value={field.value || 0}
                        />
                      )}
                    />
                  </Grid>
                ))}
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


