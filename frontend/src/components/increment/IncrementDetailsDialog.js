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
import HistoryIcon from '@mui/icons-material/History';
import { incrementService } from '../../services/incrementService';

export default function IncrementDetailsDialog({ open, increment, onClose }) {
  const { data: incrementData, isLoading } = useQuery(
    ['increment', increment?.id],
    () => incrementService.getById(increment?.id),
    { enabled: open && !!increment?.id }
  );

  const { data: auditData } = useQuery(
    ['incrementAudit', increment?.id],
    () => incrementService.getAudit(increment?.id),
    { enabled: open && !!increment?.id }
  );

  const incrementDetails = incrementData?.data || increment;
  const workflows = incrementDetails?.workflows || [];
  const auditTrail = auditData?.data?.auditTrail || [];

  if (!incrementDetails) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Increment Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Employee</Typography>
            <Typography variant="body1">
              {incrementDetails.employee?.firstName} {incrementDetails.employee?.lastName} ({incrementDetails.employee?.employeeCode})
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Increment Type</Typography>
            <Chip label={incrementDetails.incrementType?.replace('_', ' ').toUpperCase()} size="small" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Previous Salary</Typography>
            <Typography variant="body1">₹{parseFloat(incrementDetails.previousSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">New Salary</Typography>
            <Typography variant="body1" color="success.main">₹{parseFloat(incrementDetails.newSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Increment</Typography>
            <Typography variant="body1">
              ₹{parseFloat(incrementDetails.incrementAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({incrementDetails.incrementPercentage?.toFixed(2)}%)
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Effective Date</Typography>
            <Typography variant="body1">{new Date(incrementDetails.effectiveDate).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={incrementDetails.status?.toUpperCase()}
              size="small"
              color={
                incrementDetails.status === 'approved' ? 'success' :
                incrementDetails.status === 'pending' ? 'warning' :
                incrementDetails.status === 'rejected' ? 'error' : 'default'
              }
            />
            {incrementDetails.isApplied && <Chip label="APPLIED" size="small" color="success" sx={{ ml: 1 }} />}
          </Grid>
          {incrementDetails.reason && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Reason</Typography>
              <Typography variant="body1">{incrementDetails.reason}</Typography>
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

        {auditTrail.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Audit Trail</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {auditTrail.map((audit, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < auditTrail.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                  <Typography variant="body2">
                    <strong>Level {audit.level}:</strong> {audit.approver?.firstName} {audit.approver?.lastName}
                  </Typography>
                  <Chip label={audit.status} size="small" sx={{ mt: 0.5 }} />
                  {audit.remarks && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {audit.remarks}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {new Date(audit.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}



