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
import { loanService } from '../../services/loanService';

export default function LoanApprovalDialog({ open, loan, action: initialAction, onClose }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState(initialAction || null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (initialAction) {
      setAction(initialAction);
    }
  }, [initialAction]);

  const approveMutation = useMutation(
    () => loanService.approveLoan(loan?.id),
    {
      onSuccess: () => {
        toast.success('Loan approved successfully');
        queryClient.invalidateQueries('loans');
        onClose();
        setAction(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve loan');
      }
    }
  );

  const rejectMutation = useMutation(
    () => loanService.rejectLoan(loan?.id, rejectionReason),
    {
      onSuccess: () => {
        toast.success('Loan rejected successfully');
        queryClient.invalidateQueries('loans');
        onClose();
        setAction(null);
        setRejectionReason('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject loan');
      }
    }
  );

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate();
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Loan Approval</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Loan Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Employee</Typography>
              <Typography variant="body1">
                {loan.employee?.firstName} {loan.employee?.lastName} ({loan.employee?.employeeCode})
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Loan Type</Typography>
              <Chip label={loan.loanType?.toUpperCase()} size="small" color={loan.loanType === 'loan' ? 'primary' : 'secondary'} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Amount</Typography>
              <Typography variant="body1">₹{parseFloat(loan.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">EMI Amount</Typography>
              <Typography variant="body1">₹{parseFloat(loan.emiAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Tenure</Typography>
              <Typography variant="body1">{loan.tenure} months</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
              <Typography variant="body1">{loan.interestRate || 0}%</Typography>
            </Grid>
            {loan.requestReason && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Reason</Typography>
                <Typography variant="body1">{loan.requestReason}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {action === 'reject' && (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Rejection Reason"
              multiline
              rows={3}
              fullWidth
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </Box>
        )}

        {action === null && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Select an action to approve or reject this loan request
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
          <Button variant="contained" color="error" onClick={handleReject} disabled={rejectMutation.isLoading || !rejectionReason.trim()}>
            Confirm Rejection
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

