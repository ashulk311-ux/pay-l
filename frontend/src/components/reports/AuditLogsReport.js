import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Grid
} from '@mui/material';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import { reportService } from '../../services/reportService';
import DataTable from '../DataTable';

export default function AuditLogsReport() {
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [entityType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page] = useState(1);

  const { data: logsData, isLoading } = useQuery(
    ['auditLogs', module, action, entityType, fromDate, toDate, page],
    () => reportService.getAuditLogs({ module, action, entityType, fromDate, toDate, page, limit: 50 })
  );

  const handleExport = async (format = 'excel') => {
    try {
      const response = await reportService.exportAuditLogs({ module, action, entityType, fromDate, toDate }, format);
      if (response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
        toast.success('Audit logs exported successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export audit logs');
    }
  };

  const logs = logsData?.data || [];

  const columns = [
    {
      id: 'createdAt',
      label: 'Timestamp',
      minWidth: 150,
      format: (value) => new Date(value).toLocaleString()
    },
    {
      id: 'user',
      label: 'User',
      minWidth: 150,
      format: (value, row) => `${row.user?.firstName || ''} ${row.user?.lastName || ''} (${row.user?.email || ''})`
    },
    {
      id: 'module',
      label: 'Module',
      minWidth: 120
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 100,
      format: (value) => <Chip label={value?.toUpperCase()} size="small" />
    },
    {
      id: 'entityType',
      label: 'Entity Type',
      minWidth: 120
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Audit Logs</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
        </Box>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Module"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select value={action} onChange={(e) => setAction(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="create">Create</MenuItem>
              <MenuItem value="update">Update</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
              <MenuItem value="view">View</MenuItem>
              <MenuItem value="export">Export</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
      </Grid>
      <DataTable columns={columns} data={logs} loading={isLoading} searchable />
    </Box>
  );
}



