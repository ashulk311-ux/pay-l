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
  Chip
} from '@mui/material';
import { useQuery } from 'react-query';
import { reportService } from '../../services/reportService';
import { employeeService } from '../../services/employeeService';
import DataTable from '../DataTable';

export default function EmployeeHistoryReport() {
  const [employeeId, setEmployeeId] = useState('');
  const [changeType, setChangeType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: employeesData } = useQuery('employees', () => employeeService.getAll());

  const { data: historyData, isLoading } = useQuery(
    ['employeeHistory', employeeId, changeType, fromDate, toDate],
    () => reportService.getEmployeeHistory(employeeId, { changeType, fromDate, toDate }),
    { enabled: !!employeeId }
  );

  const employees = employeesData?.data || [];
  const history = historyData?.data || [];

  const columns = [
    {
      id: 'changeType',
      label: 'Change Type',
      minWidth: 120,
      format: (value) => <Chip label={value?.toUpperCase()} size="small" />
    },
    {
      id: 'fieldName',
      label: 'Field',
      minWidth: 120
    },
    {
      id: 'oldValue',
      label: 'Old Value',
      minWidth: 150
    },
    {
      id: 'newValue',
      label: 'New Value',
      minWidth: 150
    },
    {
      id: 'changer',
      label: 'Changed By',
      minWidth: 150,
      format: (value, row) => `${row.changer?.firstName || ''} ${row.changer?.lastName || ''}`
    },
    {
      id: 'createdAt',
      label: 'Changed At',
      minWidth: 150,
      format: (value) => new Date(value).toLocaleString()
    },
    {
      id: 'changeReason',
      label: 'Reason',
      minWidth: 200
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Employee History Tracking</Typography>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Employee</InputLabel>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Change Type</InputLabel>
          <Select value={changeType} onChange={(e) => setChangeType(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="designation">Designation</MenuItem>
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="salary">Salary</MenuItem>
            <MenuItem value="grade">Grade</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="From Date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To Date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      {employeeId && (
        <DataTable columns={columns} data={history} loading={isLoading} searchable />
      )}
    </Box>
  );
}


