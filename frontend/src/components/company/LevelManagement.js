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
import { levelService } from '../../services/levelService';
import DataTable from '../DataTable';

export default function LevelManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: levelsData, isLoading, error: levelsError } = useQuery('levels', () => levelService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      levelNumber: 1
    }
  });

  const createMutation = useMutation(
    (data) => levelService.create(data),
    {
      onSuccess: () => {
        toast.success('Level created successfully');
        queryClient.invalidateQueries('levels');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create level');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => levelService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Level updated successfully');
        queryClient.invalidateQueries('levels');
        setDialogOpen(false);
        reset();
        setSelectedLevel(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update level');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => levelService.delete(id),
    {
      onSuccess: () => {
        toast.success('Level deleted successfully');
        queryClient.invalidateQueries('levels');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete level');
      }
    }
  );

  const handleOpenDialog = (level = null) => {
    if (level) {
      setSelectedLevel(level);
      setIsEdit(true);
      reset(level);
    } else {
      setSelectedLevel(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedLevel(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedLevel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (level) => {
    if (window.confirm(`Are you sure you want to delete level "${level.name}"?`)) {
      deleteMutation.mutate(level.id);
    }
  };

  const levels = levelsData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { field: 'levelNumber', header: 'Level Number', minWidth: 120 },
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
        <Typography variant="h6">Levels</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Level
        </Button>
      </Box>

      {levelsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading levels: {levelsError?.response?.data?.message || levelsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !levelsError && levels.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No levels found. Add your first level to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !levelsError && levels.length > 0 && (
        <DataTable
          columns={columns}
          data={levels}
          loading={isLoading}
          searchable
          searchPlaceholder="Search levels..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Level' : 'Add New Level'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="code"
                  control={control}
                  rules={{ required: 'Code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Level Code"
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
                      label="Level Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="levelNumber"
                control={control}
                rules={{ required: 'Level number is required', min: { value: 1, message: 'Must be at least 1' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Level Number"
                    type="number"
                    fullWidth
                    error={!!errors.levelNumber}
                    helperText={errors.levelNumber?.message}
                  />
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


