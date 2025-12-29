import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Chip,
  Box,
  Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { biometricService } from '../../services/biometricService';
import { employeeService } from '../../services/employeeService';
import DataTable from '../DataTable';

export default function EmployeeMappingDialog({ open, device, onClose }) {
  const queryClient = useQueryClient();
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);

  const { data: mappingsData, isLoading } = useQuery(
    ['employeeMappings', device?.id],
    () => biometricService.getEmployeeMappings(device?.id),
    { enabled: open && !!device?.id }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { enabled: mappingDialogOpen });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      employeeId: '',
      biometricId: '',
      biometricType: 'fingerprint'
    }
  });

  const createMutation = useMutation(
    (data) => biometricService.mapEmployee({ ...data, deviceId: device?.id }),
    {
      onSuccess: () => {
        toast.success('Employee mapped successfully');
        queryClient.invalidateQueries(['employeeMappings', device?.id]);
        reset();
        setMappingDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to map employee');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => biometricService.removeEmployeeMapping(id),
    {
      onSuccess: () => {
        toast.success('Mapping removed successfully');
        queryClient.invalidateQueries(['employeeMappings', device?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove mapping');
      }
    }
  );

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleDelete = (mapping) => {
    if (window.confirm('Are you sure you want to remove this mapping?')) {
      deleteMutation.mutate(mapping.id);
    }
  };

  const mappings = mappingsData?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 200,
      format: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      id: 'biometricId',
      label: 'Biometric ID',
      minWidth: 150
    },
    {
      id: 'biometricType',
      label: 'Type',
      minWidth: 120,
      format: (value) => <Chip label={value?.toUpperCase()} size="small" />
    },
    {
      id: 'enrolledAt',
      label: 'Enrolled At',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      format: (value, row) => (
        <IconButton size="small" onClick={() => handleDelete(row)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          Employee Mappings - {device?.deviceName}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setMappingDialogOpen(true)}
            sx={{ ml: 2 }}
            size="small"
          >
            Add Mapping
          </Button>
        </DialogTitle>
        <DialogContent>
          {device && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info">
                Map employees to their biometric IDs in this device. The biometric ID should match the employee ID stored in the device.
              </Alert>
            </Box>
          )}
          <DataTable columns={columns} data={mappings} loading={isLoading} searchable />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Mapping Dialog */}
      <Dialog open={mappingDialogOpen} onClose={() => setMappingDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Map Employee to Device</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="employeeId"
                  control={control}
                  rules={{ required: 'Employee is required' }}
                  render={({ field }) => (
                    <TextField {...field} select label="Employee" fullWidth required>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="biometricId"
                  control={control}
                  rules={{ required: 'Biometric ID is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Biometric ID" fullWidth required helperText="Employee ID in the device" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="biometricType"
                  control={control}
                  rules={{ required: 'Biometric type is required' }}
                  render={({ field }) => (
                    <TextField {...field} select label="Biometric Type" fullWidth required>
                      <MenuItem value="fingerprint">Fingerprint</MenuItem>
                      <MenuItem value="face">Face</MenuItem>
                      <MenuItem value="iris">Iris</MenuItem>
                      <MenuItem value="palm">Palm</MenuItem>
                      <MenuItem value="rfid">RFID</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMappingDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              Map Employee
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}



