import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, TextField, Button, Grid, Typography, MenuItem } from '@mui/material';

export default function ExtraFieldsStep({ data, dynamicFields = [], onNext, onBack }) {
  const { control, handleSubmit } = useForm({
    defaultValues: data?.extraFields || {}
  });

  const onSubmit = (formData) => {
    onNext({ extraFields: formData });
  };

  const renderField = (field) => {
    switch (field.fieldType) {
      case 'date':
        return (
          <Controller
            key={field.id}
            name={field.fieldCode}
            control={control}
            rules={field.isRequired ? { required: `${field.fieldLabel} is required` } : {}}
            render={({ field: formField, fieldState: { error } }) => (
              <TextField
                {...formField}
                label={field.fieldLabel}
                type="date"
                fullWidth
                required={field.isRequired}
                InputLabelProps={{ shrink: true }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        );
      case 'select':
        return (
          <Controller
            key={field.id}
            name={field.fieldCode}
            control={control}
            rules={field.isRequired ? { required: `${field.fieldLabel} is required` } : {}}
            render={({ field: formField, fieldState: { error } }) => (
              <TextField
                {...formField}
                select
                label={field.fieldLabel}
                fullWidth
                required={field.isRequired}
                error={!!error}
                helperText={error?.message}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        );
      case 'textarea':
        return (
          <Controller
            key={field.id}
            name={field.fieldCode}
            control={control}
            rules={field.isRequired ? { required: `${field.fieldLabel} is required` } : {}}
            render={({ field: formField, fieldState: { error } }) => (
              <TextField
                {...formField}
                label={field.fieldLabel}
                multiline
                rows={3}
                fullWidth
                required={field.isRequired}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        );
      default:
        return (
          <Controller
            key={field.id}
            name={field.fieldCode}
            control={control}
            rules={field.isRequired ? { required: `${field.fieldLabel} is required` } : {}}
            render={({ field: formField, fieldState: { error } }) => (
              <TextField
                {...formField}
                label={field.fieldLabel}
                type={field.fieldType === 'number' ? 'number' : field.fieldType === 'email' ? 'email' : 'text'}
                fullWidth
                required={field.isRequired}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        );
    }
  };

  if (!dynamicFields || dynamicFields.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Extra Fields</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No additional fields required.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={onBack}>Back</Button>
          <Button variant="contained" onClick={() => onNext({ extraFields: {} })}>Next</Button>
        </Box>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>Extra Fields</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {dynamicFields.map((field) => (
          <Grid item xs={12} md={6} key={field.id}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>Back</Button>
        <Button type="submit" variant="contained">Next</Button>
      </Box>
    </form>
  );
}



