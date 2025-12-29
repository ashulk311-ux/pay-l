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
  Grid,
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import { stateService } from '../../services/stateService';
import DataTable from '../DataTable';

export default function LWFSlabsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: slabsData, isLoading, error: slabsError } = useQuery(
    'lwfSlabs',
    () => statutoryService.getLWFSlabs(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { data: statesData } = useQuery('states', () => stateService.getAll());

  const defaultMonthlyAmounts = {
    apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
    oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      state: '',
      deductionBasis: 'fixed',
      employeeMonthlyAmounts: defaultMonthlyAmounts,
      employerMonthlyAmounts: defaultMonthlyAmounts
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createLWFSlab(data),
    {
      onSuccess: () => {
        toast.success('LWF Slab created successfully');
        queryClient.invalidateQueries('lwfSlabs');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create LWF slab');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateLWFSlab(id, data),
    {
      onSuccess: () => {
        toast.success('LWF Slab updated successfully');
        queryClient.invalidateQueries('lwfSlabs');
        setDialogOpen(false);
        reset();
        setSelectedSlab(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update LWF slab');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteLWFSlab(id),
    {
      onSuccess: () => {
        toast.success('LWF Slab deleted successfully');
        queryClient.invalidateQueries('lwfSlabs');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete LWF slab');
      }
    }
  );

  const handleOpenDialog = (slab = null) => {
    if (slab) {
      setSelectedSlab(slab);
      setIsEdit(true);
      reset({
        ...slab,
        employeeMonthlyAmounts: slab.employeeMonthlyAmounts || defaultMonthlyAmounts,
        employerMonthlyAmounts: slab.employerMonthlyAmounts || defaultMonthlyAmounts
      });
    } else {
      setSelectedSlab(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedSlab(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedSlab.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (slab) => {
    if (window.confirm(`Are you sure you want to delete this LWF slab?`)) {
      deleteMutation.mutate(slab.id);
    }
  };

  const slabs = slabsData?.data || [];
  const states = statesData?.data || [];

  const months = [
    { key: 'apr', label: 'April' },
    { key: 'may', label: 'May' },
    { key: 'jun', label: 'June' },
    { key: 'jul', label: 'July' },
    { key: 'aug', label: 'August' },
    { key: 'sep', label: 'September' },
    { key: 'oct', label: 'October' },
    { key: 'nov', label: 'November' },
    { key: 'dec', label: 'December' },
    { key: 'jan', label: 'January' },
    { key: 'feb', label: 'February' },
    { key: 'mar', label: 'March' }
  ];

  const columns = [
    { field: 'state', header: 'State', minWidth: 150 },
    { field: 'deductionBasis', header: 'Deduction Basis', minWidth: 120, render: (value) => value?.toUpperCase() },
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
        <Typography variant="h6">Labour Welfare Fund Slabs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add LWF Slab
        </Button>
      </Box>

      {slabsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading LWF slabs: {slabsError?.response?.data?.message || slabsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !slabsError && slabs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No LWF slabs found. Add your first slab to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !slabsError && slabs.length > 0 && (
        <DataTable
          columns={columns}
          data={slabs}
          loading={isLoading}
          searchable
          searchPlaceholder="Search slabs..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit LWF Slab' : 'Add New LWF Slab'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="state"
                  control={control}
                  rules={{ required: 'State is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.state}>
                      <InputLabel>State</InputLabel>
                      <Select {...field} label="State">
                        {states.map((state) => (
                          <MenuItem key={state.id} value={state.description}>
                            {state.description}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="deductionBasis"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Deduction Basis</InputLabel>
                      <Select {...field} label="Deduction Basis">
                        <MenuItem value="fixed">Fixed</MenuItem>
                        <MenuItem value="rate">Rate</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Employee Contribution (Apr - Mar)</Typography>
              <Grid container spacing={2}>
                {months.map((month) => (
                  <Grid item xs={6} sm={4} md={3} key={month.key}>
                    <Controller
                      name={`employeeMonthlyAmounts.${month.key}`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={month.label}
                          type="number"
                          fullWidth
                          size="small"
                          value={field.value || 0}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Employer Contribution (Apr - Mar)</Typography>
              <Grid container spacing={2}>
                {months.map((month) => (
                  <Grid item xs={6} sm={4} md={3} key={month.key}>
                    <Controller
                      name={`employerMonthlyAmounts.${month.key}`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={month.label}
                          type="number"
                          fullWidth
                          size="small"
                          value={field.value || 0}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
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


