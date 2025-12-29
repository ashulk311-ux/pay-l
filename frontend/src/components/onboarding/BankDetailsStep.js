import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, TextField, Button, Grid, Typography } from '@mui/material';

export default function BankDetailsStep({ data, onNext, onBack }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      bankAccountNumber: data?.bankAccountNumber || '',
      bankIfsc: data?.bankIfsc || '',
      bankName: data?.bankName || ''
    }
  });

  const onSubmit = (formData) => {
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>Bank Details</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Controller
            name="bankName"
            control={control}
            rules={{ required: 'Bank name is required' }}
            render={({ field }) => (
              <TextField {...field} label="Bank Name" fullWidth required error={!!errors.bankName} helperText={errors.bankName?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="bankAccountNumber"
            control={control}
            rules={{ required: 'Account number is required' }}
            render={({ field }) => (
              <TextField {...field} label="Account Number" fullWidth required error={!!errors.bankAccountNumber} helperText={errors.bankAccountNumber?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="bankIfsc"
            control={control}
            rules={{ required: 'IFSC code is required' }}
            render={({ field }) => (
              <TextField {...field} label="IFSC Code" fullWidth required error={!!errors.bankIfsc} helperText={errors.bankIfsc?.message} />
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



