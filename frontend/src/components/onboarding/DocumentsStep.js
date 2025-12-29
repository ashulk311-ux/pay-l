import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  IconButton,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { documentService } from '../../services/documentService';

const documentTypes = [
  { code: 'AADHAAR', label: 'Aadhaar Card', required: true },
  { code: 'PAN', label: 'PAN Card', required: true },
  { code: 'PHOTO', label: 'Photo', required: true },
  { code: 'PASSPORT', label: 'Passport', required: false },
  { code: 'UAN', label: 'UAN Card', required: false },
  { code: 'ADDRESS_PROOF', label: 'Address Proof', required: true },
  { code: 'BANK_DETAILS', label: 'Bank Details', required: true }
];

export default function DocumentsStep({ token, employeeId, onNext, onBack }) {
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploading, setUploading] = useState({});

  const uploadMutation = useMutation(
    ({ file, documentType }) => documentService.uploadDocument(employeeId, file, documentType),
    {
      onSuccess: (response, variables) => {
        setUploadedDocs(prev => ({
          ...prev,
          [variables.documentType]: response.data
        }));
        toast.success(`${variables.documentType} uploaded successfully`);
        setUploading(prev => ({ ...prev, [variables.documentType]: false }));
      },
      onError: (error, variables) => {
        toast.error(`Failed to upload ${variables.documentType}`);
        setUploading(prev => ({ ...prev, [variables.documentType]: false }));
      }
    }
  );

  const handleFileUpload = (documentType, file) => {
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [documentType]: true }));
    uploadMutation.mutate({ file, documentType });
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(documentType, file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNext = () => {
    // Check if all required documents are uploaded
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const allRequiredUploaded = requiredDocs.every(doc => uploadedDocs[doc.code]);
    
    if (!allRequiredUploaded) {
      toast.error('Please upload all required documents');
      return;
    }
    
    onNext({ documents: uploadedDocs });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Documents
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please upload the following documents. Required documents are marked with *
      </Typography>

      <Grid container spacing={2}>
        {documentTypes.map((docType) => (
          <Grid item xs={12} md={6} key={docType.code}>
            <Paper
              sx={{
                p: 2,
                border: '2px dashed',
                borderColor: uploadedDocs[docType.code] ? 'success.main' : 'grey.300',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
              }}
              onDrop={(e) => handleDrop(e, docType.code)}
              onDragOver={handleDragOver}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  {docType.label} {docType.required && '*'}
                </Typography>
                
                {uploadedDocs[docType.code] ? (
                  <Box>
                    <Typography variant="body2" color="success.main">
                      ✓ {uploadedDocs[docType.code].fileName}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const newDocs = { ...uploadedDocs };
                        delete newDocs[docType.code];
                        setUploadedDocs(newDocs);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Box>
                    <input
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      id={`file-upload-${docType.code}`}
                      type="file"
                      onChange={(e) => handleFileUpload(docType.code, e.target.files[0])}
                    />
                    <label htmlFor={`file-upload-${docType.code}`}>
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploading[docType.code]}
                        fullWidth
                      >
                        {uploading[docType.code] ? 'Uploading...' : 'Upload File'}
                      </Button>
                    </label>
                    {uploading[docType.code] && (
                      <LinearProgress sx={{ mt: 1 }} />
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </Box>
  );
}



