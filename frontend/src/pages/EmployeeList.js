import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';

export default function EmployeeList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    status: ''
  });

  const { data, isLoading, error } = useQuery(
    ['employees', filters],
    () => employeeService.getAll(filters),
    { refetchOnWindowFocus: false }
  );

  const deleteMutation = useMutation(
    (id) => employeeService.delete(id),
    {
      onSuccess: () => {
        toast.success('Employee deleted successfully');
        queryClient.invalidateQueries('employees');
        setDeleteDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete employee');
      }
    }
  );

  const handleMenuOpen = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const handleView = () => {
    if (selectedEmployee) {
      navigate(`/employees/${selectedEmployee.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedEmployee) {
      navigate(`/employees/${selectedEmployee.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteMutation.mutate(selectedEmployee.id);
    }
  };

  const handleBulkImport = () => {
    // TODO: Implement bulk import dialog
    toast.info('Bulk import feature coming soon');
  };

  const columns = [
    {
      field: 'employeeCode',
      header: 'Employee Code',
      align: 'left'
    },
    {
      field: 'name',
      header: 'Name',
      accessor: (row) => `${row.firstName} ${row.lastName}`
    },
    {
      field: 'email',
      header: 'Email'
    },
    {
      field: 'department',
      header: 'Department'
    },
    {
      field: 'designation',
      header: 'Designation'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        active: 'success',
        inactive: 'default',
        terminated: 'error'
      }
    },
    {
      field: 'kycStatus',
      header: 'KYC Status',
      type: 'chip',
      chipColors: {
        verified: 'success',
        pending: 'warning',
        rejected: 'error'
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  const employees = data?.data || [];

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employees</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleBulkImport}
            sx={{ mr: 2 }}
          >
            Bulk Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      <Box mb={3} display="flex" gap={2}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={filters.department}
            label="Department"
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="IT">IT</MenuItem>
            <MenuItem value="HR">HR</MenuItem>
            <MenuItem value="Finance">Finance</MenuItem>
            <MenuItem value="Sales">Sales</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="terminated">Terminated</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={employees}
        loading={isLoading}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
        searchable
        searchPlaceholder="Search employees..."
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete employee {selectedEmployee?.employeeCode}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
