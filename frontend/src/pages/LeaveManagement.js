import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { leaveService } from '../services/leaveService';
import DataTable from '../components/DataTable';

export default function LeaveManagement() {
  const queryClient = useQueryClient();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [filters, setFilters] = useState({
    status: ''
  });

  const { data, isLoading } = useQuery(
    ['leaves', filters],
    () => leaveService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const approveMutation = useMutation(
    ({ id, data }) => leaveService.approve(id, data),
    {
      onSuccess: () => {
        toast.success('Leave approved successfully');
        queryClient.invalidateQueries('leaves');
        setApproveDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve leave');
      }
    }
  );

  const rejectMutation = useMutation(
    ({ id, data }) => leaveService.reject(id, data),
    {
      onSuccess: () => {
        toast.success('Leave rejected successfully');
        queryClient.invalidateQueries('leaves');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject leave');
      }
    }
  );

  const handleApprove = (leave) => {
    setSelectedLeave(leave);
    setApproveDialogOpen(true);
  };

  const handleReject = (leave) => {
    if (window.confirm('Are you sure you want to reject this leave request?')) {
      rejectMutation.mutate({ id: leave.id, data: {} });
    }
  };

  const confirmApprove = () => {
    if (selectedLeave) {
      approveMutation.mutate({ id: selectedLeave.id, data: {} });
    }
  };

  const columns = [
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    { field: 'leaveType', header: 'Leave Type' },
    { field: 'startDate', header: 'Start Date', format: 'date' },
    { field: 'endDate', header: 'End Date', format: 'date' },
    { field: 'days', header: 'Days' },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        pending: 'warning',
        approved: 'success',
        rejected: 'error'
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        row.status === 'pending' ? (
          <Box>
            <IconButton
              size="small"
              color="success"
              onClick={() => handleApprove(row)}
            >
              <CheckCircleIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleReject(row)}
            >
              <CancelIcon />
            </IconButton>
          </Box>
        ) : null
      )
    }
  ];

  const leaves = data?.data || [];

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Leave Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => toast.info('Leave application feature coming soon')}
        >
          Apply Leave
        </Button>
      </Box>

      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={leaves}
        loading={isLoading}
        searchable
        searchPlaceholder="Search leaves..."
      />

      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Leave</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve leave for {selectedLeave && `${selectedLeave.employee?.firstName} ${selectedLeave.employee?.lastName}`}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmApprove} variant="contained" color="success" disabled={approveMutation.isLoading}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

