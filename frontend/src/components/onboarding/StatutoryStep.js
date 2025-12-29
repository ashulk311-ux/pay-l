import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, TextField, Button, Grid, Typography } from '@mui/material';

export default function StatutoryStep({ data, onNext, onBack }) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      pan: data?.pan || '',
      aadhaar: data?.aadhaar || '',
      uan: data?.uan || '',
      passport: data?.passport || ''
    }
  });

  const onSubmit = (formData) => {
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>Statutory Information</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="pan"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="PAN" fullWidth placeholder="ABCDE1234F" />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="aadhaar"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Aadhaar" fullWidth placeholder="12-digit number" />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="uan"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="UAN" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="passport"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Passport Number" fullWidth />
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



