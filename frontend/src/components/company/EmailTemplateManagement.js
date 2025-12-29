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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { emailTemplateService } from '../../services/emailTemplateService';
import DataTable from '../DataTable';

export default function EmailTemplateManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: templatesData, isLoading, error: templatesError } = useQuery('emailTemplates', () => emailTemplateService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      type: 'custom',
      name: '',
      subject: '',
      body: '',
      variables: []
    }
  });

  const createMutation = useMutation(
    (data) => emailTemplateService.create(data),
    {
      onSuccess: () => {
        toast.success('Email template created successfully');
        queryClient.invalidateQueries('emailTemplates');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create email template');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => emailTemplateService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Email template updated successfully');
        queryClient.invalidateQueries('emailTemplates');
        setDialogOpen(false);
        reset();
        setSelectedTemplate(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update email template');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => emailTemplateService.delete(id),
    {
      onSuccess: () => {
        toast.success('Email template deleted successfully');
        queryClient.invalidateQueries('emailTemplates');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete email template');
      }
    }
  );

  const handleOpenDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setIsEdit(true);
      reset(template);
    } else {
      setSelectedTemplate(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedTemplate(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (template) => {
    if (window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  const templates = templatesData?.data || [];

  const columns = [
    { field: 'name', header: 'Name', minWidth: 150 },
    { field: 'type', header: 'Type', minWidth: 120 },
    { field: 'subject', header: 'Subject', minWidth: 200 },
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
        <Typography variant="h6">Email Templates</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Template
        </Button>
      </Box>

      {templatesError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading templates: {templatesError?.response?.data?.message || templatesError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !templatesError && templates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No email templates found. Add your first template to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !templatesError && templates.length > 0 && (
        <DataTable
          columns={columns}
          data={templates}
          loading={isLoading}
          searchable
          searchPlaceholder="Search templates..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Email Template' : 'Add New Email Template'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="type"
                control={control}
                rules={{ required: 'Type is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Template Type</InputLabel>
                    <Select {...field} label="Template Type">
                      <MenuItem value="birthday">Birthday</MenuItem>
                      <MenuItem value="anniversary">Anniversary</MenuItem>
                      <MenuItem value="welcome">Welcome</MenuItem>
                      <MenuItem value="payslip">Payslip</MenuItem>
                      <MenuItem value="leave_approval">Leave Approval</MenuItem>
                      <MenuItem value="leave_rejection">Leave Rejection</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Template Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="subject"
                control={control}
                rules={{ required: 'Subject is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Subject"
                    fullWidth
                    error={!!errors.subject}
                    helperText={errors.subject?.message}
                  />
                )}
              />
              <Controller
                name="body"
                control={control}
                rules={{ required: 'Body is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Body"
                    fullWidth
                    multiline
                    rows={10}
                    error={!!errors.body}
                    helperText={errors.body?.message || 'Use {variableName} for dynamic content'}
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

