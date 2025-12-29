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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import { costCenterService } from '../../services/costCenterService';
import { officeLocationService } from '../../services/officeLocationService';
import { unitService } from '../../services/unitService';
import DataTable from '../DataTable';

export default function StatutoryLocationMappingManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: mappingsData, isLoading, error: mappingsError } = useQuery(
    'statutoryLocationMappings',
    () => statutoryService.getLocationMappings(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { data: costCentersData } = useQuery('costCenters', () => costCenterService.getAll());
  const { data: locationsData } = useQuery('officeLocations', () => officeLocationService.getAll());
  const { data: unitsData } = useQuery('units', () => unitService.getAll());
  const { data: pfGroupsData } = useQuery('pfGroups', () => statutoryService.getPFGroups());
  const { data: esiGroupsData } = useQuery('esiGroups', () => statutoryService.getESIGroups());
  const { data: ptGroupsData } = useQuery('ptGroups', () => statutoryService.getPTGroups());

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      groupType: '',
      groupId: '',
      costCenterIds: [],
      locationIds: [],
      unitIds: []
    }
  });

  const watchedGroupType = watch('groupType');

  const createMutation = useMutation(
    (data) => statutoryService.createLocationMapping(data),
    {
      onSuccess: () => {
        toast.success('Location mapping created successfully');
        queryClient.invalidateQueries('statutoryLocationMappings');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create location mapping');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateLocationMapping(id, data),
    {
      onSuccess: () => {
        toast.success('Location mapping updated successfully');
        queryClient.invalidateQueries('statutoryLocationMappings');
        setDialogOpen(false);
        reset();
        setSelectedMapping(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update location mapping');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteLocationMapping(id),
    {
      onSuccess: () => {
        toast.success('Location mapping deleted successfully');
        queryClient.invalidateQueries('statutoryLocationMappings');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete location mapping');
      }
    }
  );

  const handleOpenDialog = (mapping = null) => {
    if (mapping) {
      setSelectedMapping(mapping);
      setIsEdit(true);
      reset({
        groupType: mapping.groupType,
        groupId: mapping.groupId,
        costCenterIds: mapping.costCenterIds || [],
        locationIds: mapping.locationIds || [],
        unitIds: mapping.unitIds || []
      });
    } else {
      setSelectedMapping(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedMapping(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedMapping.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (mapping) => {
    if (window.confirm(`Are you sure you want to delete this location mapping?`)) {
      deleteMutation.mutate(mapping.id);
    }
  };

  const mappings = mappingsData?.data || [];
  const costCenters = costCentersData?.data || [];
  const locations = locationsData?.data || [];
  const units = unitsData?.data || [];

  // Get groups based on selected type
  const getGroupsForType = () => {
    if (watchedGroupType === 'PF') return pfGroupsData?.data || [];
    if (watchedGroupType === 'ESI') return esiGroupsData?.data || [];
    if (watchedGroupType === 'PT') return ptGroupsData?.data || [];
    return [];
  };

  const columns = [
    { field: 'groupType', header: 'Group Type', minWidth: 100 },
    { 
      field: 'groupName', 
      header: 'Group Name', 
      minWidth: 200,
      render: (value, row) => row.groupRef?.groupName || '-'
    },
    { 
      field: 'costCenters', 
      header: 'Cost Centers', 
      minWidth: 150,
      render: (value, row) => row.costCenters?.length || 0
    },
    { 
      field: 'locations', 
      header: 'Locations', 
      minWidth: 150,
      render: (value, row) => row.locations?.length || 0
    },
    { 
      field: 'units', 
      header: 'Units', 
      minWidth: 150,
      render: (value, row) => row.units?.length || 0
    },
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
        <Typography variant="h6">PF / ESI / PT Location & Unit Mapping</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Mapping
        </Button>
      </Box>

      {mappingsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading location mappings: {mappingsError?.response?.data?.message || mappingsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !mappingsError && mappings.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No location mappings found. Add your first mapping to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !mappingsError && mappings.length > 0 && (
        <DataTable
          columns={columns}
          data={mappings}
          loading={isLoading}
          searchable
          searchPlaceholder="Search mappings..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Location Mapping' : 'Add New Location Mapping'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="groupType"
                  control={control}
                  rules={{ required: 'Group type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.groupType}>
                      <InputLabel>Group Type</InputLabel>
                      <Select {...field} label="Group Type">
                        <MenuItem value="PF">PF</MenuItem>
                        <MenuItem value="ESI">ESI</MenuItem>
                        <MenuItem value="PT">PT</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="groupId"
                  control={control}
                  rules={{ required: 'Group is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.groupId} disabled={!watchedGroupType}>
                      <InputLabel>Group Name</InputLabel>
                      <Select {...field} label="Group Name" disabled={!watchedGroupType}>
                        {getGroupsForType().map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.groupName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Controller
                name="costCenterIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={costCenters}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    value={costCenters.filter(cc => field.value?.includes(cc.id))}
                    onChange={(e, newValue) => field.onChange(newValue.map(v => v.id))}
                    renderInput={(params) => (
                      <TextField {...params} label="Cost Centers" placeholder="Select cost centers" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                  />
                )}
              />
              <Controller
                name="locationIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={locations}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    value={locations.filter(loc => field.value?.includes(loc.id))}
                    onChange={(e, newValue) => field.onChange(newValue.map(v => v.id))}
                    renderInput={(params) => (
                      <TextField {...params} label="Locations" placeholder="Select locations" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                  />
                )}
              />
              <Controller
                name="unitIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={units}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    value={units.filter(unit => field.value?.includes(unit.id))}
                    onChange={(e, newValue) => field.onChange(newValue.map(v => v.id))}
                    renderInput={(params) => (
                      <TextField {...params} label="Units" placeholder="Select units" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
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


