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
  Typography
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import DataTable from '../DataTable';

export default function ESIGroupsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: groupsData, isLoading, error: groupsError } = useQuery(
    'esiGroups',
    () => statutoryService.getESIGroups(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      groupName: '',
      responsiblePerson: '',
      address: '',
      esiNo: '',
      esiLocalOffice: ''
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createESIGroup(data),
    {
      onSuccess: () => {
        toast.success('ESI Group created successfully');
        queryClient.invalidateQueries('esiGroups');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create ESI group');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateESIGroup(id, data),
    {
      onSuccess: () => {
        toast.success('ESI Group updated successfully');
        queryClient.invalidateQueries('esiGroups');
        setDialogOpen(false);
        reset();
        setSelectedGroup(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update ESI group');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteESIGroup(id),
    {
      onSuccess: () => {
        toast.success('ESI Group deleted successfully');
        queryClient.invalidateQueries('esiGroups');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete ESI group');
      }
    }
  );

  const handleOpenDialog = (group = null) => {
    if (group) {
      setSelectedGroup(group);
      setIsEdit(true);
      reset(group);
    } else {
      setSelectedGroup(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedGroup(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (group) => {
    if (window.confirm(`Are you sure you want to delete ESI group "${group.groupName}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const groups = groupsData?.data || [];

  const columns = [
    { field: 'groupName', header: 'Group Name', minWidth: 200 },
    { field: 'responsiblePerson', header: 'Responsible Person', minWidth: 150 },
    { field: 'esiNo', header: 'ESI No.', minWidth: 150 },
    { field: 'esiLocalOffice', header: 'ESI Local Office', minWidth: 150 },
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
        <Typography variant="h6">ESI Groups</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add ESI Group
        </Button>
      </Box>

      {groupsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading ESI groups: {groupsError?.response?.data?.message || groupsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !groupsError && groups.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No ESI groups found. Add your first ESI group to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !groupsError && groups.length > 0 && (
        <DataTable
          columns={columns}
          data={groups}
          loading={isLoading}
          searchable
          searchPlaceholder="Search ESI groups..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit ESI Group' : 'Add New ESI Group'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="groupName"
                control={control}
                rules={{ required: 'Group name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Group Name"
                    fullWidth
                    error={!!errors.groupName}
                    helperText={errors.groupName?.message}
                  />
                )}
              />
              <Controller
                name="responsiblePerson"
                control={control}
                rules={{ required: 'Responsible person is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Responsible Person"
                    fullWidth
                    error={!!errors.responsiblePerson}
                    helperText={errors.responsiblePerson?.message}
                  />
                )}
              />
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Address is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
              <Controller
                name="esiNo"
                control={control}
                rules={{ required: 'ESI No. is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ESI No."
                    fullWidth
                    error={!!errors.esiNo}
                    helperText={errors.esiNo?.message}
                  />
                )}
              />
              <Controller
                name="esiLocalOffice"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="ESI Local Office" fullWidth />
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


