import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControlLabel,
  Switch,
  Typography,
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import { leaveMasterService } from '../../services/leaveMasterService';
import { attendanceMatrixService } from '../../services/attendanceMatrixService';
import DataTable from '../DataTable';

export default function LeaveTypeManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: typesData, isLoading } = useQuery(
    'leaveTypes',
    () => leaveMasterService.getLeaveTypes(),
    { refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      code: '',
      name: '',
      shortName: '',
      description: '',
      maxDaysPerYear: 0,
      maxDaysPerRequest: null,
      carryForward: false,
      maxCarryForwardDays: 0,
      isPaid: true,
      requiresApproval: true,
      requiresDocument: false
    }
  });

  const createMutation = useMutation(
    (data) => leaveMasterService.createLeaveType(data),
    {
      onSuccess: () => {
        toast.success('Leave type created successfully');
        queryClient.invalidateQueries('leaveTypes');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create leave type');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => leaveMasterService.updateLeaveType(id, data),
    {
      onSuccess: () => {
        toast.success('Leave type updated successfully');
        queryClient.invalidateQueries('leaveTypes');
        setDialogOpen(false);
        reset();
        setSelectedType(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update leave type');
      }
    }
  );

  const syncMutation = useMutation(
    () => attendanceMatrixService.syncLeaveTypes(),
    {
      onSuccess: (response) => {
        toast.success(`Synced ${response.data?.data?.success || 0} leave types from Matrix`);
        queryClient.invalidateQueries('leaveTypes');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to sync from Matrix');
      }
    }
  );

  const handleOpenDialog = (type = null) => {
    if (type) {
      setSelectedType(type);
      setIsEdit(true);
      reset(type);
    } else {
      setSelectedType(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedType(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const types = typesData?.data || [];

  const columns = [
    { id: 'code', label: 'Code', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'shortName', label: 'Short Name', minWidth: 100 },
    {
      id: 'maxDaysPerYear',
      label: 'Max Days/Year',
      minWidth: 120,
      format: (value) => value || '-'
    },
    {
      id: 'carryForward',
      label: 'Carry Forward',
      minWidth: 120,
      format: (value) => (value ? 'Yes' : 'No')
    },
    {
      id: 'isPaid',
      label: 'Paid',
      minWidth: 80,
      format: (value) => (value ? 'Yes' : 'No')
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      format: (value, row) => (
        <IconButton size="small" onClick={() => handleOpenDialog(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Leave Types</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<SyncIcon />} onClick={() => syncMutation.mutate()}>
            Sync from Matrix
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Leave Type
          </Button>
        </Box>
      </Box>

      <DataTable columns={columns} data={types} loading={isLoading} searchable searchPlaceholder="Search leave types..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="code"
                    control={control}
                    rules={{ required: 'Code is required' }}
                    render={({ field }) => (
                      <TextField {...field} label="Code" fullWidth required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <TextField {...field} label="Name" fullWidth required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="shortName"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Short Name" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxDaysPerYear"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Days Per Year" type="number" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxDaysPerRequest"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Days Per Request" type="number" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxCarryForwardDays"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Carry Forward Days" type="number" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Description" multiline rows={2} fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="carryForward"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Carry Forward" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="isPaid"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Paid Leave" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="requiresApproval"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Requires Approval" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="requiresDocument"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Requires Document" />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

