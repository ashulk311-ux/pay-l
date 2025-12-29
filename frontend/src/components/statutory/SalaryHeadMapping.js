import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Typography, MenuItem, Chip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { salaryHeadMappingService } from '../../services/salaryHeadMappingService';
import DataTable from '../DataTable';

export default function SalaryHeadMapping({ company }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: mappingsData, isLoading } = useQuery(
    'salaryHeadMappings',
    () => salaryHeadMappingService.getAll(),
    { refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      salaryHeadCode: '',
      salaryHeadName: '',
      category: 'earning',
      statutoryType: 'NONE',
      isTaxable: true,
      isPartOfGross: true,
      isPartOfBasic: false,
      displayOrder: 0
    }
  });

  const createMutation = useMutation(
    (data) => salaryHeadMappingService.create(data),
    {
      onSuccess: () => {
        toast.success('Salary head mapping created successfully');
        queryClient.invalidateQueries('salaryHeadMappings');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create salary head mapping');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => salaryHeadMappingService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Salary head mapping updated successfully');
        queryClient.invalidateQueries('salaryHeadMappings');
        setDialogOpen(false);
        reset();
        setSelectedMapping(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update salary head mapping');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => salaryHeadMappingService.delete(id),
    {
      onSuccess: () => {
        toast.success('Salary head mapping deleted successfully');
        queryClient.invalidateQueries('salaryHeadMappings');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete salary head mapping');
      }
    }
  );

  const handleOpenDialog = (mapping = null) => {
    if (mapping) {
      setSelectedMapping(mapping);
      setIsEdit(true);
      reset(mapping);
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
    if (window.confirm(`Are you sure you want to delete salary head "${mapping.salaryHeadName}"?`)) {
      deleteMutation.mutate(mapping.id);
    }
  };

  const mappings = mappingsData?.data || [];

  const columns = [
    { id: 'salaryHeadCode', label: 'Code', minWidth: 100 },
    { id: 'salaryHeadName', label: 'Name', minWidth: 150 },
    {
      id: 'category',
      label: 'Category',
      minWidth: 100,
      format: (value) => <Chip label={value} size="small" color={value === 'earning' ? 'success' : value === 'deduction' ? 'error' : 'info'} />
    },
    { id: 'statutoryType', label: 'Statutory Type', minWidth: 100 },
    {
      id: 'isTaxable',
      label: 'Taxable',
      minWidth: 80,
      format: (value) => (value ? 'Yes' : 'No')
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
        <Typography variant="h6">Salary Head Mapping</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Salary Head
        </Button>
      </Box>

      <DataTable columns={columns} data={mappings} loading={isLoading} searchable searchPlaceholder="Search salary heads..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Salary Head Mapping' : 'Add Salary Head Mapping'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="salaryHeadCode"
                control={control}
                rules={{ required: 'Code is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Salary Head Code" fullWidth required />
                )}
              />
              <Controller
                name="salaryHeadName"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Salary Head Name" fullWidth required />
                )}
              />
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Category" fullWidth>
                    <MenuItem value="earning">Earning</MenuItem>
                    <MenuItem value="deduction">Deduction</MenuItem>
                    <MenuItem value="statutory">Statutory</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="statutoryType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Statutory Type" fullWidth>
                    <MenuItem value="NONE">None</MenuItem>
                    <MenuItem value="PF">PF</MenuItem>
                    <MenuItem value="ESI">ESI</MenuItem>
                    <MenuItem value="PT">PT</MenuItem>
                    <MenuItem value="LWF">LWF</MenuItem>
                    <MenuItem value="TDS">TDS</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="displayOrder"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Display Order" type="number" fullWidth />
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



