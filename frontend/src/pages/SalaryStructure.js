import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { salaryService } from '../services/salaryService';
import { employeeService } from '../services/employeeService';

export default function SalaryStructure() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [fixedHeads, setFixedHeads] = useState({});
  const [variableHeads, setVariableHeads] = useState({});
  const [deductions, setDeductions] = useState({});

  const { data: employeeData } = useQuery(
    ['employee', id],
    () => employeeService.getById(id),
    { enabled: !!id }
  );

  const { data: structureData } = useQuery(
    ['salaryStructure', id],
    () => salaryService.getSalaryStructure(id),
    { enabled: !!id }
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      effectiveDate: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    if (structureData?.data?.structure) {
      const structure = structureData.data.structure;
      setFixedHeads(structure.fixedHeads || {});
      setVariableHeads(structure.variableHeads || {});
      setDeductions(structure.deductions || {});
      reset({
        effectiveDate: structure.effectiveDate ? new Date(structure.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [structureData, reset]);

  const createMutation = useMutation(
    (data) => salaryService.createSalaryStructure(data),
    {
      onSuccess: () => {
        toast.success('Salary structure saved successfully');
        queryClient.invalidateQueries(['salaryStructure', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save salary structure');
      }
    }
  );

  const salaryHeads = structureData?.data?.salaryHeads || [];
  const fixedHeadList = salaryHeads.filter(h => h.category === 'earning' && !h.statutoryType);
  const variableHeadList = salaryHeads.filter(h => h.category === 'earning');
  const deductionHeadList = salaryHeads.filter(h => h.category === 'deduction' || h.category === 'statutory');

  const calculateTotal = (heads) => {
    return Object.values(heads).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  };

  const totalFixed = calculateTotal(fixedHeads);
  const totalVariable = calculateTotal(variableHeads);
  const totalDeductions = calculateTotal(deductions);
  const grossSalary = totalFixed + totalVariable;
  const netSalary = grossSalary - totalDeductions;

  const onSubmit = (formData) => {
    createMutation.mutate({
      employeeId: id,
      effectiveDate: formData.effectiveDate,
      fixedHeads,
      variableHeads,
      deductions,
      salaryHeads: structureData?.data?.salaryHeads || []
    });
  };

  const employee = employeeData?.data;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Salary Structure - {employee?.firstName} {employee?.lastName}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Employee Code: {employee?.employeeCode}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Controller
                name="effectiveDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Effective Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 3 }}
                  />
                )}
              />

              {/* Fixed Heads */}
              <Typography variant="h6" gutterBottom>
                Fixed Salary Heads
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Head Name</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fixedHeadList.map((head) => (
                      <TableRow key={head.id}>
                        <TableCell>{head.salaryHeadName}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={fixedHeads[head.salaryHeadCode] || ''}
                            onChange={(e) => setFixedHeads({
                              ...fixedHeads,
                              [head.salaryHeadCode]: parseFloat(e.target.value) || 0
                            })}
                            sx={{ width: 150 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Fixed</strong></TableCell>
                      <TableCell align="right"><strong>₹{totalFixed.toLocaleString()}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              {/* Variable Heads */}
              <Typography variant="h6" gutterBottom>
                Variable Salary Heads
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Head Name</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variableHeadList.map((head) => (
                      <TableRow key={head.id}>
                        <TableCell>{head.salaryHeadName}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={variableHeads[head.salaryHeadCode] || ''}
                            onChange={(e) => setVariableHeads({
                              ...variableHeads,
                              [head.salaryHeadCode]: parseFloat(e.target.value) || 0
                            })}
                            sx={{ width: 150 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Variable</strong></TableCell>
                      <TableCell align="right"><strong>₹{totalVariable.toLocaleString()}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              {/* Deductions */}
              <Typography variant="h6" gutterBottom>
                Deductions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Head Name</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deductionHeadList.map((head) => (
                      <TableRow key={head.id}>
                        <TableCell>{head.salaryHeadName}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={deductions[head.salaryHeadCode] || ''}
                            onChange={(e) => setDeductions({
                              ...deductions,
                              [head.salaryHeadCode]: parseFloat(e.target.value) || 0
                            })}
                            sx={{ width: 150 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Deductions</strong></TableCell>
                      <TableCell align="right"><strong>₹{totalDeductions.toLocaleString()}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              {/* Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">Gross Salary:</Typography>
                <Typography variant="h6">₹{grossSalary.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 1 }}>
                <Typography variant="h6">Net Salary:</Typography>
                <Typography variant="h6" color="primary">₹{netSalary.toLocaleString()}</Typography>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" size="large" disabled={createMutation.isLoading}>
                  Save Salary Structure
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}



