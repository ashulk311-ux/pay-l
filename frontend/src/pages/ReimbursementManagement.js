import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton
} from '@mui/material';
import { useQuery } from 'react-query';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { reimbursementService } from '../services/reimbursementService';
import DataTable from '../components/DataTable';
import ReimbursementSubmissionDialog from '../components/reimbursement/ReimbursementSubmissionDialog';
import ReimbursementDetailsDialog from '../components/reimbursement/ReimbursementDetailsDialog';
import ReimbursementApprovalDialog from '../components/reimbursement/ReimbursementApprovalDialog';
import ReimbursementCategoryManagement from '../components/reimbursement/ReimbursementCategoryManagement';
import ReimbursementPolicyManagement from '../components/reimbursement/ReimbursementPolicyManagement';
import ReimbursementWorkflowManagement from '../components/reimbursement/ReimbursementWorkflowManagement';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReimbursementManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [action, setAction] = useState(null);

  const { data: reimbursementsData, isLoading, error: reimbursementsError } = useQuery(
    ['reimbursements', tabValue],
    () => {
      if (tabValue === 0) {
        return reimbursementService.getAll({ status: 'pending' });
      } else if (tabValue === 1) {
        return reimbursementService.getAll({ status: 'approved' });
      } else if (tabValue === 2) {
        return reimbursementService.getAll();
      }
      return reimbursementService.getAll();
    },
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setDetailsDialogOpen(true);
  };

  const handleApprove = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setAction('approve');
    setApprovalDialogOpen(true);
  };

  const handleReject = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setAction('reject');
    setApprovalDialogOpen(true);
  };

  const reimbursements = reimbursementsData?.data || [];

  const columns = [
    {
      field: 'employee',
      header: 'Employee',
      minWidth: 150,
      accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`,
      render: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      field: 'category',
      header: 'Category',
      minWidth: 120,
      accessor: (row) => row.categoryRef?.name || row.category || '-',
      render: (value, row) => row.categoryRef?.name || row.category || '-'
    },
    {
      field: 'amount',
      header: 'Amount',
      minWidth: 120,
      accessor: (row) => row.amount || 0,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'date',
      header: 'Date',
      minWidth: 100,
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      field: 'isTaxable',
      header: 'Taxable',
      minWidth: 100,
      render: (value) => <Chip label={value ? 'Yes' : 'No'} size="small" color={value ? 'warning' : 'default'} />
    },
    {
      field: 'status',
      header: 'Status',
      minWidth: 100,
      render: (value) => {
        const colors = {
          pending: 'warning',
          approved: 'success',
          rejected: 'error',
          paid: 'info'
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
              <IconButton size="small" onClick={() => handleReject(row)} color="error" title="Reject">
                <CancelIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reimbursement Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage reimbursement categories, policies, workflow, and approvals
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="All Reimbursements" />
            <Tab label="Categories" />
            <Tab label="Policies" />
            <Tab label="Workflow" />
          </Tabs>
          {tabValue < 3 && (
            <Box sx={{ pr: 2 }}>
              <Button variant="contained" onClick={() => setSubmissionDialogOpen(true)}>
                Submit Reimbursement
              </Button>
            </Box>
          )}
        </Box>

        <TabPanel value={tabValue} index={0}>
          {reimbursementsError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading reimbursements: {reimbursementsError?.response?.data?.message || reimbursementsError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !reimbursementsError && reimbursements.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No pending reimbursements found.
              </Typography>
            </Box>
          )}
          {!isLoading && !reimbursementsError && reimbursements.length > 0 && (
            <DataTable columns={columns} data={reimbursements} loading={isLoading} searchable searchPlaceholder="Search pending reimbursements..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {reimbursementsError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading reimbursements: {reimbursementsError?.response?.data?.message || reimbursementsError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !reimbursementsError && reimbursements.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No approved reimbursements found.
              </Typography>
            </Box>
          )}
          {!isLoading && !reimbursementsError && reimbursements.length > 0 && (
            <DataTable columns={columns} data={reimbursements} loading={isLoading} searchable searchPlaceholder="Search approved reimbursements..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {reimbursementsError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading reimbursements: {reimbursementsError?.response?.data?.message || reimbursementsError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !reimbursementsError && reimbursements.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No reimbursements found.
              </Typography>
            </Box>
          )}
          {!isLoading && !reimbursementsError && reimbursements.length > 0 && (
            <DataTable columns={columns} data={reimbursements} loading={isLoading} searchable searchPlaceholder="Search all reimbursements..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ReimbursementCategoryManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <ReimbursementPolicyManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <ReimbursementWorkflowManagement />
        </TabPanel>
      </Paper>

      <ReimbursementSubmissionDialog open={submissionDialogOpen} onClose={() => setSubmissionDialogOpen(false)} />
      <ReimbursementDetailsDialog open={detailsDialogOpen} reimbursement={selectedReimbursement} onClose={() => setDetailsDialogOpen(false)} />
      <ReimbursementApprovalDialog open={approvalDialogOpen} reimbursement={selectedReimbursement} action={action} onClose={() => { setApprovalDialogOpen(false); setAction(null); }} />
    </Container>
  );
}
