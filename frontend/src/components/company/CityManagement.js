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
import { cityService } from '../../services/cityService';
import { countryService } from '../../services/countryService';
import { stateService } from '../../services/stateService';
import DataTable from '../DataTable';

export default function CityManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState('');

  const { data: citiesData, isLoading, error: citiesError } = useQuery('cities', () => cityService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const { data: countriesData } = useQuery('countries', () => countryService.getAll());
  const { data: statesData } = useQuery(
    ['states', selectedCountryId],
    () => stateService.getAll(selectedCountryId),
    { enabled: !!selectedCountryId }
  );

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      countryId: '',
      stateId: '',
      population: '',
      metroNonMetro: ''
    }
  });

  const watchedCountryId = watch('countryId');

  // Update states when country changes
  React.useEffect(() => {
    if (watchedCountryId) {
      setSelectedCountryId(watchedCountryId);
      reset({ ...watch(), stateId: '' }); // Reset state when country changes
    }
  }, [watchedCountryId, reset, watch]);

  const createMutation = useMutation(
    (data) => cityService.create(data),
    {
      onSuccess: () => {
        toast.success('City created successfully');
        queryClient.invalidateQueries('cities');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create city');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => cityService.update(id, data),
    {
      onSuccess: () => {
        toast.success('City updated successfully');
        queryClient.invalidateQueries('cities');
        setDialogOpen(false);
        reset();
        setSelectedCity(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update city');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => cityService.delete(id),
    {
      onSuccess: () => {
        toast.success('City deleted successfully');
        queryClient.invalidateQueries('cities');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete city');
      }
    }
  );

  const handleOpenDialog = (city = null) => {
    if (city) {
      setSelectedCity(city);
      setIsEdit(true);
      const countryId = city.countryId || city.countryRef?.id || '';
      setSelectedCountryId(countryId);
      reset({
        ...city,
        countryId,
        stateId: city.stateId || city.stateRef?.id || ''
      });
    } else {
      setSelectedCity(null);
      setIsEdit(false);
      setSelectedCountryId('');
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedCity(null);
    setIsEdit(false);
    setSelectedCountryId('');
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedCity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (city) => {
    if (window.confirm(`Are you sure you want to delete city "${city.name}"?`)) {
      deleteMutation.mutate(city.id);
    }
  };

  const cities = citiesData?.data || [];
  const countries = countriesData?.data || [];
  const states = statesData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { field: 'description', header: 'Description', minWidth: 200 },
    { 
      field: 'country', 
      header: 'Country', 
      minWidth: 120,
      render: (value, row) => row.countryRef?.name || '-'
    },
    { 
      field: 'state', 
      header: 'State', 
      minWidth: 120,
      render: (value, row) => row.stateRef?.name || '-'
    },
    { 
      field: 'population', 
      header: 'Population', 
      minWidth: 120,
      render: (value) => value ? value.replace('_', ' ').toUpperCase() : '-'
    },
    { 
      field: 'metroNonMetro', 
      header: 'Metro/Non-Metro', 
      minWidth: 120,
      render: (value) => value ? value.replace('_', ' ').toUpperCase() : '-'
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
        <Typography variant="h6">Cities</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add City
        </Button>
      </Box>

      {citiesError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading cities: {citiesError?.response?.data?.message || citiesError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !citiesError && cities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No cities found. Add your first city to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !citiesError && cities.length > 0 && (
        <DataTable
          columns={columns}
          data={cities}
          loading={isLoading}
          searchable
          searchPlaceholder="Search cities..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit City' : 'Add New City'}</DialogTitle>
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
              <Controller
                name="stateId"
                control={control}
                rules={{ required: 'State is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.stateId} disabled={!watchedCountryId}>
                    <InputLabel>State</InputLabel>
                    <Select {...field} label="State" disabled={!watchedCountryId}>
                      {states.map((state) => (
                        <MenuItem key={state.id} value={state.id}>
                          {state.name}
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
                      label="City Code"
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
                      label="City Name"
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="population"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Population</InputLabel>
                      <Select {...field} label="Population">
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="above_25_lacs">Above 25 Lacs</MenuItem>
                        <MenuItem value="below_25_lacs">Below 25 Lacs</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="metroNonMetro"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Metro/Non-Metro</InputLabel>
                      <Select {...field} label="Metro/Non-Metro">
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="metro">Metro</MenuItem>
                        <MenuItem value="non_metro">Non-Metro</MenuItem>
                      </Select>
                    </FormControl>
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


