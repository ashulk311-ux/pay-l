import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton
} from '@mui/material';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import { portalService } from '../../services/portalService';
import DataTable from '../../components/DataTable';

export default function EmployeePayslips() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery(
    ['employeePayslips', selectedMonth, selectedYear],
    () => portalService.getPayslips({ month: selectedMonth, year: selectedYear }),
    { refetchOnWindowFocus: false }
  );

  const handleDownload = async (payslipId) => {
    try {
      const blob = await portalService.getPayslipPDF(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  const columns = [
    {
      field: 'period',
      header: 'Period',
      accessor: (row) => `${new Date(2000, row.month - 1).toLocaleString('default', { month: 'short' })} ${row.year}`
    },
    { field: 'grossSalary', header: 'Gross Salary', format: 'currency' },
    { field: 'totalDeductions', header: 'Deductions', format: 'currency' },
    { field: 'netSalary', header: 'Net Salary', format: 'currency' },
    {
      field: 'status',
      header: 'Status',
      type: 'chip',
      chipColors: {
        finalized: 'success',
        locked: 'warning',
        draft: 'default'
      }
    },
    {
      field: 'actions',
      header: 'Actions',
      align: 'right',
      render: (value, row) => (
        <IconButton size="small" onClick={() => handleDownload(row.id)}>
          <DownloadIcon />
        </IconButton>
      )
    }
  ];

  const payslips = data?.data || [];

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Payslips
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <MenuItem key={month} value={month}>
                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={payslips}
        loading={isLoading}
        searchable={false}
      />
    </Container>
  );
}

