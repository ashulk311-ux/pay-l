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
import { countryService } from '../../services/countryService';
import DataTable from '../DataTable';

export default function CountryManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: countriesData, isLoading, error: countriesError } = useQuery('countries', () => countryService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      nationality: '',
      isdCode: ''
    }
  });

  const createMutation = useMutation(
    (data) => countryService.create(data),
    {
      onSuccess: () => {
        toast.success('Country created successfully');
        queryClient.invalidateQueries('countries');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create country');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => countryService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Country updated successfully');
        queryClient.invalidateQueries('countries');
        setDialogOpen(false);
        reset();
        setSelectedCountry(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update country');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => countryService.delete(id),
    {
      onSuccess: () => {
        toast.success('Country deleted successfully');
        queryClient.invalidateQueries('countries');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete country');
      }
    }
  );

  const handleOpenDialog = (country = null) => {
    if (country) {
      setSelectedCountry(country);
      setIsEdit(true);
      reset(country);
    } else {
      setSelectedCountry(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedCountry(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedCountry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (country) => {
    if (window.confirm(`Are you sure you want to delete country "${country.name}"?`)) {
      deleteMutation.mutate(country.id);
    }
  };

  const countries = countriesData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { field: 'nationality', header: 'Nationality', minWidth: 150 },
    { field: 'isdCode', header: 'ISD Code', minWidth: 100 },
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
        <Typography variant="h6">Countries</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Country
        </Button>
      </Box>

      {countriesError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading countries: {countriesError?.response?.data?.message || countriesError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !countriesError && countries.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No countries found. Add your first country to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !countriesError && countries.length > 0 && (
        <DataTable
          columns={columns}
          data={countries}
          loading={isLoading}
          searchable
          searchPlaceholder="Search countries..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Country' : 'Add New Country'}</DialogTitle>
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
                      label="Country Code"
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
                      label="Country Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="nationality"
                  control={control}
                  rules={{ required: 'Nationality is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nationality"
                      fullWidth
                      error={!!errors.nationality}
                      helperText={errors.nationality?.message}
                    />
                  )}
                />
                <Controller
                  name="isdCode"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="ISD Code" fullWidth />
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


