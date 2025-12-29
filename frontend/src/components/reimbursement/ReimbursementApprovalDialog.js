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
import { reimbursementService } from '../../services/reimbursementService';

export default function ReimbursementApprovalDialog({ open, reimbursement, action: initialAction, onClose }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState(initialAction || null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (initialAction) {
      setAction(initialAction);
    }
  }, [initialAction]);

  const approveMutation = useMutation(
    (data) => reimbursementService.approve(reimbursement?.id, data.remarks),
    {
      onSuccess: () => {
        toast.success('Reimbursement approved successfully');
        queryClient.invalidateQueries('reimbursements');
        onClose();
        setRemarks('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve reimbursement');
      }
    }
  );

  const rejectMutation = useMutation(
    (data) => reimbursementService.reject(reimbursement?.id, data.rejectionReason),
    {
      onSuccess: () => {
        toast.success('Reimbursement rejected successfully');
        queryClient.invalidateQueries('reimbursements');
        onClose();
        setRemarks('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject reimbursement');
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

  if (!reimbursement) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Reimbursement Approval</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Reimbursement Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Employee</Typography>
              <Typography variant="body1">
                {reimbursement.employee?.firstName} {reimbursement.employee?.lastName} ({reimbursement.employee?.employeeCode})
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Category</Typography>
              <Typography variant="body1">{reimbursement.category?.name || reimbursement.category || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Amount</Typography>
              <Typography variant="body1">₹{parseFloat(reimbursement.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip
                label={reimbursement.status?.toUpperCase()}
                size="small"
                color={reimbursement.status === 'pending' ? 'warning' : 'default'}
              />
            </Grid>
            {reimbursement.description && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{reimbursement.description}</Typography>
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
            Select an action to approve or reject this reimbursement
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



