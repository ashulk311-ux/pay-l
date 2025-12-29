import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { useQuery } from 'react-query';
import { reimbursementService } from '../../services/reimbursementService';

export default function ReimbursementDetailsDialog({ open, reimbursement, onClose }) {
  const { data: reimbursementData, isLoading } = useQuery(
    ['reimbursement', reimbursement?.id],
    () => reimbursementService.getById(reimbursement?.id),
    { enabled: open && !!reimbursement?.id }
  );

  const reimbursementDetails = reimbursementData?.data || reimbursement;

  if (!reimbursementDetails) return null;

  const workflows = reimbursementDetails.workflows || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Reimbursement Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Employee</Typography>
            <Typography variant="body1">
              {reimbursementDetails.employee?.firstName} {reimbursementDetails.employee?.lastName} ({reimbursementDetails.employee?.employeeCode})
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Category</Typography>
            <Typography variant="body1">{reimbursementDetails.category?.name || reimbursementDetails.category || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Amount</Typography>
            <Typography variant="body1">₹{parseFloat(reimbursementDetails.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Date</Typography>
            <Typography variant="body1">{new Date(reimbursementDetails.date).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={reimbursementDetails.status?.toUpperCase()}
              size="small"
              color={
                reimbursementDetails.status === 'approved' ? 'success' :
                reimbursementDetails.status === 'pending' ? 'warning' :
                reimbursementDetails.status === 'rejected' ? 'error' : 'default'
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Taxable</Typography>
            <Chip label={reimbursementDetails.isTaxable ? 'Yes' : 'No'} size="small" color={reimbursementDetails.isTaxable ? 'warning' : 'default'} />
          </Grid>
          {reimbursementDetails.description && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Description</Typography>
              <Typography variant="body1">{reimbursementDetails.description}</Typography>
            </Grid>
          )}
        </Grid>

        {workflows.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Approval Workflow</Typography>
            <Stepper orientation="vertical">
              {workflows.map((workflow, index) => (
                <Step key={workflow.id} active={workflow.isCurrentLevel || workflow.status !== 'pending'} completed={workflow.status === 'approved'}>
                  <StepLabel>
                    <Typography variant="body2">
                      Level {workflow.level} - {workflow.approver?.firstName} {workflow.approver?.lastName}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Chip
                      label={workflow.status?.toUpperCase()}
                      size="small"
                      color={
                        workflow.status === 'approved' ? 'success' :
                        workflow.status === 'rejected' ? 'error' :
                        workflow.status === 'pending' ? 'warning' : 'default'
                      }
                    />
                    {workflow.remarks && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Remarks: {workflow.remarks}
                      </Typography>
                    )}
                    {workflow.approvedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {new Date(workflow.approvedAt).toLocaleString()}
                      </Typography>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {reimbursementDetails.documents && reimbursementDetails.documents.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Documents</Typography>
            <Grid container spacing={2}>
              {reimbursementDetails.documents.map((doc, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2">{doc.split('/').pop()}</Typography>
                    <Button size="small" href={doc} target="_blank" sx={{ mt: 1 }}>
                      View
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}



