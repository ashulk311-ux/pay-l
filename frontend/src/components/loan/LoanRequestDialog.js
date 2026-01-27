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
  FormControlLabel,
  Switch
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { loanService } from '../../services/loanService';
import { employeeService } from '../../services/employeeService';
import { useQuery } from 'react-query';

export default function LoanRequestDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { enabled: open });

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      employeeId: '',
      loanType: 'loan',
      amount: '',
      interestRate: 0,
      tenure: '',
      startDate: '',
      requestReason: '',
      autoDeduct: true
    }
  });

  const amount = watch('amount');
  const interestRate = watch('interestRate');
  const tenure = watch('tenure');

  // Calculate EMI
  const calculateEMI = () => {
    if (!amount || !tenure) return 0;
    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate || 0) / 100 / 12;
    const months = parseInt(tenure);

    if (rate > 0) {
      const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
      return Math.round(emi * 100) / 100;
    } else {
      return Math.round((principal / months) * 100) / 100;
    }
  };

  const createMutation = useMutation(
    (data) => loanService.requestLoan(data),
    {
      onSuccess: () => {
        toast.success('Loan request submitted successfully');
        queryClient.invalidateQueries('loans');
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit loan request');
      }
    }
  );

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const employees = employeesData?.data || [];
  const emiAmount = calculateEMI();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Request Loan / Advance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="employeeId"
                control={control}
                rules={{ required: 'Employee is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Employee" fullWidth required>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="loanType"
                control={control}
                rules={{ required: 'Loan type is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Type" fullWidth required>
                    <MenuItem value="loan">Loan</MenuItem>
                    <MenuItem value="advance">Advance</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="amount"
                control={control}
                rules={{ required: 'Amount is required', min: { value: 1, message: 'Amount must be greater than 0' } }}
                render={({ field }) => (
                  <TextField {...field} label="Loan Amount" type="number" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="interestRate"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Interest Rate (%)" type="number" step="0.01" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="tenure"
                control={control}
                rules={{ required: 'Tenure is required', min: { value: 1, message: 'Tenure must be at least 1 month' } }}
                render={({ field }) => (
                  <TextField {...field} label="Tenure (Months)" type="number" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="EMI Amount"
                value={emiAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                fullWidth
                disabled
                helperText="Calculated automatically"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="startDate"
                control={control}
                rules={{ required: 'Start date is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Start Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="autoDeduct"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Auto Deduct from Salary" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="requestReason"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Reason for Loan" multiline rows={3} fullWidth />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
            Submit Request
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}



