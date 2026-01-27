import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  MenuItem,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import SyncIcon from '@mui/icons-material/Sync';
import { leaveMasterService } from '../../services/leaveMasterService';
import { attendanceMatrixService } from '../../services/attendanceMatrixService';
import { employeeService } from '../../services/employeeService';
import DataTable from '../DataTable';

export default function LeaveBalanceManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: balancesData, isLoading } = useQuery(
    ['leaveBalances', year],
    () => leaveMasterService.getLeaveBalance({ year }),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getAll(),
    { enabled: false }
  );

  const { data: leaveTypesData } = useQuery(
    'leaveTypes',
    () => leaveMasterService.getLeaveTypes(),
    { enabled: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      employeeId: '',
      leaveTypeId: '',
      year: new Date().getFullYear(),
      allocated: 0,
      openingBalance: 0
    }
  });

  const updateMutation = useMutation(
    (data) => leaveMasterService.updateLeaveBalance(data),
    {
      onSuccess: () => {
        toast.success('Leave balance updated successfully');
        queryClient.invalidateQueries(['leaveBalances', year]);
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update leave balance');
      }
    }
  );

  const syncMutation = useMutation(
    () => attendanceMatrixService.syncLeaveBalances(),
    {
      onSuccess: (response) => {
        toast.success(`Synced ${response.data?.data?.success || 0} leave balances from Matrix`);
        queryClient.invalidateQueries(['leaveBalances', year]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to sync from Matrix');
      }
    }
  );

  const handleOpenDialog = (balance = null) => {
    if (balance) {
      setSelectedBalance(balance);
      reset({
        employeeId: balance.employeeId,
        leaveTypeId: balance.leaveTypeId,
        year: balance.year,
        allocated: balance.allocated,
        openingBalance: balance.openingBalance
      });
    } else {
      setSelectedBalance(null);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedBalance(null);
  };

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const balances = balancesData?.data || [];
  const employees = employeesData?.data || [];
  const leaveTypes = leaveTypesData?.data || [];

  const columns = [
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 150,
      format: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      id: 'leaveType',
      label: 'Leave Type',
      minWidth: 120,
      format: (value, row) => row.leaveType?.name || '-'
    },
    { id: 'year', label: 'Year', minWidth: 80 },
    {
      id: 'allocated',
      label: 'Allocated',
      minWidth: 100,
      format: (value) => value?.toFixed(2) || '0.00'
    },
    {
      id: 'used',
      label: 'Used',
      minWidth: 100,
      format: (value) => value?.toFixed(2) || '0.00'
    },
    {
      id: 'balance',
      label: 'Balance',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value?.toFixed(2) || '0.00'}
          color={value > 0 ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      format: (value, row) => (
        <Button size="small" onClick={() => handleOpenDialog(row)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="h6">Leave Balance</Typography>
          <TextField
            label="Year"
            type="number"
            size="small"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            sx={{ width: 100 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<SyncIcon />} onClick={() => syncMutation.mutate()}>
            Sync from Matrix
          </Button>
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Add Balance
          </Button>
        </Box>
      </Box>

      <DataTable columns={columns} data={balances} loading={isLoading} searchable searchPlaceholder="Search leave balances..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{selectedBalance ? 'Edit Leave Balance' : 'Add Leave Balance'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
              <Controller
                name="leaveTypeId"
                control={control}
                rules={{ required: 'Leave type is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Leave Type" fullWidth required>
                    {leaveTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Year" type="number" fullWidth />
                )}
              />
              <Controller
                name="openingBalance"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Opening Balance" type="number" step="0.01" fullWidth />
                )}
              />
              <Controller
                name="allocated"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Allocated" type="number" step="0.01" fullWidth />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isLoading}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}



