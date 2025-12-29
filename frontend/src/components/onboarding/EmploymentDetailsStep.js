import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, TextField, Button, Grid, Typography, MenuItem } from '@mui/material';
import { useQuery } from 'react-query';
import { branchService } from '../../services/branchService';
import { departmentService } from '../../services/departmentService';
import { designationService } from '../../services/designationService';

export default function EmploymentDetailsStep({ data, onNext, onBack }) {
  const { data: branches } = useQuery('branches', () => branchService.getAll(), { enabled: false });
  const { data: departments } = useQuery('departments', () => departmentService.getAll(), { enabled: false });
  const { data: designations } = useQuery('designations', () => designationService.getAll(), { enabled: false });

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      designation: data?.designation || '',
      designationId: data?.designationId || '',
      department: data?.department || '',
      departmentId: data?.departmentId || '',
      branch: data?.branch || '',
      branchId: data?.branchId || '',
      dateOfJoining: data?.dateOfJoining || ''
    }
  });

  const onSubmit = (formData) => {
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>Employment Details</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="designation"
            control={control}
            rules={{ required: 'Designation is required' }}
            render={({ field }) => (
              <TextField {...field} label="Designation" fullWidth required error={!!errors.designation} helperText={errors.designation?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="department"
            control={control}
            rules={{ required: 'Department is required' }}
            render={({ field }) => (
              <TextField {...field} label="Department" fullWidth required error={!!errors.department} helperText={errors.department?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="branch"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Branch" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="dateOfJoining"
            control={control}
            rules={{ required: 'Date of joining is required' }}
            render={({ field }) => (
              <TextField {...field} label="Date of Joining" type="date" fullWidth required InputLabelProps={{ shrink: true }} error={!!errors.dateOfJoining} helperText={errors.dateOfJoining?.message} />
            )}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>Back</Button>
        <Button type="submit" variant="contained">Next</Button>
      </Box>
    </form>
  );
}



