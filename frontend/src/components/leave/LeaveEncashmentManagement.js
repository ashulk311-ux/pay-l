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
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { leaveMasterService } from '../../services/leaveMasterService';
import DataTable from '../DataTable';

export default function LeaveEncashmentManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: rulesData, isLoading } = useQuery(
    'encashmentRules',
    () => leaveMasterService.getEncashmentRules(),
    { refetchOnWindowFocus: false }
  );

  const { data: leaveTypesData } = useQuery(
    'leaveTypes',
    () => leaveMasterService.getLeaveTypes(),
    { enabled: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      leaveTypeId: '',
      minBalance: 0,
      maxEncashableDays: null,
      encashmentRate: 100,
      calculationMethod: 'basic',
      isEnabled: false
    }
  });

  const createMutation = useMutation(
    (data) => leaveMasterService.createEncashmentRule(data),
    {
      onSuccess: () => {
        toast.success('Encashment rule created successfully');
        queryClient.invalidateQueries('encashmentRules');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create encashment rule');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => leaveMasterService.updateEncashmentRule(id, data),
    {
      onSuccess: () => {
        toast.success('Encashment rule updated successfully');
        queryClient.invalidateQueries('encashmentRules');
        setDialogOpen(false);
        reset();
        setSelectedRule(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update encashment rule');
      }
    }
  );

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setSelectedRule(rule);
      setIsEdit(true);
      reset({
        leaveTypeId: rule.leaveTypeId,
        minBalance: rule.minBalance,
        maxEncashableDays: rule.maxEncashableDays,
        encashmentRate: rule.encashmentRate,
        calculationMethod: rule.calculationMethod,
        isEnabled: rule.isEnabled
      });
    } else {
      setSelectedRule(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedRule(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const rules = rulesData?.data || [];
  const leaveTypes = leaveTypesData?.data || [];

  const columns = [
    {
      id: 'leaveType',
      label: 'Leave Type',
      minWidth: 150,
      format: (value, row) => row.leaveType?.name || '-'
    },
    {
      id: 'minBalance',
      label: 'Min Balance',
      minWidth: 100,
      format: (value) => value?.toFixed(2) || '0.00'
    },
    {
      id: 'maxEncashableDays',
      label: 'Max Encashable',
      minWidth: 120,
      format: (value) => value?.toFixed(2) || 'Unlimited'
    },
    {
      id: 'encashmentRate',
      label: 'Rate (%)',
      minWidth: 100,
      format: (value) => `${value || 100}%`
    },
    {
      id: 'calculationMethod',
      label: 'Calculation',
      minWidth: 120
    },
    {
      id: 'isEnabled',
      label: 'Enabled',
      minWidth: 100,
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
        <Typography variant="h6">Leave Encashment Rules</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Encashment Rule
        </Button>
      </Box>

      <DataTable columns={columns} data={rules} loading={isLoading} searchable searchPlaceholder="Search encashment rules..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Encashment Rule' : 'Add Encashment Rule'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="leaveTypeId"
                control={control}
                rules={{ required: 'Leave type is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Leave Type" fullWidth required>
                    {leaveTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="minBalance"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Minimum Balance Required" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxEncashableDays"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Max Encashable Days" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="encashmentRate"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Encashment Rate (%)" type="number" step="0.01" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="calculationMethod"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label="Calculation Method" fullWidth>
                        <MenuItem value="basic">Basic Salary</MenuItem>
                        <MenuItem value="gross">Gross Salary</MenuItem>
                        <MenuItem value="ctc">CTC</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="isEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Enable Encashment" />
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



