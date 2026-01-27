import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { itDeclarationService } from '../services/itDeclarationService';
import { portalService } from '../services/portalService';
import { useAuth } from '../context/AuthContext';

export default function ITDeclaration() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sections, setSections] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState({});

  // Check if accessed from portal
  const isPortal = location.pathname.startsWith('/portal/it-declaration');
  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  const { data: sectionsData } = useQuery(
    'itDeclarationSections',
    () => itDeclarationService.getSections(),
    { enabled: !!user?.companyId }
  );

  const { data: declarationData } = useQuery(
    ['itDeclaration', isPortal ? 'portal' : user?.employeeId, financialYear],
    () => isPortal 
      ? portalService.getITDeclaration()
      : itDeclarationService.getITDeclaration(user?.employeeId, financialYear),
    { enabled: isPortal || !!user?.employeeId }
  );

  const { handleSubmit } = useForm({
    defaultValues: {
      financialYear
    }
  });

  useEffect(() => {
    const declaration = isPortal ? declarationData?.data : declarationData?.data?.declaration;
    if (declaration) {
      let sectionData = {};
      
      // Portal format: declarations object with section codes as keys
      if (isPortal && declaration.declarations) {
        sectionData = declaration.declarations;
      } else if (!isPortal) {
        // Admin format: flat structure with section codes
        if (declaration.section80C) sectionData['80C'] = { amount: declaration.section80C, details: declaration.section80CDetails || {} };
        if (declaration.section80D) sectionData['80D'] = { amount: declaration.section80D, details: declaration.section80DDetails || {} };
        if (declaration.section80G) sectionData['80G'] = { amount: declaration.section80G, details: declaration.section80GDetails || {} };
        if (declaration.section80TTA) sectionData['80TTA'] = { amount: declaration.section80TTA, details: declaration.section80TTADetails || {} };
        if (declaration.section24B) sectionData['24B'] = { amount: declaration.section24B, details: declaration.section24BDetails || {} };
        if (declaration.section80EE) sectionData['80EE'] = { amount: declaration.section80EE, details: declaration.section80EEDetails || {} };
      }
      
      setSections(sectionData);
    }
  }, [declarationData, isPortal]);

  const submitMutation = useMutation(
    (data) => isPortal 
      ? portalService.submitITDeclaration(data)
      : itDeclarationService.submitITDeclaration(data),
    {
      onSuccess: () => {
        toast.success('IT declaration saved successfully');
        queryClient.invalidateQueries(['itDeclaration']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save IT declaration');
      }
    }
  );

  const uploadMutation = useMutation(
    ({ declarationId, file, sectionCode }) => itDeclarationService.uploadDocument(declarationId, file, sectionCode),
    {
      onSuccess: (response, variables) => {
        toast.success('Document uploaded successfully');
        setUploadedDocs(prev => ({
          ...prev,
          [variables.sectionCode]: response.data
        }));
        queryClient.invalidateQueries(['itDeclaration', user?.employeeId]);
      },
      onError: () => {
        toast.error('Failed to upload document');
      }
    }
  );

  const onSubmit = (formData) => {
    const submitData = isPortal
      ? {
          financialYear: formData.financialYear,
          declarations: sections,
          status: 'submitted'
        }
      : {
          employeeId: user?.employeeId,
          financialYear: formData.financialYear,
          sections,
          status: 'submitted'
        };
    submitMutation.mutate(submitData);
  };

  const handleSaveDraft = (formData) => {
    const submitData = isPortal
      ? {
          financialYear: formData.financialYear,
          declarations: sections,
          status: 'draft'
        }
      : {
          employeeId: user?.employeeId,
          financialYear: formData.financialYear,
          sections,
          status: 'draft'
        };
    submitMutation.mutate(submitData);
  };

  const handleFileUpload = (sectionCode, file) => {
    const declaration = declarationData?.data?.declaration;
    if (!declaration) {
      toast.error('Please save the declaration first');
      return;
    }
    uploadMutation.mutate({
      declarationId: declaration.id,
      file,
      sectionCode
    });
  };

  const declaration = isPortal ? declarationData?.data : declarationData?.data?.declaration;
  const availableSections = sectionsData?.data || [];

  const totalDeclared = Object.values(sections).reduce((sum, section) => {
    return sum + parseFloat(section.amount || 0);
  }, 0);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          IT Declaration
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Financial Year: {financialYear}
        </Typography>
      </Box>

      {declaration && (
        <Alert severity={declaration.status === 'approved' ? 'success' : declaration.status === 'rejected' ? 'error' : 'info'} sx={{ mb: 3 }}>
          Status: <strong>{declaration.status.toUpperCase()}</strong>
          {declaration.reviewRemarks && ` - ${declaration.reviewRemarks}`}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: 3 }}>
          {availableSections.map((section) => (
            <Accordion key={section.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                  <Typography variant="h6">{section.sectionName}</Typography>
                  {section.maxAmount && (
                    <Chip label={`Max: ₹${section.maxAmount.toLocaleString()}`} size="small" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {section.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Declared Amount (₹)"
                      type="number"
                      fullWidth
                      value={sections[section.sectionCode]?.amount || ''}
                      onChange={(e) => setSections({
                        ...sections,
                        [section.sectionCode]: {
                          ...sections[section.sectionCode],
                          amount: parseFloat(e.target.value) || 0
                        }
                      })}
                      inputProps={{ max: section.maxAmount || undefined }}
                    />
                  </Grid>
                  {section.requiresDocument && (
                    <Grid item xs={12} md={6}>
                      <input
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        id={`file-upload-${section.sectionCode}`}
                        type="file"
                        onChange={(e) => handleFileUpload(section.sectionCode, e.target.files[0])}
                      />
                      <label htmlFor={`file-upload-${section.sectionCode}`}>
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          fullWidth
                          disabled={uploadMutation.isLoading}
                        >
                          {uploadedDocs[section.sectionCode] ? 'Document Uploaded' : 'Upload Document'}
                        </Button>
                      </label>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="h6" align="right">
              Total Declared Amount: ₹{totalDeclared.toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handleSubmit(handleSaveDraft)}
              disabled={submitMutation.isLoading}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitMutation.isLoading || declaration?.status === 'approved'}
            >
              Submit for Review
            </Button>
          </Box>
        </Paper>
      </form>
    </Container>
  );
}


