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
import { gradeService } from '../../services/gradeService';
import DataTable from '../DataTable';

export default function GradeManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: gradesData, isLoading, error: gradesError } = useQuery('grades', () => gradeService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      level: 1
    }
  });

  const createMutation = useMutation(
    (data) => gradeService.create(data),
    {
      onSuccess: () => {
        toast.success('Grade created successfully');
        queryClient.invalidateQueries('grades');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create grade');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => gradeService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Grade updated successfully');
        queryClient.invalidateQueries('grades');
        setDialogOpen(false);
        reset();
        setSelectedGrade(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update grade');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => gradeService.delete(id),
    {
      onSuccess: () => {
        toast.success('Grade deleted successfully');
        queryClient.invalidateQueries('grades');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete grade');
      }
    }
  );

  const handleOpenDialog = (grade = null) => {
    if (grade) {
      setSelectedGrade(grade);
      setIsEdit(true);
      reset(grade);
    } else {
      setSelectedGrade(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedGrade(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedGrade.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (grade) => {
    if (window.confirm(`Are you sure you want to delete grade "${grade.name}"?`)) {
      deleteMutation.mutate(grade.id);
    }
  };

  const grades = gradesData?.data || [];

  const columns = [
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'name', header: 'Name', minWidth: 200 },
    { field: 'level', header: 'Level', minWidth: 80 },
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
        <Typography variant="h6">Grades</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Grade
        </Button>
      </Box>

      {gradesError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading grades: {gradesError?.response?.data?.message || gradesError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !gradesError && grades.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No grades found. Add your first grade to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !gradesError && grades.length > 0 && (
        <DataTable
          columns={columns}
          data={grades}
          loading={isLoading}
          searchable
          searchPlaceholder="Search grades..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
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
                      label="Grade Code"
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
                      label="Grade Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="level"
                control={control}
                rules={{ required: 'Level is required', min: { value: 1, message: 'Must be at least 1' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Level"
                    type="number"
                    fullWidth
                    error={!!errors.level}
                    helperText={errors.level?.message}
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


