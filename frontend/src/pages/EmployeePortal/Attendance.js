import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Paper,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useQuery } from 'react-query';
import { portalService } from '../../services/portalService';
import DataTable from '../../components/DataTable';

export default function EmployeeAttendance() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery(
    ['employeeAttendance', selectedMonth, selectedYear],
    () => portalService.getAttendance({ month: selectedMonth, year: selectedYear }),
    { refetchOnWindowFocus: false }
  );

  const columns = [
    { field: 'date', header: 'Date', format: 'date' },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        present: 'success',
        absent: 'error',
        'half-day': 'warning',
        holiday: 'info',
        weekend: 'default'
      }
    },
    { field: 'checkIn', header: 'Check In' },
    { field: 'checkOut', header: 'Check Out' },
    { field: 'hoursWorked', header: 'Hours Worked' },
    { field: 'remarks', header: 'Remarks' }
  ];

  const attendance = data?.data || [];
  const summary = data?.summary || {};

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Attendance
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <TextField
          size="small"
          label="Month"
          type="number"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          inputProps={{ min: 1, max: 12 }}
        />
        <TextField
          size="small"
          label="Year"
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{summary.total || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Days</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">{summary.present || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Present</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">{summary.absent || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Absent</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">{summary.halfDay || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Half Day</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={attendance}
        loading={isLoading}
        searchable
      />
    </Container>
  );
}

