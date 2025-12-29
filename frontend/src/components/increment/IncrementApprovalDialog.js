import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { incrementService } from '../../services/incrementService';

export default function IncrementApprovalDialog({ open, increment, action: initialAction, onClose }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState(initialAction || null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (initialAction) {
      setAction(initialAction);
    }
  }, [initialAction]);

  const approveMutation = useMutation(
    (data) => incrementService.approve(increment?.id, data.remarks),
    {
      onSuccess: () => {
        toast.success('Increment approved successfully');
        queryClient.invalidateQueries('increments');
        onClose();
        setRemarks('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve increment');
      }
    }
  );

  const rejectMutation = useMutation(
    (data) => incrementService.reject(increment?.id, data.rejectionReason),
    {
      onSuccess: () => {
        toast.success('Increment rejected successfully');
        queryClient.invalidateQueries('increments');
        onClose();
        setRemarks('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject increment');
      }
    }
  );

  const handleApprove = () => {
    approveMutation.mutate({ remarks });
  };

  const handleReject = () => {
    if (!remarks.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ rejectionReason: remarks });
  };

  if (!increment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Increment Approval</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Increment Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Employee</Typography>
              <Typography variant="body1">
                {increment.employee?.firstName} {increment.employee?.lastName} ({increment.employee?.employeeCode})
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Increment Type</Typography>
              <Chip label={increment.incrementType?.replace('_', ' ').toUpperCase()} size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Previous Salary</Typography>
              <Typography variant="body1">₹{parseFloat(increment.previousSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">New Salary</Typography>
              <Typography variant="body1" color="success.main">₹{parseFloat(increment.newSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Increment</Typography>
              <Typography variant="body1">
                ₹{parseFloat(increment.incrementAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({increment.incrementPercentage?.toFixed(2)}%)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Effective Date</Typography>
              <Typography variant="body1">{new Date(increment.effectiveDate).toLocaleDateString()}</Typography>
            </Grid>
            {increment.reason && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Reason</Typography>
                <Typography variant="body1">{increment.reason}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <TextField
          label={action === 'reject' ? 'Rejection Reason' : 'Remarks (Optional)'}
          multiline
          rows={3}
          fullWidth
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          required={action === 'reject'}
        />

        {action === null && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Select an action to approve or reject this increment
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {action === null ? (
          <>
            <Button variant="outlined" color="error" onClick={() => setAction('reject')}>
              Reject
            </Button>
            <Button variant="contained" color="success" onClick={() => setAction('approve')}>
              Approve
            </Button>
          </>
        ) : action === 'approve' ? (
          <Button variant="contained" color="success" onClick={handleApprove} disabled={approveMutation.isLoading}>
            Confirm Approval
          </Button>
        ) : (
          <Button variant="contained" color="error" onClick={handleReject} disabled={rejectMutation.isLoading || !remarks.trim()}>
            Confirm Rejection
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}



