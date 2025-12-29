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
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { stateService } from '../../services/stateService';
import { countryService } from '../../services/countryService';
import DataTable from '../DataTable';

export default function StateManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: statesData, isLoading, error: statesError } = useQuery('states', () => stateService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const { data: countriesData } = useQuery('countries', () => countryService.getAll());

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      countryId: '',
      professionalTaxApply: false
    }
  });

  const createMutation = useMutation(
    (data) => stateService.create(data),
    {
      onSuccess: () => {
        toast.success('State created successfully');
        queryClient.invalidateQueries('states');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create state');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => stateService.update(id, data),
    {
      onSuccess: () => {
        toast.success('State updated successfully');
        queryClient.invalidateQueries('states');
        setDialogOpen(false);
        reset();
        setSelectedState(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update state');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => stateService.delete(id),
    {
      onSuccess: () => {
        toast.success('State deleted successfully');
        queryClient.invalidateQueries('states');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete state');
      }
    }
  );

  const handleOpenDialog = (state = null) => {
    if (state) {
      setSelectedState(state);
      setIsEdit(true);
      reset({
        ...state,
        countryId: state.countryId || state.countryRef?.id || ''
      });
    } else {
      setSelectedState(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedState(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedState.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (state) => {
    if (window.confirm(`Are you sure you want to delete state "${state.name}"?`)) {
      deleteMutation.mutate(state.id);
    }
  };

  const states = statesData?.data || [];
  const countries = countriesData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { field: 'description', header: 'Description', minWidth: 200 },
    { 
      field: 'country', 
      header: 'Country', 
      minWidth: 150,
      render: (value, row) => row.countryRef?.name || '-'
    },
    { 
      field: 'professionalTaxApply', 
      header: 'PT Apply', 
      minWidth: 100,
      render: (value) => value ? 'Yes' : 'No'
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
        <Typography variant="h6">States</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add State
        </Button>
      </Box>

      {statesError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading states: {statesError?.response?.data?.message || statesError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !statesError && states.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No states found. Add your first state to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !statesError && states.length > 0 && (
        <DataTable
          columns={columns}
          data={states}
          loading={isLoading}
          searchable
          searchPlaceholder="Search states..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit State' : 'Add New State'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="countryId"
                control={control}
                rules={{ required: 'Country is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.countryId}>
                    <InputLabel>Country</InputLabel>
                    <Select {...field} label="Country">
                      {countries.map((country) => (
                        <MenuItem key={country.id} value={country.id}>
                          {country.name}
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
                      label="State Code"
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
                      label="State Name"
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
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
              <Controller
                name="professionalTaxApply"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Professional Tax Apply"
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


