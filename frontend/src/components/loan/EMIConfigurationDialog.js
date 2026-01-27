import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Box
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { loanService } from '../../services/loanService';

export default function EMIConfigurationDialog({ open, loan, onClose }) {
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      autoDeduct: loan?.autoDeduct || true,
      emiConfiguration: loan?.emiConfiguration || {}
    }
  });

  React.useEffect(() => {
    if (loan) {
      reset({
        autoDeduct: loan.autoDeduct || true,
        emiConfiguration: loan.emiConfiguration || {}
      });
    }
  }, [loan, reset]);

  const updateMutation = useMutation(
    (data) => loanService.configureEMI(loan?.id, data),
    {
      onSuccess: () => {
        toast.success('EMI configuration updated successfully');
        queryClient.invalidateQueries('loans');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update EMI configuration');
      }
    }
  );

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Configure EMI Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Loan: ₹{parseFloat(loan.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | 
              EMI: ₹{parseFloat(loan.emiAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | 
              Outstanding: ₹{parseFloat(loan.outstandingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="autoDeduct"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Auto Deduct EMI from Salary"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                When enabled, EMI will be automatically deducted from the employee's salary during payroll processing.
                The deduction will occur on the next deduction date: {loan.nextDeductionDate ? new Date(loan.nextDeductionDate).toLocaleDateString() : 'Not set'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={updateMutation.isLoading}>
            Save Configuration
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}



