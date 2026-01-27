import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { itDeclarationService } from '../services/itDeclarationService';
import DataTable from '../components/DataTable';

export default function ITDeclarationReview() {
  const queryClient = useQueryClient();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);

  const { data: declarationsData } = useQuery(
    'allITDeclarations',
    () => itDeclarationService.getAllITDeclarations({ status: 'submitted' })
  );

  const reviewMutation = useMutation(
    ({ id, status, remarks }) => itDeclarationService.reviewITDeclaration(id, status, remarks),
    {
      onSuccess: () => {
        toast.success('IT declaration reviewed successfully');
        queryClient.invalidateQueries('allITDeclarations');
        setReviewDialogOpen(false);
        setSelectedDeclaration(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to review IT declaration');
      }
    }
  );

  const handleReview = (declaration) => {
    setSelectedDeclaration(declaration);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = (status, remarks) => {
    reviewMutation.mutate({
      id: selectedDeclaration.id,
      status,
      remarks
    });
  };

  const declarations = declarationsData?.data || [];

  const columns = [
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 150,
      format: (value, row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''} (${row.employee?.employeeCode || ''})`
    },
    { id: 'financialYear', label: 'Financial Year', minWidth: 120 },
    {
      id: 'totalDeclaredAmount',
      label: 'Total Declared',
      minWidth: 120,
      format: (value) => `₹${(value || 0).toLocaleString()}`
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value?.toUpperCase() || 'DRAFT'}
          color={value === 'approved' ? 'success' : value === 'rejected' ? 'error' : 'warning'}
          size="small"
        />
      )
    },
    {
      id: 'submittedAt',
      label: 'Submitted At',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      format: (value, row) => (
        <Button size="small" variant="outlined" onClick={() => handleReview(row)}>
          Review
        </Button>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          IT Declaration Review
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Review and approve/reject employee IT declarations
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        data={declarations}
        searchable
        searchPlaceholder="Search declarations..."
      />

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review IT Declaration</DialogTitle>
        <DialogContent>
          {selectedDeclaration && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Employee</Typography>
                  <Typography variant="body1">
                    {selectedDeclaration.employee?.firstName} {selectedDeclaration.employee?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Financial Year</Typography>
                  <Typography variant="body1">{selectedDeclaration.financialYear}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Total Declared Amount</Typography>
                  <Typography variant="h6">₹{selectedDeclaration.totalDeclaredAmount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Remarks"
                    multiline
                    rows={3}
                    fullWidth
                    id="reviewRemarks"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => handleReviewSubmit('rejected', document.getElementById('reviewRemarks')?.value || '')}
            disabled={reviewMutation.isLoading}
          >
            Reject
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={() => handleReviewSubmit('approved', document.getElementById('reviewRemarks')?.value || '')}
            disabled={reviewMutation.isLoading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}



