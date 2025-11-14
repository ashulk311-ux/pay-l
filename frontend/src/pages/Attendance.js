import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { attendanceService } from '../services/attendanceService';
import DataTable from '../components/DataTable';

export default function Attendance() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: ''
  });

  const { data, isLoading } = useQuery(
    ['attendance', filters],
    () => attendanceService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const deleteMutation = useMutation(
    (id) => attendanceService.delete(id),
    {
      onSuccess: () => {
        toast.success('Attendance record deleted successfully');
        queryClient.invalidateQueries('attendance');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete attendance');
      }
    }
  );

  const handleBulkUpload = () => {
    // TODO: Implement bulk upload dialog
    toast.info('Bulk upload feature coming soon');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    { field: 'date', header: 'Date', format: 'date' },
    { field: 'employeeCode', header: 'Employee Code', accessor: (row) => row.employee?.employeeCode },
    { field: 'name', header: 'Name', accessor: (row) => `${row.employee?.firstName} ${row.employee?.lastName}` },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        present: 'success',
        absent: 'error',
        'half-day': 'warning',
        holiday: 'info',
        weekend: 'default'
      }
    },
    { field: 'checkIn', header: 'Check In' },
    { field: 'checkOut', header: 'Check Out' },
    { field: 'hoursWorked', header: 'Hours Worked' },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleDelete(row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const attendanceRecords = data?.data || [];

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Attendance Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleBulkUpload}
            sx={{ mr: 2 }}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Record
          </Button>
        </Box>
      </Box>

      <Box mb={3} display="flex" gap={2}>
        <TextField
          size="small"
          label="Start Date"
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          label="End Date"
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <DataTable
        columns={columns}
        data={attendanceRecords}
        loading={isLoading}
        searchable
        searchPlaceholder="Search attendance..."
      />
    </Container>
  );
}

