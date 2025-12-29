import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { companyService } from '../../services/companyService';

export default function CompanyInfo({ company }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: company || {
      name: '',
      code: '',
      email: '',
      phone: '',
      website: '',
      contactPerson: '',
      contactPersonPhone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      pan: '',
      gstin: ''
    }
  });

  const updateMutation = useMutation(
    (data) => companyService.update(company.id, data),
    {
      onSuccess: () => {
        toast.success('Company information updated successfully');
        queryClient.invalidateQueries('myCompany');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update company information');
      }
    }
  );

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (!company) {
    return <Typography>Company not found</Typography>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Company name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Company Name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Company Code"
                  disabled
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              rules={{ required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Phone"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Website"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="contactPerson"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Contact Person"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="contactPersonPhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Contact Person Phone"
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="City"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="State"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Country"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="pincode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Pincode"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="pan"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="PAN"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="gstin"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="GSTIN"
                />
              )}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isLoading}
          >
            Update Company Information
          </Button>
        </Box>
      </form>
    </Paper>
  );
}



