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
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { reportService } from '../services/reportService';
import DataTable from '../components/DataTable';
import EmployeeHistoryReport from '../components/reports/EmployeeHistoryReport';
import AuditLogsReport from '../components/reports/AuditLogsReport';
import CustomReportBuilder from '../components/reports/CustomReportBuilder';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const reportCategories = {
  statutory: [
    { value: 'pf', label: 'PF Report' },
    { value: 'esi', label: 'ESI Report' },
    { value: 'tds', label: 'TDS Deduction Summary' },
    { value: 'pt', label: 'PT Report' }
  ],
  payroll: [
    { value: 'salary-register', label: 'Salary Register' },
    { value: 'payroll-summary', label: 'Head-wise Summary' }
  ],
  reconciliation: [
    { value: 'reconciliation', label: 'Reconciliation Report' }
  ],
  bank: [
    { value: 'bank-transfer', label: 'Bank Transfer Report' }
  ]
};

export default function Reports() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedReport, setSelectedReport] = useState('pf');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setReportData(null);
  };

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
          data = await reportService.getBankTransferReport(selectedMonth, selectedYear, 'json', bankName || null);
          break;
        default:
          return;
      }
      // Store both data and summary if available
      if (data.data) {
        setReportData({ data: data.data, summary: data });
      } else if (Array.isArray(data)) {
        setReportData(data);
      } else {
        setReportData(data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'excel') => {
    try {
      let response;
      switch (selectedReport) {
        case 'pf':
          response = await reportService.getPFReport(selectedMonth, selectedYear, format);
          break;
        case 'esi':
          response = await reportService.getESIReport(selectedMonth, selectedYear, format);
          break;
        case 'tds':
          response = await reportService.getTDSReport(selectedMonth, selectedYear, format);
          break;
        case 'pt':
          response = await reportService.getPTReport(selectedMonth, selectedYear, format);
          break;
        case 'salary-register':
          response = await reportService.getSalaryRegister(selectedMonth, selectedYear, format);
          break;
        case 'payroll-summary':
          response = await reportService.getPayrollSummary(selectedMonth, selectedYear, format);
          break;
        case 'reconciliation':
          response = await reportService.getReconciliationReport(selectedMonth, selectedYear, format);
          break;
        case 'bank-transfer':
          response = await reportService.getBankTransferReport(selectedMonth, selectedYear, format, bankName || null);
          break;
        default:
          return;
      }

      if (response.excelPath || response.downloadUrl) {
        const url = response.downloadUrl || `/api/reports/download/${response.excelPath}`;
        window.open(url, '_blank');
        toast.success('Report exported successfully');
      } else if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_${selectedMonth}_${selectedYear}.${format === 'csv' ? 'csv' : format === 'neft' ? 'txt' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Report downloaded successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const renderReportData = () => {
    if (!reportData) return null;

    if (selectedReport === 'reconciliation' && reportData.comparison) {
      return (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Current Month</Typography>
                  <Typography variant="body2">Employees: {reportData.comparison.current?.totalEmployees || 0}</Typography>
                  <Typography variant="body2">Gross: ₹{parseFloat(reportData.comparison.current?.totalGross || 0).toLocaleString('en-IN')}</Typography>
                  <Typography variant="body2">Net: ₹{parseFloat(reportData.comparison.current?.totalNet || 0).toLocaleString('en-IN')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {reportData.variations?.vsPrevious1 && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>vs Previous Month 1</Typography>
                    <Typography variant="body2" color={reportData.variations.vsPrevious1.grossChange >= 0 ? 'success.main' : 'error.main'}>
                      Gross Change: ₹{parseFloat(reportData.variations.vsPrevious1.grossChange || 0).toLocaleString('en-IN')} ({reportData.variations.vsPrevious1.grossChangePercent}%)
                    </Typography>
                    <Typography variant="body2" color={reportData.variations.vsPrevious1.netChange >= 0 ? 'success.main' : 'error.main'}>
                      Net Change: ₹{parseFloat(reportData.variations.vsPrevious1.netChange || 0).toLocaleString('en-IN')} ({reportData.variations.vsPrevious1.netChangePercent}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
          {reportData.salaryVariations && reportData.salaryVariations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Salary Variation Tracker</Typography>
              <DataTable
                columns={Object.keys(reportData.salaryVariations[0] || {}).map(key => ({
                  id: key,
                  label: key,
                  minWidth: 150,
                  format: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : value
                }))}
                data={reportData.salaryVariations}
                searchable
              />
            </Box>
          )}
        </Box>
      );
    }

    if (selectedReport === 'bank-transfer' && reportData.bankWiseSummary) {
      return (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.keys(reportData.bankWiseSummary).map(bank => (
              <Grid item xs={12} md={4} key={bank}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{bank}</Typography>
                    <Typography variant="body2">Employees: {reportData.bankWiseSummary[bank].count}</Typography>
                    <Typography variant="body2">Total: ₹{parseFloat(reportData.bankWiseSummary[bank].total || 0).toLocaleString('en-IN')}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {reportData.data && (
            <DataTable
              columns={Object.keys(reportData.data[0] || {}).map(key => ({
                id: key,
                label: key,
                minWidth: 150,
                format: (value) => key === 'Amount' ? `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : value
              }))}
              data={reportData.data}
              searchable
            />
          )}
        </Box>
      );
    }

    if (Array.isArray(reportData)) {
      return (
        <DataTable
          columns={Object.keys(reportData[0] || {}).map(key => ({
            id: key,
            label: key,
            minWidth: 150,
            format: (value) => {
              if (typeof value === 'number') {
                return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
              }
              return value;
            }
          }))}
          data={reportData}
          searchable
        />
      );
    }

    // Handle report data with summary
    if (reportData && reportData.data && Array.isArray(reportData.data)) {
      // Show summary statistics for statutory reports
      const showSummary = selectedReport === 'pf' || selectedReport === 'esi' || selectedReport === 'tds' || selectedReport === 'pt';
      const summary = reportData.summary || {};
      
      return (
        <Box>
          {showSummary && (summary.totalEmployees || summary.totalEmployeePF || summary.totalEmployeeESI || summary.totalTDS || summary.totalPT) && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {summary.totalEmployees !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                      <Typography variant="h6">{summary.totalEmployees || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalEmployeePF !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Employee PF</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalEmployeePF || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalEmployerPF !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Employer PF</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalEmployerPF || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalPF !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total PF</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalPF || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalEmployeeESI !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Employee ESI</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalEmployeeESI || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalEmployerESI !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Employer ESI</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalEmployerESI || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalESI !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total ESI</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalESI || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalTDS !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total TDS</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalTDS || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {summary.totalPT !== undefined && (
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total PT</Typography>
                      <Typography variant="h6">₹{parseFloat(summary.totalPT || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
          <DataTable
            columns={Object.keys(reportData.data[0] || {}).map(key => ({
              id: key,
              label: key,
              minWidth: 150,
              format: (value) => {
                if (typeof value === 'number') {
                  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                }
                return value;
              }
            }))}
            data={reportData.data}
            searchable
          />
        </Box>
      );
    }

    return <Alert severity="info">No data available</Alert>;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Generate and export various payroll and statutory reports
        </Typography>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Statutory Reports" />
          <Tab label="Payroll Reports" />
          <Tab label="Reconciliation" />
          <Tab label="Bank Transfer" />
          <Tab label="Employee History" />
          <Tab label="Audit Logs" />
          <Tab label="Custom Reports" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
                    {reportCategories.statutory.map(report => (
                      <MenuItem key={report.value} value={report.value}>{report.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Month"
                  type="number"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 12 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={handleGenerateReport} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('excel')} disabled={!reportData || loading}>
                    Excel
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')} disabled={!reportData || loading}>
                    CSV
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {renderReportData()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
                    {reportCategories.payroll.map(report => (
                      <MenuItem key={report.value} value={report.value}>{report.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Month"
                  type="number"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 12 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={handleGenerateReport} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('excel')} disabled={!reportData || loading}>
                    Excel
                  </Button>
                  <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => handleExport('pdf')} disabled={!reportData || loading}>
                    PDF
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {renderReportData()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  label="Month"
                  type="number"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 12 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={() => { setSelectedReport('reconciliation'); handleGenerateReport(); }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => { setSelectedReport('reconciliation'); handleExport('excel'); }} disabled={!reportData || loading}>
                    Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {renderReportData()}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  label="Month"
                  type="number"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 12 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Bank Name (Optional)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={() => { setSelectedReport('bank-transfer'); handleGenerateReport(); }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => { setSelectedReport('bank-transfer'); handleExport('excel'); }} disabled={!reportData || loading}>
                    Excel
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => { setSelectedReport('bank-transfer'); handleExport('neft'); }} disabled={!reportData || loading}>
                    NEFT
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => { setSelectedReport('bank-transfer'); handleExport('csv'); }} disabled={!reportData || loading}>
                    CSV
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {renderReportData()}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <EmployeeHistoryReport />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <AuditLogsReport />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <CustomReportBuilder />
        </TabPanel>
      </Paper>
    </Container>
  );
}
