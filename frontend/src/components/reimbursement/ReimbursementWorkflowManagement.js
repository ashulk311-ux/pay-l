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

export default function ReimbursementWorkflowManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: configsData, isLoading } = useQuery(
    'reimbursementWorkflowConfigs',
    () => reimbursementMasterService.getWorkflowConfigs(),
    { refetchOnWindowFocus: false }
  );

  const { data: categoriesData } = useQuery(
    'reimbursementCategories',
    () => reimbursementMasterService.getCategories(),
    { enabled: false }
  );

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      categoryId: '',
      level: 1,
      approverType: 'role',
      approverId: '',
      roleId: '',
      minAmount: 0,
      maxAmount: ''
    }
  });

  const approverType = watch('approverType');

  const createMutation = useMutation(
    (data) => reimbursementMasterService.createWorkflowConfig(data),
    {
      onSuccess: () => {
        toast.success('Workflow config created successfully');
        queryClient.invalidateQueries('reimbursementWorkflowConfigs');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create workflow config');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => reimbursementMasterService.updateWorkflowConfig(id, data),
    {
      onSuccess: () => {
        toast.success('Workflow config updated successfully');
        queryClient.invalidateQueries('reimbursementWorkflowConfigs');
        setDialogOpen(false);
        reset();
        setSelectedConfig(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update workflow config');
      }
    }
  );

  const handleOpenDialog = (config = null) => {
    if (config) {
      setSelectedConfig(config);
      setIsEdit(true);
      reset(config);
    } else {
      setSelectedConfig(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedConfig(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const configs = configsData?.data || [];
  const categories = categoriesData?.data || [];

  const columns = [
    {
      id: 'category',
      label: 'Category',
      minWidth: 150,
      format: (value, row) => row.category?.name || 'All Categories'
    },
    { id: 'level', label: 'Level', minWidth: 80 },
    {
      id: 'approverType',
      label: 'Approver Type',
      minWidth: 120
    },
    {
      id: 'minAmount',
      label: 'Min Amount',
      minWidth: 120,
      format: (value) => value ? `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'
    },
    {
      id: 'maxAmount',
      label: 'Max Amount',
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
        <Typography variant="h6">Reimbursement Workflow Configuration</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Workflow Level
        </Button>
      </Box>

      <DataTable columns={columns} data={configs} loading={isLoading} searchable searchPlaceholder="Search workflow configs..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Workflow Config' : 'Add Workflow Config'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Category (Leave empty for all)" fullWidth>
                    <MenuItem value="">All Categories</MenuItem>
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
                    name="level"
                    control={control}
                    rules={{ required: 'Level is required' }}
                    render={({ field }) => (
                      <TextField {...field} label="Level" type="number" fullWidth required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="approverType"
                    control={control}
                    rules={{ required: 'Approver type is required' }}
                    render={({ field }) => (
                      <TextField {...field} select label="Approver Type" fullWidth required>
                        <MenuItem value="role">Role</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="department_head">Department Head</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                {approverType === 'role' && (
                  <Grid item xs={12}>
                    <Controller
                      name="roleId"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Role ID" fullWidth />
                      )}
                    />
                  </Grid>
                )}
                {approverType === 'user' && (
                  <Grid item xs={12}>
                    <Controller
                      name="approverId"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="User ID" fullWidth />
                      )}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="minAmount"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Min Amount" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxAmount"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Amount" type="number" step="0.01" fullWidth />
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



