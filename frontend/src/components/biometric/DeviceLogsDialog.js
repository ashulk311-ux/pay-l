import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Box
} from '@mui/material';
import { useQuery } from 'react-query';
import { biometricService } from '../../services/biometricService';
import DataTable from '../DataTable';

export default function DeviceLogsDialog({ open, device, onClose }) {
  const [logType, setLogType] = useState('');
  const [status, setStatus] = useState('');

  const { data: logsData, isLoading } = useQuery(
    ['deviceLogs', device?.id, logType, status],
    () => biometricService.getDeviceLogs(device?.id, { logType, status }),
    { enabled: open && !!device?.id }
  );

  const logs = logsData?.data || [];

  const columns = [
    {
      id: 'logType',
      label: 'Type',
      minWidth: 100,
      format: (value) => <Chip label={value?.toUpperCase()} size="small" />
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value?.toUpperCase()}
          size="small"
          color={value === 'success' ? 'success' : value === 'failed' ? 'error' : 'default'}
        />
      )
    },
    {
      id: 'recordsCount',
      label: 'Records',
      minWidth: 100
    },
    {
      id: 'startTime',
      label: 'Start Time',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      id: 'endTime',
      label: 'End Time',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      id: 'duration',
      label: 'Duration (ms)',
      minWidth: 120
    },
    {
      id: 'errorMessage',
      label: 'Error',
      minWidth: 200,
      format: (value) => value ? <Typography variant="body2" color="error">{value}</Typography> : '-'
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Device Logs - {device?.deviceName}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Log Type</InputLabel>
            <Select value={logType} onChange={(e) => setLogType(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="sync">Sync</MenuItem>
              <MenuItem value="attendance">Attendance</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="heartbeat">Heartbeat</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <DataTable columns={columns} data={logs} loading={isLoading} searchable />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

