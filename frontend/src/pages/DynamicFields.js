import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
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
import DeleteIcon from '@mui/icons-material/Delete';
import { dynamicFieldService } from '../services/dynamicFieldService';
import DataTable from '../components/DataTable';

export default function DynamicFields() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: fieldsData, isLoading } = useQuery(
    'dynamicFields',
    () => dynamicFieldService.getAll(),
    { refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      fieldCode: '',
      fieldLabel: '',
      fieldType: 'text',
      isRequired: false,
      isMandatory: false,
      options: [],
      validationRules: {},
      displayOrder: 0,
      section: 'extra'
    }
  });

  const fieldType = watch('fieldType');

  const createMutation = useMutation(
    (data) => dynamicFieldService.create(data),
    {
      onSuccess: () => {
        toast.success('Dynamic field created successfully');
        queryClient.invalidateQueries('dynamicFields');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create dynamic field');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => dynamicFieldService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Dynamic field updated successfully');
        queryClient.invalidateQueries('dynamicFields');
        setDialogOpen(false);
        reset();
        setSelectedField(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update dynamic field');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => dynamicFieldService.delete(id),
    {
      onSuccess: () => {
        toast.success('Dynamic field deleted successfully');
        queryClient.invalidateQueries('dynamicFields');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete dynamic field');
      }
    }
  );

  const handleOpenDialog = (field = null) => {
    if (field) {
      setSelectedField(field);
      setIsEdit(true);
      reset(field);
    } else {
      setSelectedField(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedField(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (field) => {
    if (window.confirm(`Are you sure you want to delete field "${field.fieldLabel}"?`)) {
      deleteMutation.mutate(field.id);
    }
  };

  const fields = fieldsData?.data || [];

  const columns = [
    { id: 'fieldCode', label: 'Field Code', minWidth: 120 },
    { id: 'fieldLabel', label: 'Field Label', minWidth: 150 },
    { id: 'fieldType', label: 'Type', minWidth: 100 },
    {
      id: 'isRequired',
      label: 'Required',
      minWidth: 80,
      format: (value) => (value ? 'Yes' : 'No')
    },
    { id: 'section', label: 'Section', minWidth: 100 },
    { id: 'displayOrder', label: 'Order', minWidth: 80 },
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
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dynamic Fields Configuration</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Dynamic Field
        </Button>
      </Box>

      <DataTable columns={columns} data={fields} loading={isLoading} searchable searchPlaceholder="Search fields..." />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Dynamic Field' : 'Add Dynamic Field'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fieldCode"
                    control={control}
                    rules={{ required: 'Field code is required' }}
                    render={({ field }) => (
                      <TextField {...field} label="Field Code" fullWidth required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fieldLabel"
                    control={control}
                    rules={{ required: 'Field label is required' }}
                    render={({ field }) => (
                      <TextField {...field} label="Field Label" fullWidth required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fieldType"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label="Field Type" fullWidth>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                        <MenuItem value="phone">Phone</MenuItem>
                        <MenuItem value="textarea">Textarea</MenuItem>
                        <MenuItem value="select">Select</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="displayOrder"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Display Order" type="number" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="section"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Section" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="isRequired"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Required"
                      />
                    )}
                  />
                </Grid>
                {fieldType === 'select' && (
                  <Grid item xs={12}>
                    <Controller
                      name="options"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Options (JSON array: [{'value': 'val', 'label': 'Label'}])"
                          multiline
                          rows={3}
                          fullWidth
                          helperText="Enter options as JSON array"
                        />
                      )}
                    />
                  </Grid>
                )}
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
    </Container>
  );
}



