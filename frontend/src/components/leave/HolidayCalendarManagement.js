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
  Typography,
  Grid,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import { leaveMasterService } from '../../services/leaveMasterService';
import { attendanceMatrixService } from '../../services/attendanceMatrixService';
import DataTable from '../DataTable';

export default function HolidayCalendarManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: holidaysData, isLoading } = useQuery(
    ['holidays', year],
    () => leaveMasterService.getHolidays(year),
    { refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      date: '',
      description: '',
      isNational: true,
      applicableStates: [],
      applicableBranches: []
    }
  });

  const createMutation = useMutation(
    (data) => leaveMasterService.createHoliday({ ...data, year }),
    {
      onSuccess: () => {
        toast.success('Holiday created successfully');
        queryClient.invalidateQueries(['holidays', year]);
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create holiday');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => leaveMasterService.updateHoliday(id, data),
    {
      onSuccess: () => {
        toast.success('Holiday updated successfully');
        queryClient.invalidateQueries(['holidays', year]);
        setDialogOpen(false);
        reset();
        setSelectedHoliday(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update holiday');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => leaveMasterService.deleteHoliday(id),
    {
      onSuccess: () => {
        toast.success('Holiday deleted successfully');
        queryClient.invalidateQueries(['holidays', year]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete holiday');
      }
    }
  );

  const syncMutation = useMutation(
    () => attendanceMatrixService.syncHolidays(year),
    {
      onSuccess: (response) => {
        toast.success(`Synced ${response.data?.data?.success || 0} holidays from Matrix`);
        queryClient.invalidateQueries(['holidays', year]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to sync from Matrix');
      }
    }
  );

  const handleOpenDialog = (holiday = null) => {
    if (holiday) {
      setSelectedHoliday(holiday);
      setIsEdit(true);
      reset({
        name: holiday.name,
        date: holiday.date,
        description: holiday.description || '',
        isNational: holiday.isNational,
        applicableStates: holiday.applicableStates || [],
        applicableBranches: holiday.applicableBranches || []
      });
    } else {
      setSelectedHoliday(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedHoliday(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedHoliday.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (holiday) => {
    if (window.confirm(`Are you sure you want to delete holiday "${holiday.name}"?`)) {
      deleteMutation.mutate(holiday.id);
    }
  };

  const holidays = holidaysData?.data || [];

  const columns = [
    { id: 'name', label: 'Holiday Name', minWidth: 200 },
    {
      id: 'date',
      label: 'Date',
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'isNational',
      label: 'Type',
      minWidth: 100,
      format: (value) => <Chip label={value ? 'National' : 'Regional'} size="small" />
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      format: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(row)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="h6">Holiday Calendar</Typography>
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Holiday
          </Button>
        </Box>
      </Box>

      <DataTable columns={columns} data={holidays} loading={isLoading} searchable searchPlaceholder="Search holidays..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Holiday name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Holiday Name" fullWidth required />
                )}
              />
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Description" multiline rows={2} fullWidth />
                )}
              />
              <Controller
                name="isNational"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="National Holiday" />
                )}
              />
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

