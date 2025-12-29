import React, { useState } from 'react';
import {
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
  Typography,
  Grid,
  Chip,
  IconButton,
  Paper,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { reportService } from '../../services/reportService';
import DataTable from '../DataTable';

export default function CustomReportBuilder() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: reportsData } = useQuery('customReports', () => reportService.getCustomReports());

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      reportName: '',
      description: '',
      dataSource: 'payroll',
      format: 'excel'
    }
  });

  const createMutation = useMutation(
    (data) => reportService.createCustomReport(data),
    {
      onSuccess: () => {
        toast.success('Custom report created successfully');
        queryClient.invalidateQueries('customReports');
        reset();
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create custom report');
      }
    }
  );

  const executeMutation = useMutation(
    ({ id, params }) => reportService.executeCustomReport(id, params),
    {
      onSuccess: (response) => {
        toast.success('Custom report executed successfully');
        // Handle download if file is generated
        if (response.data?.downloadUrl) {
          window.open(response.data.downloadUrl, '_blank');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to execute custom report');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => reportService.deleteCustomReport(id),
    {
      onSuccess: () => {
        toast.success('Custom report deleted successfully');
        queryClient.invalidateQueries('customReports');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete custom report');
      }
    }
  );

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleExecute = (report) => {
    executeMutation.mutate({ id: report.id, params: {} });
  };

  const reports = reportsData?.data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Custom Report Builder</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Create Custom Report
        </Button>
      </Box>

      <Paper>
        <List>
          {reports.map((report) => (
            <ListItem key={report.id}>
              <ListItemText
                primary={report.reportName}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {report.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip label={report.dataSource} size="small" />
                      <Chip label={report.format} size="small" />
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleExecute(report)} title="Execute">
                  <PlayArrowIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => deleteMutation.mutate(report.id)} title="Delete">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Create Custom Report</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="reportName"
                  control={control}
                  rules={{ required: 'Report name is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Report Name" fullWidth required />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Description" multiline rows={2} fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="dataSource"
                  control={control}
                  rules={{ required: 'Data source is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth required>
                      <InputLabel>Data Source</InputLabel>
                      <Select {...field}>
                        <MenuItem value="payroll">Payroll</MenuItem>
                        <MenuItem value="employee">Employee</MenuItem>
                        <MenuItem value="attendance">Attendance</MenuItem>
                        <MenuItem value="leave">Leave</MenuItem>
                        <MenuItem value="loan">Loan</MenuItem>
                        <MenuItem value="reimbursement">Reimbursement</MenuItem>
                        <MenuItem value="statutory">Statutory</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="format"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Output Format</InputLabel>
                      <Select {...field}>
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="pdf">PDF</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Note: Advanced filters, columns, grouping, and aggregations can be configured after creation.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}



