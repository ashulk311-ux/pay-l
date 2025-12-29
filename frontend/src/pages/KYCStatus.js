import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employeeService } from '../services/employeeService';
import { documentService } from '../services/documentService';
import DataTable from '../components/DataTable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';

export default function KYCStatus() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [verifyDialogOpen, setVerifyDialogOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState(null);

  const { data: employeeData } = useQuery(
    ['employee', id],
    () => employeeService.getById(id),
    { enabled: !!id }
  );

  const { data: documentsData } = useQuery(
    ['employeeDocuments', id],
    () => documentService.getEmployeeDocuments(id),
    { enabled: !!id }
  );

  const verifyMutation = useMutation(
    ({ documentId, isVerified, remarks }) => documentService.verifyDocument(documentId, isVerified, remarks),
    {
      onSuccess: () => {
        toast.success('Document verification updated');
        queryClient.invalidateQueries(['employeeDocuments', id]);
        queryClient.invalidateQueries(['employee', id]);
        setVerifyDialogOpen(false);
        setSelectedDoc(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to verify document');
      }
    }
  );

  const employee = employeeData?.data;
  const documents = documentsData?.data || [];

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'rejected': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getKYCStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon />;
      case 'rejected': return <CancelIcon />;
      case 'in_progress': return <PendingIcon />;
      default: return <PendingIcon />;
    }
  };

  const handleVerify = (document) => {
    setSelectedDoc(document);
    setVerifyDialogOpen(true);
  };

  const handleVerifySubmit = (isVerified, remarks) => {
    verifyMutation.mutate({
      documentId: selectedDoc.id,
      isVerified,
      remarks
    });
  };

  const columns = [
    { id: 'documentType', label: 'Document Type', minWidth: 150 },
    { id: 'fileName', label: 'File Name', minWidth: 200 },
    {
      id: 'isVerified',
      label: 'Status',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={value ? 'Verified' : 'Pending'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      id: 'verifiedAt',
      label: 'Verified At',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      format: (value, row) => (
        <Box>
          <Button size="small" onClick={() => documentService.downloadDocument(row.id).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = row.fileName;
            a.click();
          })}>
            Download
          </Button>
          {!row.isVerified && (
            <Button size="small" color="primary" onClick={() => handleVerify(row)}>
              Verify
            </Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          KYC Status - {employee?.firstName} {employee?.lastName}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Employee Code: {employee?.employeeCode}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Overall KYC Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              {getKYCStatusIcon(employee?.kycStatus)}
              <Chip
                label={employee?.kycStatus?.toUpperCase() || 'PENDING'}
                color={getKYCStatusColor(employee?.kycStatus)}
                size="large"
              />
            </Box>
            {employee?.kycVerifiedAt && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Verified on: {new Date(employee.kycVerifiedAt).toLocaleDateString()}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Documents</Typography>
            <DataTable
              columns={columns}
              data={documents}
              searchable
              searchPlaceholder="Search documents..."
            />
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)}>
        <DialogTitle>Verify Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 400 }}>
            <Typography variant="body1">
              Document: {selectedDoc?.documentType} - {selectedDoc?.fileName}
            </Typography>
            <TextField
              label="Remarks (Optional)"
              multiline
              rows={3}
              fullWidth
              id="remarks"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => handleVerifySubmit(false, document.getElementById('remarks').value)}
          >
            Reject
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={() => handleVerifySubmit(true, document.getElementById('remarks').value)}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}



