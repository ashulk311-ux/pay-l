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

export default function PTGroupsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: groupsData, isLoading, error: groupsError } = useQuery(
    'ptGroups',
    () => statutoryService.getPTGroups(),
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
      ptCertificateNumber: '',
      ptoCircleNumber: ''
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createPTGroup(data),
    {
      onSuccess: () => {
        toast.success('PT Group created successfully');
        queryClient.invalidateQueries('ptGroups');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create PT group');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updatePTGroup(id, data),
    {
      onSuccess: () => {
        toast.success('PT Group updated successfully');
        queryClient.invalidateQueries('ptGroups');
        setDialogOpen(false);
        reset();
        setSelectedGroup(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update PT group');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deletePTGroup(id),
    {
      onSuccess: () => {
        toast.success('PT Group deleted successfully');
        queryClient.invalidateQueries('ptGroups');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete PT group');
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
    if (window.confirm(`Are you sure you want to delete PT group "${group.groupName}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const groups = groupsData?.data || [];

  const columns = [
    { field: 'groupName', header: 'Group Name', minWidth: 200 },
    { field: 'responsiblePerson', header: 'Responsible Person', minWidth: 150 },
    { field: 'ptCertificateNumber', header: 'PT Certificate No.', minWidth: 150 },
    { field: 'ptoCircleNumber', header: 'PTO Circle No.', minWidth: 150 },
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
        <Typography variant="h6">PT Groups</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add PT Group
        </Button>
      </Box>

      {groupsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading PT groups: {groupsError?.response?.data?.message || groupsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !groupsError && groups.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No PT groups found. Add your first PT group to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !groupsError && groups.length > 0 && (
        <DataTable
          columns={columns}
          data={groups}
          loading={isLoading}
          searchable
          searchPlaceholder="Search PT groups..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit PT Group' : 'Add New PT Group'}</DialogTitle>
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
                name="ptCertificateNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="PT Certificate Number" fullWidth />
                )}
              />
              <Controller
                name="ptoCircleNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="P.T.O Circle Number" fullWidth />
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


