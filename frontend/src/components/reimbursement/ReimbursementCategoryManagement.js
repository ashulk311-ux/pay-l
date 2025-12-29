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
  FormControlLabel,
  Switch
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { reimbursementMasterService } from '../../services/reimbursementMasterService';
import DataTable from '../DataTable';

export default function ReimbursementCategoryManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: categoriesData, isLoading } = useQuery(
    'reimbursementCategories',
    () => reimbursementMasterService.getCategories(),
    { refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isTaxable: false,
      requiresDocument: true
    }
  });

  const createMutation = useMutation(
    (data) => reimbursementMasterService.createCategory(data),
    {
      onSuccess: () => {
        toast.success('Category created successfully');
        queryClient.invalidateQueries('reimbursementCategories');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create category');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => reimbursementMasterService.updateCategory(id, data),
    {
      onSuccess: () => {
        toast.success('Category updated successfully');
        queryClient.invalidateQueries('reimbursementCategories');
        setDialogOpen(false);
        reset();
        setSelectedCategory(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update category');
      }
    }
  );

  const handleOpenDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setIsEdit(true);
      reset(category);
    } else {
      setSelectedCategory(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedCategory(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const categories = categoriesData?.data || [];

  const columns = [
    { id: 'code', label: 'Code', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 150 },
    {
      id: 'isTaxable',
      label: 'Taxable',
      minWidth: 100,
      format: (value) => (value ? 'Yes' : 'No')
    },
    {
      id: 'requiresDocument',
      label: 'Requires Document',
      minWidth: 150,
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
        <Typography variant="h6">Reimbursement Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Category
        </Button>
      </Box>

      <DataTable columns={columns} data={categories} loading={isLoading} searchable searchPlaceholder="Search categories..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="code"
                control={control}
                rules={{ required: 'Code is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Code" fullWidth required />
                )}
              />
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Name" fullWidth required />
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
                name="isTaxable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Taxable" />
                )}
              />
              <Controller
                name="requiresDocument"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Requires Document" />
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



