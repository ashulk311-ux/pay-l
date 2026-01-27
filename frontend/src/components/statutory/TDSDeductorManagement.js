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
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { statutoryService } from '../../services/statutoryService';
import DataTable from '../DataTable';

export default function TDSDeductorManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeductor, setSelectedDeductor] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: deductorsData, isLoading, error: deductorsError } = useQuery(
    'tdsDeductors',
    () => statutoryService.getTDSDeductors(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      branchDivision: '',
      flatDoorBlockNo: '',
      buildingName: '',
      streetRoadName: '',
      area: '',
      state: '',
      city: '',
      pinCode: '',
      telephone: '',
      email: '',
      responsiblePersonName: '',
      responsiblePersonDesignation: '',
      responsiblePersonSex: 'Male',
      responsiblePersonTelephone: '',
      responsiblePersonMobileNo: '',
      responsiblePersonEmail: '',
      financialYear: '',
      assessmentYear: '',
      deductionFor: 'Non Companies',
      tanNumber: '',
      status: 'Company'
    }
  });

  const createMutation = useMutation(
    (data) => statutoryService.createTDSDeductor(data),
    {
      onSuccess: () => {
        toast.success('TDS Deductor created successfully');
        queryClient.invalidateQueries('tdsDeductors');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create TDS deductor');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => statutoryService.updateTDSDeductor(id, data),
    {
      onSuccess: () => {
        toast.success('TDS Deductor updated successfully');
        queryClient.invalidateQueries('tdsDeductors');
        setDialogOpen(false);
        reset();
        setSelectedDeductor(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update TDS deductor');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => statutoryService.deleteTDSDeductor(id),
    {
      onSuccess: () => {
        toast.success('TDS Deductor deleted successfully');
        queryClient.invalidateQueries('tdsDeductors');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete TDS deductor');
      }
    }
  );

  const handleOpenDialog = (deductor = null) => {
    if (deductor) {
      setSelectedDeductor(deductor);
      setIsEdit(true);
      reset(deductor);
    } else {
      setSelectedDeductor(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedDeductor(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedDeductor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (deductor) => {
    if (window.confirm(`Are you sure you want to delete TDS deductor "${deductor.name}"?`)) {
      deleteMutation.mutate(deductor.id);
    }
  };

  const deductors = deductorsData?.data || [];

  const columns = [
    { field: 'name', header: 'Name', minWidth: 200 },
    { field: 'tanNumber', header: 'TAN Number', minWidth: 150 },
    { field: 'state', header: 'State', minWidth: 120 },
    { field: 'city', header: 'City', minWidth: 120 },
    { field: 'status', header: 'Status', minWidth: 120 },
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
        <Typography variant="h6">TDS Deductor Configuration</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add TDS Deductor
        </Button>
      </Box>

      {deductorsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading TDS deductors: {deductorsError?.response?.data?.message || deductorsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !deductorsError && deductors.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No TDS deductors found. Add your first TDS deductor to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !deductorsError && deductors.length > 0 && (
        <DataTable
          columns={columns}
          data={deductors}
          loading={isLoading}
          searchable
          searchPlaceholder="Search TDS deductors..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit TDS Deductor' : 'Add New TDS Deductor'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, maxHeight: '70vh', overflowY: 'auto' }}>
              <Typography variant="h6">Deductor Details</Typography>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="branchDivision"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Branch/Division" fullWidth />
                  )}
                />
                <Controller
                  name="flatDoorBlockNo"
                  control={control}
                  rules={{ required: 'Flat/Door/Block No. is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Flat/Door/Block No."
                      fullWidth
                      error={!!errors.flatDoorBlockNo}
                      helperText={errors.flatDoorBlockNo?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="buildingName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Building Name" fullWidth />
                  )}
                />
                <Controller
                  name="streetRoadName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Street/Road Name" fullWidth />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="area"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Area" fullWidth />
                  )}
                />
                <Controller
                  name="state"
                  control={control}
                  rules={{ required: 'State is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="State"
                      fullWidth
                      error={!!errors.state}
                      helperText={errors.state?.message}
                    />
                  )}
                />
                <Controller
                  name="city"
                  control={control}
                  rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City"
                      fullWidth
                      error={!!errors.city}
                      helperText={errors.city?.message}
                    />
                  )}
                />
                <Controller
                  name="pinCode"
                  control={control}
                  rules={{ required: 'Pin Code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Pin Code"
                      fullWidth
                      error={!!errors.pinCode}
                      helperText={errors.pinCode?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="telephone"
                  control={control}
                  rules={{ required: 'Telephone is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telephone"
                      fullWidth
                      error={!!errors.telephone}
                      helperText={errors.telephone?.message}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  rules={{ required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">Responsible Person Details</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="responsiblePersonName"
                  control={control}
                  rules={{ required: 'Responsible person name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name"
                      fullWidth
                      error={!!errors.responsiblePersonName}
                      helperText={errors.responsiblePersonName?.message}
                    />
                  )}
                />
                <Controller
                  name="responsiblePersonDesignation"
                  control={control}
                  rules={{ required: 'Designation is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Designation"
                      fullWidth
                      error={!!errors.responsiblePersonDesignation}
                      helperText={errors.responsiblePersonDesignation?.message}
                    />
                  )}
                />
                <Controller
                  name="responsiblePersonSex"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Sex</InputLabel>
                      <Select {...field} label="Sex">
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="responsiblePersonTelephone"
                  control={control}
                  rules={{ required: 'Telephone is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telephone"
                      fullWidth
                      error={!!errors.responsiblePersonTelephone}
                      helperText={errors.responsiblePersonTelephone?.message}
                    />
                  )}
                />
                <Controller
                  name="responsiblePersonMobileNo"
                  control={control}
                  rules={{ required: 'Mobile No. is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Mobile No."
                      fullWidth
                      error={!!errors.responsiblePersonMobileNo}
                      helperText={errors.responsiblePersonMobileNo?.message}
                    />
                  )}
                />
                <Controller
                  name="responsiblePersonEmail"
                  control={control}
                  rules={{ required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.responsiblePersonEmail}
                      helperText={errors.responsiblePersonEmail?.message}
                    />
                  )}
                />
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">Other Details</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="financialYear"
                  control={control}
                  rules={{ required: 'Financial Year is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Financial Year"
                      fullWidth
                      error={!!errors.financialYear}
                      helperText={errors.financialYear?.message}
                    />
                  )}
                />
                <Controller
                  name="assessmentYear"
                  control={control}
                  rules={{ required: 'Assessment Year is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Assessment Year"
                      fullWidth
                      error={!!errors.assessmentYear}
                      helperText={errors.assessmentYear?.message}
                    />
                  )}
                />
                <Controller
                  name="deductionFor"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Deduction For</InputLabel>
                      <Select {...field} label="Deduction For">
                        <MenuItem value="Companies">Companies</MenuItem>
                        <MenuItem value="Non Companies">Non Companies</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="tanNumber"
                  control={control}
                  rules={{ required: 'TAN Number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="TAN Number"
                      fullWidth
                      error={!!errors.tanNumber}
                      helperText={errors.tanNumber?.message}
                    />
                  )}
                />
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: 'Status is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="Company">Company</MenuItem>
                        <MenuItem value="Central Government">Central Government</MenuItem>
                        <MenuItem value="State Government">State Government</MenuItem>
                        <MenuItem value="Firm">Firm</MenuItem>
                        <MenuItem value="Individual/HUF">Individual/HUF</MenuItem>
                      </Select>
                    </FormControl>
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


