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

export default function PFGroupsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: groupsData, isLoading, error: groupsError } = useQuery(
    'pfGroups',
    () => statutoryService.getPFGroups(),
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
      accountGroupEstNo: '',
      accountGroupNo: '',
      dbfFileExtn: '',
      dbfFileCode: '',
      accNo02Percent: 0,
      accNo21Percent: 0,
      accNo22Percent: 0
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createPFGroup(data),
    {
      onSuccess: () => {
        toast.success('PF Group created successfully');
        queryClient.invalidateQueries('pfGroups');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create PF group');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updatePFGroup(id, data),
    {
      onSuccess: () => {
        toast.success('PF Group updated successfully');
        queryClient.invalidateQueries('pfGroups');
        setDialogOpen(false);
        reset();
        setSelectedGroup(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update PF group');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deletePFGroup(id),
    {
      onSuccess: () => {
        toast.success('PF Group deleted successfully');
        queryClient.invalidateQueries('pfGroups');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete PF group');
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
    if (window.confirm(`Are you sure you want to delete PF group "${group.groupName}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const groups = groupsData?.data || [];

  const columns = [
    { field: 'groupName', header: 'Group Name', minWidth: 200 },
    { field: 'responsiblePerson', header: 'Responsible Person', minWidth: 150 },
    { field: 'accountGroupNo', header: 'Account Group No.', minWidth: 150 },
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
        <Typography variant="h6">PF Groups</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add PF Group
        </Button>
      </Box>

      {groupsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading PF groups: {groupsError?.response?.data?.message || groupsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !groupsError && groups.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No PF groups found. Add your first PF group to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !groupsError && groups.length > 0 && (
        <DataTable
          columns={columns}
          data={groups}
          loading={isLoading}
          searchable
          searchPlaceholder="Search PF groups..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit PF Group' : 'Add New PF Group'}</DialogTitle>
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="accountGroupEstNo"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Account Group Est. No." fullWidth />
                  )}
                />
                <Controller
                  name="accountGroupNo"
                  control={control}
                  rules={{ required: 'Account group no. is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Account Group No."
                      fullWidth
                      error={!!errors.accountGroupNo}
                      helperText={errors.accountGroupNo?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="dbfFileCode"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="DBF File Code" fullWidth />
                  )}
                />
                <Controller
                  name="dbfFileExtn"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="DBF File Extn" fullWidth />
                  )}
                />
              </Box>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Admin Charge Percentages</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="accNo02Percent"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Acc. No. 02 (%)"
                      type="number"
                      fullWidth
                      value={field.value || 0}
                    />
                  )}
                />
                <Controller
                  name="accNo21Percent"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Acc. No. 21 (%)"
                      type="number"
                      fullWidth
                      value={field.value || 0}
                    />
                  )}
                />
                <Controller
                  name="accNo22Percent"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Acc. No. 22 (%)"
                      type="number"
                      fullWidth
                      value={field.value || 0}
                    />
                  )}
                />
              </Box>
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


