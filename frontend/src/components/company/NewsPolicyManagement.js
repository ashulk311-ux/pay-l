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
  MenuItem,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { newsPolicyService } from '../../services/newsPolicyService';
import DataTable from '../DataTable';

export default function NewsPolicyManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data: itemsData, isLoading, error: itemsError } = useQuery('newsPolicies', () => newsPolicyService.getAll(), {
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: 'news',
      title: '',
      content: '',
      priority: 'medium',
      targetAudience: 'all',
      sendNotification: true,
      isActive: true
    }
  });

  const sendNotification = watch('sendNotification');

  const createMutation = useMutation(
    (data) => newsPolicyService.create(data),
    {
      onSuccess: () => {
        toast.success('News/Policy created successfully');
        queryClient.invalidateQueries('newsPolicies');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create news/policy');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => newsPolicyService.update(id, data),
    {
      onSuccess: () => {
        toast.success('News/Policy updated successfully');
        queryClient.invalidateQueries('newsPolicies');
        setDialogOpen(false);
        reset();
        setSelectedItem(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update news/policy');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => newsPolicyService.delete(id),
    {
      onSuccess: () => {
        toast.success('News/Policy deleted successfully');
        queryClient.invalidateQueries('newsPolicies');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete news/policy');
      }
    }
  );

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setIsEdit(true);
      reset(item);
    } else {
      setSelectedItem(null);
      setIsEdit(false);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
    setSelectedItem(null);
    setIsEdit(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: selectedItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const items = itemsData?.data || [];

  const columns = [
    { field: 'title', header: 'Title', minWidth: 200 },
    { field: 'type', header: 'Type', minWidth: 100 },
    {
      field: 'priority',
      header: 'Priority',
      minWidth: 100,
      render: (value) => (
        <Chip
          label={value || 'N/A'}
          color={value === 'urgent' ? 'error' : value === 'high' ? 'warning' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'isActive',
      header: 'Status',
      minWidth: 100,
      render: (value) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    },
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
        <Typography variant="h6">News & Policies</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add News/Policy
        </Button>
      </Box>

      {itemsError && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error">
            Error loading news/policies: {itemsError?.response?.data?.message || itemsError?.message || 'Unknown error'}
          </Typography>
        </Box>
      )}
      {!isLoading && !itemsError && items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No news/policies found. Add your first item to get started.
          </Typography>
        </Box>
      )}
      {!isLoading && !itemsError && items.length > 0 && (
        <DataTable
          columns={columns}
          data={items}
          loading={isLoading}
          searchable
          searchPlaceholder="Search news/policies..."
        />
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit News/Policy' : 'Add New News/Policy'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Type</InputLabel>
                      <Select {...field} label="Type">
                        <MenuItem value="news">News</MenuItem>
                        <MenuItem value="policy">Policy</MenuItem>
                        <MenuItem value="announcement">Announcement</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select {...field} label="Priority">
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
              <Controller
                name="content"
                control={control}
                rules={{ required: 'Content is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Content"
                    fullWidth
                    multiline
                    rows={10}
                    error={!!errors.content}
                    helperText={errors.content?.message || 'Supports HTML formatting'}
                  />
                )}
              />
              <Controller
                name="targetAudience"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Target Audience</InputLabel>
                    <Select {...field} label="Target Audience">
                      <MenuItem value="all">All Employees</MenuItem>
                      <MenuItem value="department">Department</MenuItem>
                      <MenuItem value="branch">Branch</MenuItem>
                      <MenuItem value="designation">Designation</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="sendNotification"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Send Push Notification"
                    />
                  )}
                />
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {isEdit ? 'Update' : 'Publish'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

