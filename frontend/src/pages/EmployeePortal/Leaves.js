import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import { portalService } from '../../services/portalService';
import DataTable from '../../components/DataTable';

export default function EmployeeLeaves() {
  const queryClient = useQueryClient();
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm();

  const { data: leaveBalance } = useQuery('leaveBalance', () => portalService.getLeaveBalance(), {
    refetchOnWindowFocus: false
  });

  const { data: leaveHistory, isLoading } = useQuery('leaveHistory', () => portalService.getLeaveHistory(), {
    refetchOnWindowFocus: false
  });

  const applyLeaveMutation = useMutation(
    (data) => portalService.applyLeave(data),
    {
      onSuccess: () => {
        toast.success('Leave application submitted successfully');
        queryClient.invalidateQueries('leaveHistory');
        queryClient.invalidateQueries('leaveBalance');
        queryClient.invalidateQueries('employeeDashboard');
        setApplyDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit leave application');
      }
    }
  );

  const onSubmit = (data) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    applyLeaveMutation.mutate({
      ...data,
      days
    });
  };

  const columns = [
    { field: 'leaveType', header: 'Leave Type' },
    { field: 'startDate', header: 'Start Date', format: 'date' },
    { field: 'endDate', header: 'End Date', format: 'date' },
    { field: 'days', header: 'Days' },
    { field: 'reason', header: 'Reason' },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        pending: 'warning',
        approved: 'success',
        rejected: 'error',
        cancelled: 'default'
      }
    },
    { field: 'remarks', header: 'Remarks' }
  ];

  const leaves = leaveHistory?.data || [];
  const balance = leaveBalance?.data || {};

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Leaves</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setApplyDialogOpen(true)}
        >
          Apply for Leave
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.entries(balance).map(([type, bal]) => (
          <Grid item xs={12} sm={6} md={4} key={type}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{type}</Typography>
                <Typography variant="body2" color="text.secondary">Allocated: {bal.allocated || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Used: {bal.used || 0}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Balance: ${bal.balance || 0}`}
                    color={bal.balance > 0 ? 'success' : 'error'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <DataTable
        columns={columns}
        data={leaves}
        loading={isLoading}
        searchable
      />

      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Leave Type</InputLabel>
                <Controller
                  name="leaveType"
                  control={control}
                  rules={{ required: 'Leave type is required' }}
                  render={({ field }) => (
                    <Select {...field} label="Leave Type">
                      <MenuItem value="CL">Casual Leave (CL)</MenuItem>
                      <MenuItem value="SL">Sick Leave (SL)</MenuItem>
                      <MenuItem value="PL">Privilege Leave (PL)</MenuItem>
                      <MenuItem value="EL">Earned Leave (EL)</MenuItem>
                      <MenuItem value="ML">Maternity Leave (ML)</MenuItem>
                      <MenuItem value="LWP">Leave Without Pay (LWP)</MenuItem>
                    </Select>
                  )}
                />
                {errors.leaveType && (
                  <Typography variant="caption" color="error">{errors.leaveType.message}</Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
              />
              <TextField
                fullWidth
                label="End Date"
                type="date"
                {...register('endDate', { required: 'End date is required' })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                error={!!errors.endDate}
                helperText={errors.endDate?.message}
              />
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={4}
                {...register('reason')}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={applyLeaveMutation.isLoading}>
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

