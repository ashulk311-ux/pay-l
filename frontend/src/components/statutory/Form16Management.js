import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Typography, MenuItem, Chip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import { form16Service } from '../../services/form16Service';
import { employeeService } from '../../services/employeeService';
import DataTable from '../DataTable';

export default function Form16Management({ company }) {
  const queryClient = useQueryClient();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const { data: form16sData, isLoading } = useQuery(
    'form16s',
    () => form16Service.getAll(),
    { refetchOnWindowFocus: false }
  );

  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getAll(),
    { refetchOnWindowFocus: false }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      employeeId: '',
      financialYear: new Date().getFullYear() - 1
    }
  });

  const generateMutation = useMutation(
    (data) => form16Service.generate(data),
    {
      onSuccess: () => {
        toast.success('Form 16 generated successfully');
        queryClient.invalidateQueries('form16s');
        setGenerateDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate Form 16');
      }
    }
  );

  const handleDownloadPDF = async (form16) => {
    try {
      const blob = await form16Service.downloadPDF(form16.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form16_${form16.employee?.employeeCode}_${form16.financialYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Form 16 downloaded successfully');
    } catch (error) {
      toast.error('Failed to download Form 16');
    }
  };

  const form16s = form16sData?.data || [];
  const employees = employeesData?.data || [];

  const columns = [
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 150,
      format: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    { id: 'financialYear', label: 'Financial Year', minWidth: 120 },
    { id: 'assessmentYear', label: 'Assessment Year', minWidth: 120 },
    {
      id: 'taxableIncome',
      label: 'Taxable Income',
      minWidth: 120,
      format: (value) => `₹${(value || 0).toLocaleString()}`
    },
    {
      id: 'tdsDeducted',
      label: 'TDS Deducted',
      minWidth: 120,
      format: (value) => `₹${(value || 0).toLocaleString()}`
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => <Chip label={value} size="small" color={value === 'generated' ? 'success' : 'default'} />
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      format: (value, row) => (
        <IconButton size="small" onClick={() => handleDownloadPDF(row)} title="Download PDF">
          <DownloadIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Form 16 Management</Typography>
        <Button variant="contained" onClick={() => setGenerateDialogOpen(true)}>
          Generate Form 16
        </Button>
      </Box>

      <DataTable columns={columns} data={form16s} loading={isLoading} searchable searchPlaceholder="Search Form 16s..." />

      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit((data) => generateMutation.mutate(data))}>
          <DialogTitle>Generate Form 16</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
              <Controller
                name="financialYear"
                control={control}
                rules={{ required: 'Financial Year is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Financial Year" type="number" fullWidth required />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={generateMutation.isLoading}>
              Generate
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}



