import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import { reimbursementService } from '../../services/reimbursementService';
import { reimbursementMasterService } from '../../services/reimbursementMasterService';
import { employeeService } from '../../services/employeeService';

export default function ReimbursementSubmissionDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [policyErrors, setPolicyErrors] = useState([]);

  const { data: categoriesData } = useQuery('reimbursementCategories', () => reimbursementMasterService.getCategories(), { enabled: open });
  const { data: employeesData } = useQuery('employees', () => employeeService.getAll(), { enabled: open });

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      employeeId: '',
      categoryId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  });

  const categoryId = watch('categoryId');
  const selectedCategory = categoriesData?.data?.find(c => c.id === categoryId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    }
  });

  const createMutation = useMutation(
    (data) => reimbursementService.create({ ...data, documents: files }),
    {
      onSuccess: () => {
        toast.success('Reimbursement submitted successfully');
        queryClient.invalidateQueries('reimbursements');
        reset();
        setFiles([]);
        setPolicyErrors([]);
        onClose();
      },
      onError: (error) => {
        if (error.response?.data?.errors) {
          setPolicyErrors(error.response.data.errors);
        } else {
          toast.error(error.response?.data?.message || 'Failed to submit reimbursement');
        }
      }
    }
  );

  const onSubmit = (data) => {
    setPolicyErrors([]);
    createMutation.mutate(data);
  };

  const categories = categoriesData?.data || [];
  const employees = employeesData?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Submit Reimbursement</DialogTitle>
        <DialogContent>
          {policyErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Policy Validation Errors:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {policyErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
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
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Category" fullWidth required>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name} {cat.isTaxable && '(Taxable)'}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {selectedCategory && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedCategory.name} | 
                    <strong> Taxable:</strong> {selectedCategory.isTaxable ? 'Yes' : 'No'} | 
                    <strong> Documents Required:</strong> {selectedCategory.requiresDocument ? 'Yes' : 'No'}
                  </Typography>
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Controller
                name="amount"
                control={control}
                rules={{ required: 'Amount is required', min: { value: 1, message: 'Amount must be greater than 0' } }}
                render={({ field }) => (
                  <TextField {...field} label="Amount" type="number" step="0.01" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Description" multiline rows={3} fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'background.paper'
                }}
              >
                <input {...getInputProps()} />
                <Typography variant="body2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
                </Typography>
                {files.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {files.length} file(s) selected
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
            Submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}



