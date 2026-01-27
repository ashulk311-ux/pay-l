import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useQuery } from 'react-query';
import { loanService } from '../../services/loanService';

export default function LoanDetailsDialog({ open, loan, onClose }) {
  const { data: loanData } = useQuery(
    ['loan', loan?.id],
    () => loanService.getById(loan?.id),
    { enabled: open && !!loan?.id }
  );

  const loanDetails = loanData?.data || loan;

  if (!loanDetails) return null;

  const emis = loanDetails.emis || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Loan Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Employee</Typography>
            <Typography variant="body1">
              {loanDetails.employee?.firstName} {loanDetails.employee?.lastName} ({loanDetails.employee?.employeeCode})
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Loan Type</Typography>
            <Chip label={loanDetails.loanType?.toUpperCase()} size="small" color={loanDetails.loanType === 'loan' ? 'primary' : 'secondary'} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Loan Amount</Typography>
            <Typography variant="body1">₹{parseFloat(loanDetails.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Outstanding</Typography>
            <Typography variant="body1" color="error">₹{parseFloat(loanDetails.outstandingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
            <Typography variant="body1" color="success.main">₹{parseFloat(loanDetails.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">EMI Amount</Typography>
            <Typography variant="body1">₹{parseFloat(loanDetails.emiAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Tenure</Typography>
            <Typography variant="body1">{loanDetails.tenure} months</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
            <Typography variant="body1">{loanDetails.interestRate || 0}%</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={loanDetails.status?.toUpperCase()}
              size="small"
              color={
                loanDetails.status === 'active' ? 'success' :
                loanDetails.status === 'pending' ? 'warning' :
                loanDetails.status === 'rejected' ? 'error' : 'default'
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Auto Deduct</Typography>
            <Chip label={loanDetails.autoDeduct ? 'Yes' : 'No'} size="small" />
          </Grid>
          {loanDetails.requestReason && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Reason</Typography>
              <Typography variant="body1">{loanDetails.requestReason}</Typography>
            </Grid>
          )}
        </Grid>

        <Typography variant="h6" gutterBottom>EMI Schedule</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>EMI #</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Principal</TableCell>
                <TableCell align="right">Interest</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emis.map((emi) => (
                <TableRow key={emi.id}>
                  <TableCell>{emi.emiNumber}</TableCell>
                  <TableCell>{new Date(emi.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell align="right">₹{parseFloat(emi.principalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(emi.interestAmount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(emi.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(emi.paidAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={emi.status?.toUpperCase()}
                      size="small"
                      color={
                        emi.status === 'paid' ? 'success' :
                        emi.status === 'overdue' ? 'error' :
                        emi.status === 'partial' ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}



