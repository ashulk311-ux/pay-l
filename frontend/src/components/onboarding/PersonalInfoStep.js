import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography
} from '@mui/material';

export default function PersonalInfoStep({ data, onNext }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: data?.firstName || '',
      lastName: data?.lastName || '',
      email: data?.email || '',
      phone: data?.phone || '',
      dateOfBirth: data?.dateOfBirth || '',
      address: data?.address || ''
    }
  });

  const onSubmit = (formData) => {
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="firstName"
            control={control}
            rules={{ required: 'First name is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="First Name"
                fullWidth
                required
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="lastName"
            control={control}
            rules={{ required: 'Last name is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Last Name"
                fullWidth
                required
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                required
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
            rules={{ required: 'Phone number is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone Number"
                fullWidth
                required
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Date of Birth"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
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
                label="Address"
                multiline
                rows={3}
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button type="submit" variant="contained" size="large">
          Next
        </Button>
      </Box>
    </form>
  );
}



