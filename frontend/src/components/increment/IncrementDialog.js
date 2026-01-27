import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { incrementService } from '../../services/incrementService';
import { employeeService } from '../../services/employeeService';
import { salaryService } from '../../services/salaryService';

export default function IncrementDialog({ open, increment, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!increment;

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      employeeId: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      newSalary: '',
      reason: '',
      previousDesignationId: '',
      newDesignationId: '',
      previousGrade: '',
      newGrade: ''
    }
  });

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { enabled: open });
  const selectedEmployeeId = useWatch({ control, name: 'employeeId' });
  
  const { data: salaryData } = useQuery(
    ['salaryStructure', selectedEmployeeId],
    () => salaryService.getSalaryStructure(selectedEmployeeId),
    { enabled: open && !!selectedEmployeeId }
  );

  const newSalary = watch('newSalary');
  const currentSalary = salaryData?.data?.grossSalary || increment?.previousSalary || 0;
  const incrementAmount = newSalary ? parseFloat(newSalary) - parseFloat(currentSalary) : 0;
  const incrementPercentage = currentSalary > 0 ? (incrementAmount / parseFloat(currentSalary)) * 100 : 0;

  useEffect(() => {
    if (increment && open) {
      reset({
        employeeId: increment.employeeId,
        effectiveDate: increment.effectiveDate,
        newSalary: increment.newSalary,
        reason: increment.reason || '',
        previousDesignationId: increment.previousDesignationId || '',
        newDesignationId: increment.newDesignationId || '',
        previousGrade: increment.previousGrade || '',
        newGrade: increment.newGrade || ''
      });
    } else if (!increment && open) {
      reset();
    }
  }, [increment, reset, open]);

  const createMutation = useMutation(
    (data) => incrementService.create(data),
    {
      onSuccess: () => {
        toast.success('Salary increment created successfully');
        queryClient.invalidateQueries('increments');
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create increment');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => incrementService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Increment updated successfully');
        queryClient.invalidateQueries('increments');
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update increment');
      }
    }
  );

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: increment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const employees = employeesData?.data || [];
  const currentEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Salary Increment' : 'Create Salary Increment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="employeeId"
                control={control}
                rules={{ required: 'Employee is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Employee" fullWidth required disabled={isEdit}>
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
              <TextField
                label="Current Salary"
                value={currentSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                fullWidth
                disabled
                helperText="Current gross salary"
              />
            </Grid>
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
            <Grid item xs={12} md={6}>
              <Controller
                name="newSalary"
                control={control}
                rules={{ required: 'New salary is required', min: { value: currentSalary, message: 'New salary must be greater than current salary' } }}
                render={({ field }) => (
                  <TextField {...field} label="New Salary" type="number" step="0.01" fullWidth required />
                )}
              />
            </Grid>
            {incrementAmount > 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Increment Amount"
                    value={`₹${incrementAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Increment Percentage"
                    value={`${incrementPercentage.toFixed(2)}%`}
                    fullWidth
                    disabled
                  />
                </Grid>
              </>
            )}
            {currentEmployee && (
              <>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="previousGrade"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Previous Grade" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="newGrade"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="New Grade" fullWidth />
                    )}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Reason" multiline rows={3} fullWidth />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

