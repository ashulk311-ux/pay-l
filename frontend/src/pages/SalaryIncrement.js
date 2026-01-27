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
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { incrementService } from '../services/incrementService';
import DataTable from '../components/DataTable';
import IncrementDialog from '../components/increment/IncrementDialog';
import IncrementApprovalDialog from '../components/increment/IncrementApprovalDialog';
import IncrementDetailsDialog from '../components/increment/IncrementDetailsDialog';
import BulkIncrementDialog from '../components/increment/BulkIncrementDialog';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SalaryIncrement() {
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState(null);
  const [action, setAction] = useState(null);

  const { data: incrementsData, isLoading, error: incrementsError } = useQuery(
    ['increments', tabValue],
    () => {
      if (tabValue === 0) {
        return incrementService.getAll({ status: 'pending' });
      } else if (tabValue === 1) {
        return incrementService.getAll({ status: 'approved' });
      } else {
        return incrementService.getAll();
      }
    },
    { 
      refetchOnWindowFocus: false, 
      retry: 1,
      staleTime: 0,
      cacheTime: 0
    }
  );

  const queryClient = useQueryClient();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (increment) => {
    setSelectedIncrement(increment);
    setDetailsDialogOpen(true);
  };

  const handleApprove = (increment) => {
    setSelectedIncrement(increment);
    setAction('approve');
    setApprovalDialogOpen(true);
  };

  const handleReject = (increment) => {
    setSelectedIncrement(increment);
    setAction('reject');
    setApprovalDialogOpen(true);
  };

  const applyMutation = useMutation(
    (id) => incrementService.apply(id),
    {
      onSuccess: () => {
        toast.success('Increment applied successfully');
        queryClient.invalidateQueries('increments');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to apply increment');
      }
    }
  );

  const handleApply = (increment) => {
    if (window.confirm(`Apply this increment to employee's salary structure?`)) {
      applyMutation.mutate(increment.id);
    }
  };

  // Handle both direct array and wrapped response
  const increments = Array.isArray(incrementsData) 
    ? incrementsData 
    : (incrementsData?.data || []);

  const columns = [
    {
      field: 'employee',
      header: 'Employee',
      minWidth: 150,
      accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`,
      render: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      field: 'incrementType',
      header: 'Type',
      minWidth: 120,
      render: (value) => {
        const labels = {
          individual: 'Individual',
          grade_based: 'Grade Based',
          designation_based: 'Designation Based',
          policy_based: 'Policy Based'
        };
        return <Chip label={labels[value] || value || 'N/A'} size="small" />;
      }
    },
    {
      field: 'previousSalary',
      header: 'Previous',
      minWidth: 120,
      accessor: (row) => row.previousSalary || 0,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'newSalary',
      header: 'New',
      minWidth: 120,
      accessor: (row) => row.newSalary || 0,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'incrementAmount',
      header: 'Increment',
      minWidth: 120,
      accessor: (row) => row.incrementAmount || 0,
      render: (value, row) => (
        <Box>
          <Typography variant="body2">₹{parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.incrementPercentage ? `${parseFloat(row.incrementPercentage).toFixed(2)}%` : '-'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'effectiveDate',
      header: 'Effective Date',
      minWidth: 120,
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      field: 'status',
      header: 'Status',
      minWidth: 100,
      render: (value, row) => {
        const colors = {
          pending: 'warning',
          approved: 'info',
          rejected: 'error'
        };
        return (
          <Box>
            <Chip label={value?.toUpperCase() || 'N/A'} size="small" color={colors[value] || 'default'} />
            {row.isApplied && <Chip label="APPLIED" size="small" color="success" sx={{ ml: 0.5 }} />}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 200,
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
          {row.status === 'approved' && !row.isApplied && (
            <Button size="small" onClick={() => handleApply(row)} color="primary">
              Apply
            </Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Salary Increment Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage individual and bulk salary increments with approval workflow
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="All Increments" />
          </Tabs>
          <Box sx={{ pr: 2, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => setBulkDialogOpen(true)}>
              Bulk Increment
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Increment
            </Button>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {incrementsError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading increments: {incrementsError?.response?.data?.message || incrementsError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !incrementsError && increments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No pending increments found.
              </Typography>
            </Box>
          )}
          {!isLoading && !incrementsError && increments.length > 0 && (
            <DataTable columns={columns} data={increments} loading={isLoading} searchable searchPlaceholder="Search pending increments..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {incrementsError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading increments: {incrementsError?.response?.data?.message || incrementsError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !incrementsError && increments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No approved increments found.
              </Typography>
            </Box>
          )}
          {!isLoading && !incrementsError && increments.length > 0 && (
            <DataTable columns={columns} data={increments} loading={isLoading} searchable searchPlaceholder="Search approved increments..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {incrementsError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading increments: {incrementsError?.response?.data?.message || incrementsError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !incrementsError && increments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No increments found.
              </Typography>
            </Box>
          )}
          {!isLoading && !incrementsError && increments.length > 0 && (
            <DataTable columns={columns} data={increments} loading={isLoading} searchable searchPlaceholder="Search all increments..." />
          )}
        </TabPanel>
      </Paper>

      <IncrementDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <BulkIncrementDialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} />
      <IncrementDetailsDialog open={detailsDialogOpen} increment={selectedIncrement} onClose={() => setDetailsDialogOpen(false)} />
      <IncrementApprovalDialog open={approvalDialogOpen} increment={selectedIncrement} action={action} onClose={() => { setApprovalDialogOpen(false); setAction(null); }} />
    </Container>
  );
}
