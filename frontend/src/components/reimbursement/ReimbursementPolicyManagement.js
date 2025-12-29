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
  MenuItem,
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { reimbursementMasterService } from '../../services/reimbursementMasterService';
import DataTable from '../DataTable';

export default function ReimbursementPolicyManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: policiesData, isLoading } = useQuery(
    'reimbursementPolicies',
    () => reimbursementMasterService.getPolicies(),
    { refetchOnWindowFocus: false }
  );

  const { data: categoriesData } = useQuery(
    'reimbursementCategories',
    () => reimbursementMasterService.getCategories(),
    { enabled: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      categoryId: '',
      maxAmountPerRequest: '',
      maxAmountPerMonth: '',
      maxAmountPerYear: '',
      maxRequestsPerMonth: '',
      maxRequestsPerYear: '',
      applicableTo: 'all',
      applicableIds: []
    }
  });

  const createMutation = useMutation(
    (data) => reimbursementMasterService.createPolicy(data),
    {
      onSuccess: () => {
        toast.success('Policy created successfully');
        queryClient.invalidateQueries('reimbursementPolicies');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create policy');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => reimbursementMasterService.updatePolicy(id, data),
    {
      onSuccess: () => {
        toast.success('Policy updated successfully');
        queryClient.invalidateQueries('reimbursementPolicies');
        setDialogOpen(false);
        reset();
        setSelectedPolicy(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update policy');
      }
    }
  );

  const handleOpenDialog = (policy = null) => {
    if (policy) {
      setSelectedPolicy(policy);
      setIsEdit(true);
      reset(policy);
    } else {
      setSelectedPolicy(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedPolicy(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedPolicy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const policies = policiesData?.data || [];
  const categories = categoriesData?.data || [];

  const columns = [
    {
      id: 'category',
      label: 'Category',
      minWidth: 150,
      format: (value, row) => row.category?.name || '-'
    },
    {
      id: 'maxAmountPerRequest',
      label: 'Max/Request',
      minWidth: 120,
      format: (value) => value ? `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'
    },
    {
      id: 'maxAmountPerMonth',
      label: 'Max/Month',
      minWidth: 120,
      format: (value) => value ? `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'
    },
    {
      id: 'maxAmountPerYear',
      label: 'Max/Year',
      minWidth: 120,
      format: (value) => value ? `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'
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
        <Typography variant="h6">Reimbursement Policies</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Policy
        </Button>
      </Box>

      <DataTable columns={columns} data={policies} loading={isLoading} searchable searchPlaceholder="Search policies..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Category" fullWidth required>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxAmountPerRequest"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Amount Per Request" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxAmountPerMonth"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Amount Per Month" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxAmountPerYear"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Amount Per Year" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxRequestsPerMonth"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Requests Per Month" type="number" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxRequestsPerYear"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Requests Per Year" type="number" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="applicableTo"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label="Applicable To" fullWidth>
                        <MenuItem value="all">All Employees</MenuItem>
                        <MenuItem value="department">Department</MenuItem>
                        <MenuItem value="designation">Designation</MenuItem>
                        <MenuItem value="employee">Employee</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
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



