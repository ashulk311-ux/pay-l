import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  LinearProgress
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { supplementaryService } from '../services/supplementaryService';
import { employeeService } from '../services/employeeService';
import DataTable from '../components/DataTable';
import FullAndFinalSettlement from '../components/supplementary/FullAndFinalSettlement';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SupplementarySalary() {
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedSupplementary, setSelectedSupplementary] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: supplementaryData, isLoading, error: supplementaryError } = useQuery(
    ['supplementary', tabValue],
    () => {
      // Explicitly pass params based on tab to avoid caching issues
      if (tabValue === 0) {
        return supplementaryService.getAll({ type: 'arrears' });
      } else if (tabValue === 1) {
        return supplementaryService.getAll({ type: 'incentive' });
      } else {
        // 'All' tab (tabValue === 2) - no type filter
        return supplementaryService.getAll();
      }
    },
    { 
      refetchOnWindowFocus: false, 
      retry: 1,
      staleTime: 0, // Always consider data stale to force refetch
      cacheTime: 0 // Don't cache to avoid stale data
    }
  );

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { enabled: false });

  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      employeeId: '',
      type: 'arrears',
      amount: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      description: '',
      effectiveDate: '',
      arrearsFromDate: '',
      arrearsToDate: '',
      incentivePeriod: ''
    }
  });

  const createMutation = useMutation(
    (data) => supplementaryService.create(data),
    {
      onSuccess: () => {
        toast.success('Supplementary salary created successfully');
        queryClient.invalidateQueries('supplementary');
        reset();
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create supplementary salary');
      }
    }
  );

  const importMutation = useMutation(
    (file) => supplementaryService.bulkImport(file),
    {
      onSuccess: (response) => {
        toast.success(`Import completed: ${response.data?.success || 0} records processed`);
        queryClient.invalidateQueries('supplementary');
        setSelectedFile(null);
        setImportDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to import supplementary salaries');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => supplementaryService.delete(id),
    {
      onSuccess: () => {
        toast.success('Supplementary salary deleted successfully');
        queryClient.invalidateQueries('supplementary');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete supplementary salary');
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (supplementary = null) => {
    if (supplementary) {
      setSelectedSupplementary(supplementary);
      reset(supplementary);
    } else {
      setSelectedSupplementary(null);
      reset();
    }
    setDialogOpen(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    importMutation.mutate(selectedFile);
  };

  const handleDelete = (supplementary) => {
    if (window.confirm(`Are you sure you want to delete this ${supplementary.type}?`)) {
      deleteMutation.mutate(supplementary.id);
    }
  };

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  // Handle both direct array and wrapped response
  const supplementary = Array.isArray(supplementaryData) 
    ? supplementaryData 
    : (supplementaryData?.data || []);
  const employees = employeesData?.data || [];
  const type = useWatch({ control, name: 'type' });

  // Debug logging
  React.useEffect(() => {
    if (supplementaryData) {
      console.log('Supplementary data received:', supplementaryData);
      console.log('Supplementary array:', supplementary);
      console.log('Array length:', supplementary.length);
      console.log('Is array?', Array.isArray(supplementary));
      if (supplementaryData.debug) {
        console.log('Debug info from API:', supplementaryData.debug);
        console.log('WhereClause details:', JSON.stringify(supplementaryData.debug.whereClause, null, 2));
      }
    }
    if (supplementaryError) {
      console.error('Supplementary error:', supplementaryError);
      console.error('Error response:', supplementaryError?.response);
      console.error('Error message:', supplementaryError?.message);
    }
  }, [supplementaryData, supplementaryError, supplementary]);

  const columns = [
    {
      field: 'employee',
      header: 'Employee',
      minWidth: 150,
      accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`,
      render: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    {
      field: 'type',
      header: 'Type',
      minWidth: 100,
      render: (value) => <Chip label={value?.toUpperCase() || 'N/A'} size="small" color={value === 'arrears' ? 'primary' : value === 'incentive' ? 'success' : value === 'bonus' ? 'secondary' : 'default'} />
    },
    {
      field: 'amount',
      header: 'Amount',
      minWidth: 120,
      accessor: (row) => row.amount || 0,
      render: (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'month',
      header: 'Month',
      minWidth: 80,
      render: (value) => value || '-'
    },
    {
      field: 'year',
      header: 'Year',
      minWidth: 80
    },
    {
      field: 'isProcessed',
      header: 'Status',
      minWidth: 100,
      render: (value) => <Chip label={value ? 'Processed' : 'Pending'} size="small" color={value ? 'success' : 'warning'} />
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 150,
      render: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          {!row.isProcessed && (
            <IconButton size="small" onClick={() => handleDelete(row)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Supplementary Salary
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage arrears, incentives, and other supplementary payments
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Arrears" />
            <Tab label="Incentives" />
            <Tab label="All" />
            <Tab label="Full & Final" />
          </Tabs>
          {tabValue < 3 && (
            <Box sx={{ pr: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setImportDialogOpen(true)}>
                Bulk Import
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add Entry
              </Button>
            </Box>
          )}
        </Box>

        <TabPanel value={tabValue} index={0}>
          {supplementaryError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading supplementary salaries: {supplementaryError?.response?.data?.message || supplementaryError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !supplementaryError && supplementary.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No arrears found.
              </Typography>
            </Box>
          )}
          {!isLoading && !supplementaryError && supplementary.length > 0 && (
            <DataTable columns={columns} data={supplementary} loading={isLoading} searchable searchPlaceholder="Search arrears..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, fontSize: '0.875rem' }}>
              <Typography variant="body2">
                Debug: Loading: {isLoading ? 'Yes' : 'No'} | Error: {supplementaryError ? 'Yes' : 'No'} | 
                Data: {supplementaryData ? 'Yes' : 'No'} | Count: {supplementary.length}
              </Typography>
            </Box>
          )}
          {supplementaryError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading supplementary salaries: {supplementaryError?.response?.data?.message || supplementaryError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !supplementaryError && supplementary.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No incentives found.
              </Typography>
            </Box>
          )}
          {!isLoading && !supplementaryError && supplementary.length > 0 && (
            <DataTable columns={columns} data={supplementary} loading={isLoading} searchable searchPlaceholder="Search incentives..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, fontSize: '0.875rem' }}>
              <Typography variant="body2">
                Debug: Loading: {isLoading ? 'Yes' : 'No'} | Error: {supplementaryError ? 'Yes' : 'No'} | 
                Data: {supplementaryData ? 'Yes' : 'No'} | Count: {supplementary.length}
              </Typography>
              {supplementaryData?.debug && (
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  API Debug: CompanyId: {supplementaryData.debug.companyId} | 
                  Employees: {supplementaryData.debug.employeeCount} | 
                  WhereClause: {JSON.stringify(supplementaryData.debug.whereClause)}
                </Typography>
              )}
            </Box>
          )}
          {supplementaryError && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="error">
                Error loading supplementary salaries: {supplementaryError?.response?.data?.message || supplementaryError?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}
          {!isLoading && !supplementaryError && supplementary.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No supplementary salaries found.
              </Typography>
            </Box>
          )}
          {!isLoading && !supplementaryError && supplementary.length > 0 && (
            <DataTable columns={columns} data={supplementary} loading={isLoading} searchable searchPlaceholder="Search all supplementary salaries..." />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <FullAndFinalSettlement />
        </TabPanel>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{selectedSupplementary ? 'Edit Supplementary Salary' : 'Add Supplementary Salary'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="employeeId"
                  control={control}
                  rules={{ required: 'Employee is required' }}
                  render={({ field }) => (
                    <TextField {...field} select label="Employee" fullWidth required>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <TextField {...field} select label="Type" fullWidth required>
                      <MenuItem value="arrears">Arrears</MenuItem>
                      <MenuItem value="incentive">Incentive</MenuItem>
                      <MenuItem value="bonus">Bonus</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="amount"
                  control={control}
                  rules={{ required: 'Amount is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Amount" type="number" step="0.01" fullWidth required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Effective Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Grid>
              {type === 'arrears' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="arrearsFromDate"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Arrears From Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="arrearsToDate"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Arrears To Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                      )}
                    />
                  </Grid>
                </>
              )}
              {type === 'incentive' && (
                <Grid item xs={12}>
                  <Controller
                    name="incentivePeriod"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Incentive Period" fullWidth />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Controller
                  name="month"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Month" type="number" fullWidth inputProps={{ min: 1, max: 12 }} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Year" type="number" fullWidth />
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {selectedSupplementary ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Import Supplementary Salary</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload Excel file with columns: Employee Code, Type, Amount, Month, Year, Description, Effective Date, Arrears From Date, Arrears To Date, Incentive Period
            </Typography>
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} fullWidth sx={{ mt: 2 }}>
                Select Excel File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
            {importMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImport} disabled={!selectedFile || importMutation.isLoading}>
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
