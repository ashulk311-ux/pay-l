import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import { reportService } from '../services/reportService';
import DataTable from '../components/DataTable';

const reportTypes = [
  { value: 'pf', label: 'PF Report' },
  { value: 'esi', label: 'ESI Report' },
  { value: 'tds', label: 'TDS Report' },
  { value: 'pt', label: 'PT Report' },
  { value: 'salary-register', label: 'Salary Register' },
  { value: 'payroll-summary', label: 'Payroll Summary' },
  { value: 'reconciliation', label: 'Reconciliation' },
  { value: 'bank-transfer', label: 'Bank Transfer' }
];

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedReport, setSelectedReport] = useState('pf');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let data;
      switch (selectedReport) {
        case 'pf':
          data = await reportService.getPFReport(selectedMonth, selectedYear);
          break;
        case 'esi':
          data = await reportService.getESIReport(selectedMonth, selectedYear);
          break;
        case 'tds':
          data = await reportService.getTDSReport(selectedMonth, selectedYear);
          break;
        case 'pt':
          data = await reportService.getPTReport(selectedMonth, selectedYear);
          break;
        case 'salary-register':
          data = await reportService.getSalaryRegister(selectedMonth, selectedYear);
          break;
        case 'payroll-summary':
          data = await reportService.getPayrollSummary(selectedMonth, selectedYear);
          break;
        case 'reconciliation':
          data = await reportService.getReconciliationReport(selectedMonth, selectedYear);
          break;
        case 'bank-transfer':
          data = await reportService.getBankTransferReport(selectedMonth, selectedYear);
          break;
        default:
          return;
      }
      setReportData(data.data || data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      let blob;
      switch (selectedReport) {
        case 'pf':
          blob = await reportService.getPFReport(selectedMonth, selectedYear, 'excel');
          break;
        case 'esi':
          blob = await reportService.getESIReport(selectedMonth, selectedYear, 'excel');
          break;
        case 'tds':
          blob = await reportService.getTDSReport(selectedMonth, selectedYear, 'excel');
          break;
        case 'pt':
          blob = await reportService.getPTReport(selectedMonth, selectedYear, 'excel');
          break;
        case 'salary-register':
          blob = await reportService.getSalaryRegister(selectedMonth, selectedYear, 'excel');
          break;
        case 'reconciliation':
          blob = await reportService.getReconciliationReport(selectedMonth, selectedYear, 'excel');
          break;
        case 'bank-transfer':
          blob = await reportService.getBankTransferReport(selectedMonth, selectedYear, 'excel');
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getReportColumns = () => {
    if (!reportData?.data || !Array.isArray(reportData.data) || reportData.data.length === 0) {
      return [];
    }

    return Object.keys(reportData.data[0]).map(key => ({
      field: key,
      header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      format: key.toLowerCase().includes('salary') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('pf') || key.toLowerCase().includes('esi') || key.toLowerCase().includes('tds') || key.toLowerCase().includes('pt') ? 'currency' : undefined
    }));
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedReport}
                  label="Report Type"
                  onChange={(e) => {
                    setSelectedReport(e.target.value);
                    setReportData(null);
                  }}
                >
                  {reportTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
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
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
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
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                Generate
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {reportTypes.find(r => r.value === selectedReport)?.label} - {new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
          </Box>

          {selectedReport === 'payroll-summary' ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                  <Typography variant="h6">{reportData.payroll?.totalEmployees || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">Gross Salary</Typography>
                  <Typography variant="h6">₹{parseFloat(reportData.payroll?.totalGrossSalary || 0).toLocaleString('en-IN')}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                  <Typography variant="h6">₹{parseFloat(reportData.payroll?.totalDeductions || 0).toLocaleString('en-IN')}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">Net Salary</Typography>
                  <Typography variant="h6">₹{parseFloat(reportData.payroll?.totalNetSalary || 0).toLocaleString('en-IN')}</Typography>
                </Grid>
              </Grid>
              {reportData.departmentSummary && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Department</TableCell>
                        <TableCell align="right">Employees</TableCell>
                        <TableCell align="right">Gross Salary</TableCell>
                        <TableCell align="right">Deductions</TableCell>
                        <TableCell align="right">Net Salary</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(reportData.departmentSummary).map(([dept, data]) => (
                        <TableRow key={dept}>
                          <TableCell>{dept}</TableCell>
                          <TableCell align="right">{data.employees}</TableCell>
                          <TableCell align="right">₹{parseFloat(data.totalGross).toLocaleString('en-IN')}</TableCell>
                          <TableCell align="right">₹{parseFloat(data.totalDeductions).toLocaleString('en-IN')}</TableCell>
                          <TableCell align="right">₹{parseFloat(data.totalNet).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : selectedReport === 'reconciliation' ? (
            <Box>
              <Typography variant="h6" gutterBottom>Comparison</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Employees</TableCell>
                      <TableCell align="right">Gross Salary</TableCell>
                      <TableCell align="right">Deductions</TableCell>
                      <TableCell align="right">Net Salary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.comparison?.current && (
                      <TableRow>
                        <TableCell>Current ({reportData.comparison.current.month}/{reportData.comparison.current.year})</TableCell>
                        <TableCell align="right">{reportData.comparison.current.totalEmployees}</TableCell>
                        <TableCell align="right">₹{parseFloat(reportData.comparison.current.totalGross).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{parseFloat(reportData.comparison.current.totalDeductions).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{parseFloat(reportData.comparison.current.totalNet).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    )}
                    {reportData.comparison?.previous1 && (
                      <TableRow>
                        <TableCell>Previous Month 1 ({reportData.comparison.previous1.month}/{reportData.comparison.previous1.year})</TableCell>
                        <TableCell align="right">{reportData.comparison.previous1.totalEmployees}</TableCell>
                        <TableCell align="right">₹{parseFloat(reportData.comparison.previous1.totalGross).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{parseFloat(reportData.comparison.previous1.totalDeductions).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{parseFloat(reportData.comparison.previous1.totalNet).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : reportData.data && Array.isArray(reportData.data) ? (
            <DataTable
              columns={getReportColumns()}
              data={reportData.data}
              pagination
            />
          ) : (
            <Typography>No data available</Typography>
          )}
        </Paper>
      )}
    </Container>
  );
}
