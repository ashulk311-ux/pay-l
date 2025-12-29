import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import { loanService } from '../services/loanService';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';
import LoanRequestDialog from '../components/loan/LoanRequestDialog';
import LoanApprovalDialog from '../components/loan/LoanApprovalDialog';
import LoanDetailsDialog from '../components/loan/LoanDetailsDialog';
import EMIConfigurationDialog from '../components/loan/EMIConfigurationDialog';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoanManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [emiConfigDialogOpen, setEmiConfigDialogOpen] = useState(false);
  const [action, setAction] = useState(null);

  const { data: loansData, isLoading, error: loansError } = useQuery(
    ['loans', tabValue],
    () => {
      if (tabValue === 1) {
        return loanService.getOutstanding();
      }
      // Tab 0: Pending, Tab 2: Active, Tab 3: All loans
      const statusFilter = tabValue === 0 ? 'pending' : tabValue === 2 ? 'active' : undefined;
      return loanService.getAll(statusFilter ? { status: statusFilter } : {});
    },
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setDetailsDialogOpen(true);
  };

  const handleApprove = (loan) => {
    setSelectedLoan(loan);
    setAction('approve');
    setApprovalDialogOpen(true);
  };

  const handleConfigureEMI = (loan) => {
    setSelectedLoan(loan);
    setEmiConfigDialogOpen(true);
  };

  const loans = loansData?.data || [];
  const summary = loansData?.summary || {};

  const columns = [
    {
      field: 'employee',
      header: 'Employee',
      minWidth: 150,
      accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`,
      render: (value, row) => value || `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      field: 'loanType',
      header: 'Type',
      minWidth: 100,
      render: (value) => <Chip label={value?.toUpperCase() || 'N/A'} size="small" color={value === 'loan' ? 'primary' : 'secondary'} />
    },
    {
      field: 'amount',
      header: 'Amount',
      minWidth: 120,
      accessor: (row) => row.amount || row.principalAmount || 0,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'outstandingAmount',
      header: 'Outstanding',
      minWidth: 120,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'emiAmount',
      header: 'EMI',
      minWidth: 100,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'status',
      header: 'Status',
      minWidth: 100,
      render: (value) => {
        const colors = {
          pending: 'warning',
          approved: 'info',
          active: 'success',
          closed: 'default',
          rejected: 'error'
        };
        return <Chip label={value?.toUpperCase() || 'N/A'} size="small" color={colors[value] || 'default'} />;
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 150,
      render: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleViewDetails(row)} title="View Details">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {row.status === 'pending' && (
            <>
              <IconButton size="small" onClick={() => handleApprove(row)} color="success" title="Approve">
                <CheckCircleIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => { setSelectedLoan(row); setAction('reject'); setApprovalDialogOpen(true); }} color="error" title="Reject">
                <CancelIcon fontSize="small" />
              </IconButton>
            </>
          )}
          {row.status === 'active' && (
            <IconButton size="small" onClick={() => handleConfigureEMI(row)} title="Configure EMI">
              <SettingsIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loan / Advance Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage loan requests, approvals, EMI configuration, and outstanding tracking
        </Typography>
      </Box>

      {tabValue === 1 && summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Outstanding</Typography>
                <Typography variant="h5">₹{summary.totalOutstanding?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Loans</Typography>
                <Typography variant="h5">{summary.totalLoans || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Overdue EMIs</Typography>
                <Typography variant="h5" color="error">{summary.overdueEMIs || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Pending Requests" />
            <Tab label="Outstanding" />
            <Tab label="Active Loans" />
            <Tab label="All Loans" />
          </Tabs>
          <Box sx={{ pr: 2 }}>
            <Button variant="contained" onClick={() => setRequestDialogOpen(true)}>
              Request Loan
            </Button>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loansError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading loans: {loansError?.response?.data?.message || loansError?.message || 'Unknown error'}
            </Alert>
          )}
          {!isLoading && !loansError && loans.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No pending loan requests found.
              </Typography>
            </Box>
          )}
          {!isLoading && !loansError && loans.length > 0 && (
            <DataTable columns={columns} data={loans} loading={isLoading} searchable searchPlaceholder="Search loans..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {loansError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading outstanding loans: {loansError?.response?.data?.message || loansError?.message || 'Unknown error'}
            </Alert>
          )}
          {!isLoading && !loansError && loans.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No outstanding loans found.
              </Typography>
            </Box>
          )}
          {!isLoading && !loansError && loans.length > 0 && (
            <DataTable columns={columns} data={loans} loading={isLoading} searchable searchPlaceholder="Search outstanding loans..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {loansError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading active loans: {loansError?.response?.data?.message || loansError?.message || 'Unknown error'}
            </Alert>
          )}
          {!isLoading && !loansError && loans.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No active loans found.
              </Typography>
            </Box>
          )}
          {!isLoading && !loansError && loans.length > 0 && (
            <DataTable columns={columns} data={loans} loading={isLoading} searchable searchPlaceholder="Search active loans..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {loansError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading loans: {loansError?.response?.data?.message || loansError?.message || 'Unknown error'}
            </Alert>
          )}
          {!isLoading && !loansError && loans.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No loans found.
              </Typography>
            </Box>
          )}
          {!isLoading && !loansError && loans.length > 0 && (
            <DataTable columns={columns} data={loans} loading={isLoading} searchable searchPlaceholder="Search all loans..." />
          )}
        </TabPanel>
      </Paper>

      <LoanRequestDialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} />
      <LoanDetailsDialog open={detailsDialogOpen} loan={selectedLoan} onClose={() => setDetailsDialogOpen(false)} />
      <LoanApprovalDialog open={approvalDialogOpen} loan={selectedLoan} action={action} onClose={() => { setApprovalDialogOpen(false); setAction(null); }} />
      <EMIConfigurationDialog open={emiConfigDialogOpen} loan={selectedLoan} onClose={() => setEmiConfigDialogOpen(false)} />
    </Container>
  );
}
