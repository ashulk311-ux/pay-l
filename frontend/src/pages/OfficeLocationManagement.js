import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Chip,
  Paper,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { officeLocationService } from '../services/officeLocationService';
import { branchService } from '../services/branchService';
import DataTable from '../components/DataTable';

export default function OfficeLocationManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { data: locationsData, isLoading, error: locationsError } = useQuery('officeLocations', () => officeLocationService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const { data: branchesData } = useQuery('branches', () => branchService.getAll(), { enabled: dialogOpen });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      locationName: '',
      address: '',
      latitude: '',
      longitude: '',
      allowedRadius: 100,
      branchId: '',
      isDefault: false,
      timezone: 'Asia/Kolkata',
      workingHours: {
        start: '09:00',
        end: '18:00'
      }
    }
  });

  React.useEffect(() => {
    if (selectedLocation && dialogOpen) {
      reset({
        locationName: selectedLocation.locationName || '',
        address: selectedLocation.address || '',
        latitude: selectedLocation.latitude || '',
        longitude: selectedLocation.longitude || '',
        allowedRadius: selectedLocation.allowedRadius || 100,
        branchId: selectedLocation.branchId || '',
        isDefault: selectedLocation.isDefault || false,
        timezone: selectedLocation.timezone || 'Asia/Kolkata',
        workingHours: selectedLocation.workingHours || { start: '09:00', end: '18:00' }
      });
    } else if (!selectedLocation && dialogOpen) {
      reset();
    }
  }, [selectedLocation, reset, dialogOpen]);

  const createMutation = useMutation(
    (data) => officeLocationService.create(data),
    {
      onSuccess: () => {
        toast.success('Office location created successfully');
        queryClient.invalidateQueries('officeLocations');
        reset();
        setDialogOpen(false);
        setSelectedLocation(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create office location');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => officeLocationService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Office location updated successfully');
        queryClient.invalidateQueries('officeLocations');
        reset();
        setDialogOpen(false);
        setSelectedLocation(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update office location');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => officeLocationService.delete(id),
    {
      onSuccess: () => {
        toast.success('Office location deleted successfully');
        queryClient.invalidateQueries('officeLocations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete office location');
      }
    }
  );

  const onSubmit = (data) => {
    if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (location) => {
    if (window.confirm(`Are you sure you want to delete location "${location.locationName}"?`)) {
      deleteMutation.mutate(location.id);
    }
  };

  const locations = locationsData?.data || [];
  const branches = branchesData?.data || [];

  const columns = [
    {
      field: 'locationName',
      header: 'Location Name',
      minWidth: 150
    },
    {
      field: 'address',
      header: 'Address',
      minWidth: 200
    },
    {
      field: 'coordinates',
      header: 'Coordinates',
      minWidth: 150,
      accessor: (row) => `${row.latitude}, ${row.longitude}`,
      render: (value, row) => `${row.latitude}, ${row.longitude}`
    },
    {
      field: 'allowedRadius',
      header: 'Allowed Radius',
      minWidth: 120,
      render: (value) => `${value || 0} meters`
    },
    {
      field: 'isDefault',
      header: 'Default',
      minWidth: 100,
      render: (value) => value ? <Chip label="Yes" color="primary" size="small" /> : <Chip label="No" size="small" />
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 150,
      render: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => { setSelectedLocation(row); setDialogOpen(true); }}>
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
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Office Location Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure office locations for GPS-based attendance tracking
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Office Locations</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedLocation(null); setDialogOpen(true); }}>
            Add Location
          </Button>
        </Box>
        {locationsError && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="error">
              Error loading office locations: {locationsError?.response?.data?.message || locationsError?.message || 'Unknown error'}
            </Typography>
          </Box>
        )}
        {!isLoading && !locationsError && locations.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No office locations found. Add your first location to enable GPS-based attendance tracking.
            </Typography>
          </Box>
        )}
        {!isLoading && !locationsError && locations.length > 0 && (
          <DataTable columns={columns} data={locations} loading={isLoading} searchable searchPlaceholder="Search locations..." />
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedLocation(null); }} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {selectedLocation ? 'Edit Office Location' : 'Add Office Location'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="locationName"
                  control={control}
                  rules={{ required: 'Location name is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Location Name" fullWidth required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Branch" fullWidth>
                      <MenuItem value="">All Branches</MenuItem>
                      {branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  rules={{ required: 'Address is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Address" multiline rows={2} fullWidth required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="latitude"
                  control={control}
                  rules={{ required: 'Latitude is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Latitude" type="number" step="any" fullWidth required helperText="GPS latitude coordinate" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="longitude"
                  control={control}
                  rules={{ required: 'Longitude is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Longitude" type="number" step="any" fullWidth required helperText="GPS longitude coordinate" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="allowedRadius"
                  control={control}
                  rules={{ required: 'Allowed radius is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Allowed Radius (meters)" type="number" fullWidth required helperText="Maximum distance from office for GPS attendance" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Timezone" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="isDefault"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox checked={field.value} onChange={field.onChange} />}
                      label="Set as default location"
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Use Google Maps to get accurate GPS coordinates. Right-click on the location and select "What's here?" to get latitude and longitude.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDialogOpen(false); setSelectedLocation(null); }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {selectedLocation ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

