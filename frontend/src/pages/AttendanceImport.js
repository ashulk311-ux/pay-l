import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  TextField,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SyncIcon from '@mui/icons-material/Sync';
import { attendanceService } from '../services/attendanceService';
import { attendanceMatrixService } from '../services/attendanceMatrixService';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AttendanceImport() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const dailyUploadMutation = useMutation(
    (file) => attendanceService.uploadDaily(file),
    {
      onSuccess: (response) => {
        toast.success(`Upload completed: ${response.data?.success || 0} records processed`);
        setSelectedFile(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload attendance');
      }
    }
  );

  const monthlyUploadMutation = useMutation(
    ({ file, month, year }) => attendanceService.uploadMonthly(file, month, year),
    {
      onSuccess: (response) => {
        toast.success(`Upload completed: ${response.data?.success || 0} records processed`);
        setSelectedFile(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload attendance');
      }
    }
  );

  const syncMutation = useMutation(
    () => attendanceMatrixService.syncAttendance(startDate, endDate),
    {
      onSuccess: (response) => {
        toast.success(`Synced ${response.data?.data?.success || 0} records from Matrix`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to sync from Matrix');
      }
    }
  );

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleDailyUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    dailyUploadMutation.mutate(selectedFile);
  };

  const handleMonthlyUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    monthlyUploadMutation.mutate({ file: selectedFile, month, year });
  };

  const handleSync = () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    syncMutation.mutate();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Import
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload daily/monthly attendance or sync from Matrix Software
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Daily Upload" />
            <Tab label="Monthly Upload" />
            <Tab label="Matrix Sync" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h6" gutterBottom>Daily Attendance Upload</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload Excel file with columns: Employee Code, Date, Status, Check In, Check Out, Hours Worked, Remarks
            </Typography>
            <Box sx={{ mb: 2 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="daily-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="daily-file-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                  Select Excel File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={handleDailyUpload}
              disabled={!selectedFile || dailyUploadMutation.isLoading}
            >
              Upload Daily Attendance
            </Button>
            {dailyUploadMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>Monthly Attendance Upload</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload Excel file with employee codes in first column and dates as column headers
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Month"
                  type="number"
                  fullWidth
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 12 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Year"
                  type="number"
                  fullWidth
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
            <Box sx={{ mb: 2 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="monthly-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="monthly-file-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                  Select Excel File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={handleMonthlyUpload}
              disabled={!selectedFile || monthlyUploadMutation.isLoading}
            >
              Upload Monthly Attendance
            </Button>
            {monthlyUploadMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>Sync from Matrix Software</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sync attendance records from Matrix Software for the selected date range
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={handleSync}
              disabled={!startDate || !endDate || syncMutation.isLoading}
            >
              Sync from Matrix
            </Button>
            {syncMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}



