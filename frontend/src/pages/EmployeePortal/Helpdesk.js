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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import { portalService } from '../../services/portalService';
import DataTable from '../../components/DataTable';

export default function Helpdesk() {
  const queryClient = useQueryClient();
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm();

  const { data: queriesData, isLoading } = useQuery(
    'helpdeskQueries',
    () => portalService.getQueries(),
    { refetchOnWindowFocus: false }
  );

  const queries = queriesData?.data || [];

  const raiseQueryMutation = useMutation(
    (data) => portalService.raiseQuery(data),
    {
      onSuccess: () => {
        toast.success('Query raised successfully. Our team will get back to you soon.');
        queryClient.invalidateQueries('helpdeskQueries');
        setQueryDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to raise query');
      }
    }
  );

  const onSubmit = (data) => {
    raiseQueryMutation.mutate(data);
  };

  const columns = [
    { field: 'ticketId', header: 'Ticket ID' },
    { field: 'subject', header: 'Subject' },
    {
      field: 'category',
      header: 'Category',
      render: (value) => <Chip label={value} size="small" />
    },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        open: 'warning',
        'in-progress': 'info',
        resolved: 'success',
        closed: 'default'
      }
    },
    { field: 'createdAt', header: 'Created At', format: 'date' },
    { field: 'updatedAt', header: 'Last Updated', format: 'date' }
  ];

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Helpdesk / Query</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setQueryDialogOpen(true)}
        >
          Raise Query
        </Button>
      </Box>

      {queries.length > 0 ? (
        <DataTable
          columns={columns}
          data={queries}
          loading={isLoading}
          searchable
        />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No queries raised yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click "Raise Query" to submit a new query or request
          </Typography>
        </Paper>
      )}

      <Dialog open={queryDialogOpen} onClose={() => setQueryDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Raise Query / Request</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <Select {...field} label="Category">
                      <MenuItem value="payroll">Payroll</MenuItem>
                      <MenuItem value="attendance">Attendance</MenuItem>
                      <MenuItem value="leave">Leave</MenuItem>
                      <MenuItem value="salary">Salary</MenuItem>
                      <MenuItem value="profile">Profile Update</MenuItem>
                      <MenuItem value="technical">Technical Issue</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  )}
                />
                {errors.category && (
                  <Typography variant="caption" color="error">{errors.category.message}</Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                label="Subject"
                {...register('subject', { required: 'Subject is required' })}
                sx={{ mb: 2 }}
                error={!!errors.subject}
                helperText={errors.subject?.message}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={6}
                {...register('description', { required: 'Description is required' })}
                sx={{ mb: 2 }}
                error={!!errors.description}
                helperText={errors.description?.message}
                placeholder="Please provide detailed information about your query or request..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQueryDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={raiseQueryMutation.isLoading}>
              Submit Query
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

