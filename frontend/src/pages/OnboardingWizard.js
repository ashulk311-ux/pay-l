import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { onboardingService } from '../services/onboardingService';
import PersonalInfoStep from '../components/onboarding/PersonalInfoStep';
import EmploymentDetailsStep from '../components/onboarding/EmploymentDetailsStep';
import DocumentsStep from '../components/onboarding/DocumentsStep';
import BankDetailsStep from '../components/onboarding/BankDetailsStep';
import StatutoryStep from '../components/onboarding/StatutoryStep';
import ExtraFieldsStep from '../components/onboarding/ExtraFieldsStep';
import SignatureStep from '../components/onboarding/SignatureStep';

const steps = [
  'Personal Information',
  'Employment Details',
  'Documents',
  'Bank Details',
  'Statutory Information',
  'Extra Fields',
  'Digital Signature'
];

export default function OnboardingWizard() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});

  const { data, isLoading, error } = useQuery(
    ['onboardingForm', token],
    () => onboardingService.getForm(token),
    {
      retry: false,
      onError: () => {
        toast.error('Invalid or expired onboarding link');
        setTimeout(() => navigate('/'), 3000);
      }
    }
  );

  const submitMutation = useMutation(
    ({ step, data }) => onboardingService.submitStep(token, step, data),
    {
      onSuccess: (response) => {
        const onboarding = response.data;
        if (onboarding.status === 'completed') {
          toast.success('Onboarding completed successfully!');
          setTimeout(() => navigate('/onboarding-complete'), 2000);
        } else {
          toast.success('Step saved successfully');
          setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save step');
      }
    }
  );

  useEffect(() => {
    if (data?.data?.onboarding) {
      const onboarding = data.data.onboarding;
      setActiveStep(onboarding.currentStep || 0);
      setFormData(data.data.employee || {});
    }
  }, [data]);

  const handleNext = (stepData) => {
    const stepNames = ['personal_info', 'employment_details', 'documents', 'bank_details', 'statutory', 'extra_fields', 'signature'];
    submitMutation.mutate({
      step: stepNames[activeStep],
      data: stepData
    });
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading onboarding form...</Typography>
      </Container>
    );
  }

  if (error || !data?.data) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error?.response?.data?.message || 'Invalid or expired onboarding link'}
        </Alert>
      </Container>
    );
  }

  const { onboarding, employee, dynamicFields } = data.data;

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <PersonalInfoStep data={formData} onNext={handleNext} />;
      case 1:
        return <EmploymentDetailsStep data={formData} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <DocumentsStep token={token} employeeId={employee.id} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <BankDetailsStep data={formData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <StatutoryStep data={formData} onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <ExtraFieldsStep data={formData} dynamicFields={dynamicFields} onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <SignatureStep onNext={handleNext} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Employee Onboarding
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Welcome {employee?.firstName}! Please complete the following steps to finish your onboarding.
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {renderStepContent()}
        </Box>

        {onboarding?.status === 'completed' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Onboarding completed! You will be redirected shortly.
          </Alert>
        )}
      </Paper>
    </Container>
  );
}



