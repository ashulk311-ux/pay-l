import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { portalService } from '../../services/portalService';

export default function EmployeeProfile() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { data: employeeData, isLoading } = useQuery(
    'employeeProfile',
    () => portalService.getProfile(),
    { refetchOnWindowFocus: false }
  );

  const updateProfileMutation = useMutation(
    (data) => portalService.updateProfile(data),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries('employeeProfile');
        queryClient.invalidateQueries('employeeDashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }

  const employee = employeeData?.data || {};

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                src={employee.photo}
              >
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </Avatar>
              <Typography variant="h5">
                {employee.firstName} {employee.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.employeeCode} | {employee.designation}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={employee.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                {...register('phone')}
                defaultValue={employee.phone || ''}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Address"
                multiline
                rows={3}
                {...register('address')}
                defaultValue={employee.currentAddress1 || ''}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Employment Information</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee Code"
                value={employee.employeeCode || ''}
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                value={employee.designation || ''}
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={employee.department || ''}
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Joining"
                value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : ''}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateProfileMutation.isLoading}
                >
                  Update Profile
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
