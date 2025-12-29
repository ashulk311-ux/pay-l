import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { incrementService } from '../../services/incrementService';
import { designationService } from '../../services/designationService';

export default function BulkIncrementDialog({ open, onClose }) {
  const queryClient = useQueryClient();

  const { data: designationsData } = useQuery('designations', () => designationService.getAll(), { enabled: open });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      type: 'grade',
      grade: '',
      designationId: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      incrementType: 'percentage',
      incrementPercentage: '',
      incrementAmount: '',
      reason: ''
    }
  });

  const type = useWatch({ control, name: 'type' });
  const incrementType = useWatch({ control, name: 'incrementType' });

  const createMutation = useMutation(
    (data) => {
      const payload = {
        ...(type === 'grade' ? { grade: data.grade } : { designationId: data.designationId }),
        effectiveDate: data.effectiveDate,
        ...(incrementType === 'percentage' 
          ? { incrementPercentage: data.incrementPercentage }
          : { incrementAmount: data.incrementAmount }),
        reason: data.reason
      };
      return incrementService.bulkCreateByGrade(payload);
    },
    {
      onSuccess: (response) => {
        toast.success(`Successfully created ${response.data?.created?.length || 0} increments`);
        queryClient.invalidateQueries('increments');
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create bulk increments');
      }
    }
  );

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const designations = designationsData?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Bulk Increment by Grade/Designation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Apply To</FormLabel>
                    <RadioGroup {...field} row>
                      <FormControlLabel value="grade" control={<Radio />} label="Grade" />
                      <FormControlLabel value="designation" control={<Radio />} label="Designation" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>
            {type === 'grade' ? (
              <Grid item xs={12}>
                <Controller
                  name="grade"
                  control={control}
                  rules={{ required: 'Grade is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Grade" fullWidth required />
                  )}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Controller
                  name="designationId"
                  control={control}
                  rules={{ required: 'Designation is required' }}
                  render={({ field }) => (
                    <TextField {...field} select label="Designation" fullWidth required>
                      {designations.map((des) => (
                        <MenuItem key={des.id} value={des.id}>
                          {des.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Controller
                name="effectiveDate"
                control={control}
                rules={{ required: 'Effective date is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Effective Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="incrementType"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Increment Type</FormLabel>
                    <RadioGroup {...field} row>
                      <FormControlLabel value="percentage" control={<Radio />} label="Percentage" />
                      <FormControlLabel value="amount" control={<Radio />} label="Fixed Amount" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>
            {incrementType === 'percentage' ? (
              <Grid item xs={12}>
                <Controller
                  name="incrementPercentage"
                  control={control}
                  rules={{ required: 'Increment percentage is required', min: { value: 0, message: 'Percentage must be positive' } }}
                  render={({ field }) => (
                    <TextField {...field} label="Increment Percentage (%)" type="number" step="0.01" fullWidth required />
                  )}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Controller
                  name="incrementAmount"
                  control={control}
                  rules={{ required: 'Increment amount is required', min: { value: 0, message: 'Amount must be positive' } }}
                  render={({ field }) => (
                    <TextField {...field} label="Increment Amount (₹)" type="number" step="0.01" fullWidth required />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Reason" multiline rows={2} fullWidth />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
            Create Bulk Increments
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

