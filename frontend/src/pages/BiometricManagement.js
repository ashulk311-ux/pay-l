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
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SyncIcon from '@mui/icons-material/Sync';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { biometricService } from '../services/biometricService';
import { employeeService } from '../services/employeeService';
import { branchService } from '../services/branchService';
import DataTable from '../components/DataTable';
import DeviceDialog from '../components/biometric/DeviceDialog';
import EmployeeMappingDialog from '../components/biometric/EmployeeMappingDialog';
import DeviceLogsDialog from '../components/biometric/DeviceLogsDialog';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BiometricManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showApiSecret, setShowApiSecret] = useState({});

  const { data: devicesData, isLoading, error: devicesError } = useQuery('biometricDevices', () => biometricService.getAllDevices(), {
    refetchOnWindowFocus: false,
    retry: 1
  });
  const queryClient = useQueryClient();

  const regenerateMutation = useMutation(
    (id) => biometricService.regenerateCredentials(id),
    {
      onSuccess: (response, id) => {
        toast.success('API credentials regenerated successfully');
        setShowApiSecret({ ...showApiSecret, [id]: response.data });
        queryClient.invalidateQueries('biometricDevices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to regenerate credentials');
      }
    }
  );

  const syncMutation = useMutation(
    (id) => biometricService.triggerSync(id),
    {
      onSuccess: () => {
        toast.success('Sync triggered successfully');
        queryClient.invalidateQueries('biometricDevices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to trigger sync');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => biometricService.deleteDevice(id),
    {
      onSuccess: () => {
        toast.success('Device deleted successfully');
        queryClient.invalidateQueries('biometricDevices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete device');
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDeviceDialog = (device = null) => {
    setSelectedDevice(device);
    setDeviceDialogOpen(true);
  };

  const handleOpenMappingDialog = (device) => {
    setSelectedDevice(device);
    setMappingDialogOpen(true);
  };

  const handleOpenLogsDialog = (device) => {
    setSelectedDevice(device);
    setLogsDialogOpen(true);
  };

  const handleRegenerateCredentials = (device) => {
    if (window.confirm('Are you sure you want to regenerate API credentials? The device will need to be reconfigured.')) {
      regenerateMutation.mutate(device.id);
    }
  };

  const handleTriggerSync = (device) => {
    syncMutation.mutate(device.id);
  };

  const handleDelete = (device) => {
    if (window.confirm(`Are you sure you want to delete device "${device.deviceName}"?`)) {
      deleteMutation.mutate(device.id);
    }
  };

  const devices = devicesData?.data || [];

  const columns = [
    {
      field: 'deviceName',
      header: 'Device Name',
      minWidth: 150
    },
    {
      field: 'deviceSerialNumber',
      header: 'Serial Number',
      minWidth: 150
    },
    {
      field: 'deviceType',
      header: 'Type',
      minWidth: 120,
      render: (value) => <Chip label={value?.toUpperCase() || 'N/A'} size="small" />
    },
    {
      field: 'location',
      header: 'Location',
      minWidth: 120
    },
    {
      field: 'isOnline',
      header: 'Status',
      minWidth: 100,
      render: (value, row) => (
        <Box>
          <Chip
            icon={value ? <CheckCircleIcon /> : <CancelIcon />}
            label={value ? 'Online' : 'Offline'}
            size="small"
            color={value ? 'success' : 'default'}
          />
          {row.lastHeartbeat && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Last: {new Date(row.lastHeartbeat).toLocaleString()}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'lastSyncStatus',
      header: 'Last Sync',
      minWidth: 120,
      render: (value, row) => (
        <Box>
          <Chip
            label={value?.toUpperCase() || 'N/A'}
            size="small"
            color={value === 'success' ? 'success' : value === 'failed' ? 'error' : 'default'}
          />
          {row.lastSyncAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {new Date(row.lastSyncAt).toLocaleString()}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'totalRecordsSynced',
      header: 'Records Synced',
      minWidth: 120,
      render: (value) => value || 0
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 250,
      render: (value, row) => (
        <Box>
          <Tooltip title="View Logs">
            <IconButton size="small" onClick={() => handleOpenLogsDialog(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage Mappings">
            <IconButton size="small" onClick={() => handleOpenMappingDialog(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Trigger Sync">
            <IconButton size="small" onClick={() => handleTriggerSync(row)} color="primary">
              <SyncIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Regenerate Credentials">
            <IconButton size="small" onClick={() => handleRegenerateCredentials(row)} color="warning">
              <VpnKeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(row)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Biometric Device Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Register and manage biometric devices for real-time attendance capture
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Devices" />
            <Tab label="Device Status" />
          </Tabs>
          <Box sx={{ pr: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDeviceDialog()}>
              Register Device
            </Button>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {devicesError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading devices: {devicesError?.response?.data?.message || devicesError?.message || 'Unknown error'}
            </Alert>
          )}
          {!isLoading && !devicesError && devices.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No biometric devices found. Register your first device to get started.
              </Typography>
            </Box>
          )}
          {!isLoading && !devicesError && devices.length > 0 && (
            <DataTable columns={columns} data={devices} loading={isLoading} searchable searchPlaceholder="Search devices..." />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {devicesError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading devices: {devicesError?.response?.data?.message || devicesError?.message || 'Unknown error'}
            </Alert>
          )}
          {!isLoading && !devicesError && devices.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No biometric devices found. Register your first device to get started.
              </Typography>
            </Box>
          )}
          {!isLoading && !devicesError && devices.length > 0 && (
            <Grid container spacing={2}>
              {devices.map((device) => (
              <Grid item xs={12} md={6} lg={4} key={device.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{device.deviceName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {device.deviceSerialNumber}
                        </Typography>
                      </Box>
                      <Chip
                        icon={device.isOnline ? <CheckCircleIcon /> : <CancelIcon />}
                        label={device.isOnline ? 'Online' : 'Offline'}
                        color={device.isOnline ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Type</Typography>
                        <Typography variant="body2">{device.deviceType}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body2">{device.location || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Last Sync</Typography>
                        <Typography variant="body2">
                          {device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString() : 'Never'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Records Synced</Typography>
                        <Typography variant="body2">{device.totalRecordsSynced || 0}</Typography>
                      </Grid>
                      {device.lastSyncError && (
                        <Grid item xs={12}>
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {device.lastSyncError}
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => handleOpenMappingDialog(device)}>
                        Manage Mappings
                      </Button>
                      <Button size="small" onClick={() => handleOpenLogsDialog(device)}>
                        View Logs
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      <DeviceDialog
        open={deviceDialogOpen}
        device={selectedDevice}
        onClose={() => {
          setDeviceDialogOpen(false);
          setSelectedDevice(null);
        }}
      />
      <EmployeeMappingDialog
        open={mappingDialogOpen}
        device={selectedDevice}
        onClose={() => {
          setMappingDialogOpen(false);
          setSelectedDevice(null);
        }}
      />
      <DeviceLogsDialog
        open={logsDialogOpen}
        device={selectedDevice}
        onClose={() => {
          setLogsDialogOpen(false);
          setSelectedDevice(null);
        }}
      />
    </Container>
  );
}

