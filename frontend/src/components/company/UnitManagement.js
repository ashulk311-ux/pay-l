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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { unitService } from '../../services/unitService';
import { officeLocationService } from '../../services/officeLocationService';
import DataTable from '../DataTable';

export default function UnitManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: unitsData, isLoading, error: unitsError } = useQuery('units', () => unitService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const { data: locationsData } = useQuery('officeLocations', () => officeLocationService.getAll());

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      locationId: ''
    }
  });

  const createMutation = useMutation(
    (data) => unitService.create(data),
    {
      onSuccess: () => {
        toast.success('Unit created successfully');
        queryClient.invalidateQueries('units');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create unit');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => unitService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Unit updated successfully');
        queryClient.invalidateQueries('units');
        setDialogOpen(false);
        reset();
        setSelectedUnit(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update unit');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => unitService.delete(id),
    {
      onSuccess: () => {
        toast.success('Unit deleted successfully');
        queryClient.invalidateQueries('units');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete unit');
      }
    }
  );

  const handleOpenDialog = (unit = null) => {
    if (unit) {
      setSelectedUnit(unit);
      setIsEdit(true);
      reset(unit);
    } else {
      setSelectedUnit(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedUnit(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (unit) => {
    if (window.confirm(`Are you sure you want to delete unit "${unit.name}"?`)) {
      deleteMutation.mutate(unit.id);
    }
  };

  const units = unitsData?.data || [];
  const locations = locationsData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { 
      field: 'location', 
      header: 'Location', 
      minWidth: 150,
      render: (value, row) => row.locationRef?.name || '-'
    },
    { field: 'description', header: 'Description', minWidth: 250 },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 120,
      render: (value, row) => (
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
        <Typography variant="h6">Units</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Unit
        </Button>
      </Box>

      {unitsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading units: {unitsError?.response?.data?.message || unitsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !unitsError && units.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No units found. Add your first unit to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !unitsError && units.length > 0 && (
        <DataTable
          columns={columns}
          data={units}
          loading={isLoading}
          searchable
          searchPlaceholder="Search units..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="code"
                control={control}
                rules={{ required: 'Code is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit Code"
                    fullWidth
                    error={!!errors.code}
                    helperText={errors.code?.message}
                  />
                )}
              />
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Location</InputLabel>
                    <Select {...field} label="Location">
                      <MenuItem value="">None</MenuItem>
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                  />
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


