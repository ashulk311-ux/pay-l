import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { companyService } from '../../services/companyService';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3, maxHeight: '70vh', overflowY: 'auto' }}>{children}</Box>}
    </div>
  );
}

export default function CompanySettings({ company }) {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);

  // Fetch company settings
  const { data: settingsData } = useQuery(
    ['companySettings', company?.id],
    () => companyService.getCompanySettings(company?.id),
    { enabled: !!company?.id, refetchOnWindowFocus: false }
  );

  const settings = React.useMemo(() => settingsData?.data || {}, [settingsData]);

  // Bank Details Form
  const bankDetailsForm = useForm({
    defaultValues: company ? {
      bankName: company.bankName || '',
      bankAccountNumber: company.bankAccountNumber || '',
      bankBranch: company.bankBranch || '',
      bankAddress: company.bankAddress || '',
      bankIfscCode: company.bankIfscCode || ''
    } : {}
  });

  // Custom Messages Form
  const customMessagesForm = useForm({
    defaultValues: settings.customMessages || {
      saveMessage: '',
      saveCaption: '',
      updateMessage: '',
      updateCaption: '',
      requiredFieldMessage: '',
      duplicateRecordMessage: '',
      deleteConfirmMessage: '',
      deleteSuccessMessage: '',
      deleteFailMessage: '',
      minimumYear: '',
      maximumYear: '',
      reportFooter: ''
    }
  });

  // Employee Parameters Form
  const employeeParametersForm = useForm({
    defaultValues: settings.employeeParameters || {
      defaultPasswordType: 'temporary',
      pensionAgeLimit: 60,
      forcePasswordChangeOnESS: false,
      maxAssetsPerEmployee: 0,
      maxLoanMonths: 0,
      automaticEmployeeCode: false,
      displayHistoryMessage: false,
      employeeHistoryRecord: false,
      automaticLWFApplicable: false,
      groupCompanyTransfer: false,
      automaticPTApplicable: false,
      loanInterestBasedOnOpeningBalance: false
    }
  });

  // Mail Parameters Form
  const mailParametersForm = useForm({
    defaultValues: settings.mailParameters || {
      sendEmailFromEmployeeToAdminChapterVIA: false,
      sendEmailOnReimbursementApproval: false,
      sendEmailToSolutionProviderOnTicketReopen: false,
      sendEmailFromAdminToEmployeeChapterVIA: false,
      sendEmailOnReimbursementRequest: false,
      sendMailToSolutionProviderOfTicket: false,
      sendEmailToEmployeeTicket: false,
      sendEmailToNextLevel: false,
      sendEmailToAdmin: false
    }
  });

  // Attendance Parameters Form
  const attendanceParametersForm = useForm({
    defaultValues: settings.attendanceParameters || {
      attendanceProcessMethod: 'daily',
      maxHolidaysForEmployee: 0,
      staffId: '',
      foodingPartOfGross: false,
      enableAudit: false,
      stateWiseHoliday: false,
      autoAssignHoliday: false,
      allowNightAllowanceOnDayShift: false
    }
  });

  // Salary Parameters Form
  const salaryParametersForm = useForm({
    defaultValues: settings.salaryParameters || {
      salaryStructureAssignmentMethod: 'grade',
      shiftAssignmentMethod: 'manual',
      overtimeAssignmentMethod: 'manual',
      payArrearWithSalary: false,
      arrearCalculationMethod: 'standard',
      cutOffDayOfMonth: 25,
      salaryRoundOff: 'nearest_rupee',
      roundingOfOvertime: 'nearest_rupee',
      showCompanyAddressOnFNFSlips: false,
      showStaffIdAsEmployeeCode: false,
      showVariablePayheadOnManualArrear: false,
      allowAutoDeductTravelAdvance: false
    }
  });

  // Other Settings Form
  const otherSettingsForm = useForm({
    defaultValues: settings.otherSettings || {
      exportExcelSheetWithTotalBill: false,
      estimateReimbursementAmount: false,
      showAllTabDataOnProcessForms: false,
      checkEmployeePendingTaskOnFNF: false,
      validateEmployeeCodeOnIndividualFNF: false,
      autoAdjustmentLoanOrAdvanceOnFNF: false,
      giveAuthorityToEditReimbursementRequest: false,
      accountingPerson: '',
      giveAuthorityToEditExpense: false,
      maxNumberOfRequestForFBP: 0,
      numberOfDaysOfLeaveEncashment: 0,
      gratuityLimit: 1000000,
      gratuityRoundOffBy: 6,
      imageType: 'jpg,jpeg,png,gif',
      documentType: 'doc,pdf,xls,zip,docx,jpeg,jpg,xlsx,ppt',
      calculateGratuityOn: '4 Years 8 Months',
      employeeFilterBasedOn: 'employeeCode',
      documentSizeUploadUptoMB: 10,
      serviceCharge: 18,
      maxNoOfDaysOpenFormInMonth: 31
    }
  });

  // Password Policy Form
  const passwordPolicyForm = useForm({
    defaultValues: settings.passwordPolicy || {
      mustBeAlphanumeric: false,
      mustBeCaseSensitive: false,
      minimumCharacters: 8,
      maximumCharacters: 8,
      minimumSpecialCharacters: 0,
      minimumNumericCharacters: 1,
      selectFieldsForIdenticalCheck: [],
      applicableLSTDeduction: false,
      paymentCheckMonthForLSTDeduction: '',
      startDeductionMonth: '',
      numberOfInstalmentToBeDeducted: 0,
      advanceSalaryPercentage: 0
    }
  });

  // SMTP Form
  const smtpForm = useForm({
    defaultValues: company ? {
      smtpHost: company.smtpHost || '',
      smtpPort: company.smtpPort || 587,
      smtpUser: company.smtpUser || '',
      smtpPassword: ''
    } : {}
  });

  // WhatsApp Form
  const whatsappForm = useForm({
    defaultValues: company ? {
      whatsappEnabled: company.whatsappEnabled || false,
      twilioAccountSid: company.twilioAccountSid || '',
      twilioAuthToken: company.twilioAuthToken || '',
      twilioPhoneNumber: company.twilioPhoneNumber || ''
    } : {}
  });

  // Employee Code Form
  const employeeCodeForm = useForm({
    defaultValues: company ? {
      employeeCodeGenerationMode: company.employeeCodeGenerationMode || 'manual',
      employeeCodePrefix: company.employeeCodePrefix || 'EMP',
      employeeCodeFormat: company.employeeCodeFormat || '{PREFIX}{NUMBER}',
      matrixSoftwareIntegration: company.matrixSoftwareIntegration || false,
      matrixApiKey: company.matrixApiKey || '',
      matrixApiUrl: company.matrixApiUrl || ''
    } : {}
  });

  // Mutations
  const bankDetailsMutation = useMutation(
    (data) => companyService.updateBankDetails(company.id, data),
    {
      onSuccess: () => {
        toast.success('Bank details updated successfully');
        queryClient.invalidateQueries('myCompany');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update bank details');
      }
    }
  );

  const customMessagesMutation = useMutation(
    (data) => companyService.updateCustomMessages(company.id, data),
    {
      onSuccess: () => {
        toast.success('Custom messages updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update custom messages');
      }
    }
  );

  const employeeParametersMutation = useMutation(
    (data) => companyService.updateEmployeeParameters(company.id, data),
    {
      onSuccess: () => {
        toast.success('Employee parameters updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update employee parameters');
      }
    }
  );

  const mailParametersMutation = useMutation(
    (data) => companyService.updateMailParameters(company.id, data),
    {
      onSuccess: () => {
        toast.success('Mail parameters updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update mail parameters');
      }
    }
  );

  const attendanceParametersMutation = useMutation(
    (data) => companyService.updateAttendanceParameters(company.id, data),
    {
      onSuccess: () => {
        toast.success('Attendance parameters updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update attendance parameters');
      }
    }
  );

  const salaryParametersMutation = useMutation(
    (data) => companyService.updateSalaryParameters(company.id, data),
    {
      onSuccess: () => {
        toast.success('Salary parameters updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update salary parameters');
      }
    }
  );

  const otherSettingsMutation = useMutation(
    (data) => companyService.updateOtherSettings(company.id, data),
    {
      onSuccess: () => {
        toast.success('Other settings updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update other settings');
      }
    }
  );

  const passwordPolicyMutation = useMutation(
    (data) => companyService.updatePasswordPolicy(company.id, data),
    {
      onSuccess: () => {
        toast.success('Password policy updated successfully');
        queryClient.invalidateQueries(['companySettings', company.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update password policy');
      }
    }
  );

  const smtpMutation = useMutation(
    (data) => companyService.updateSMTPConfig(company.id, data),
    {
      onSuccess: () => {
        toast.success('SMTP configuration updated successfully');
        queryClient.invalidateQueries('myCompany');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update SMTP configuration');
      }
    }
  );

  const whatsappMutation = useMutation(
    (data) => companyService.updateWhatsAppConfig(company.id, data),
    {
      onSuccess: () => {
        toast.success('WhatsApp configuration updated successfully');
        queryClient.invalidateQueries('myCompany');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update WhatsApp configuration');
      }
    }
  );

  const employeeCodeMutation = useMutation(
    (data) => companyService.updateEmployeeCodeSettings(company.id, data),
    {
      onSuccess: () => {
        toast.success('Employee code settings updated successfully');
        queryClient.invalidateQueries('myCompany');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update employee code settings');
      }
    }
  );

  // Update forms when settings data loads
  useEffect(() => {
    if (settings.customMessages) {
      customMessagesForm.reset(settings.customMessages);
    }
    if (settings.employeeParameters) {
      employeeParametersForm.reset(settings.employeeParameters);
    }
    if (settings.mailParameters) {
      mailParametersForm.reset(settings.mailParameters);
    }
    if (settings.attendanceParameters) {
      attendanceParametersForm.reset(settings.attendanceParameters);
    }
    if (settings.salaryParameters) {
      salaryParametersForm.reset(settings.salaryParameters);
    }
    if (settings.otherSettings) {
      otherSettingsForm.reset(settings.otherSettings);
    }
    if (settings.passwordPolicy) {
      passwordPolicyForm.reset(settings.passwordPolicy);
    }
  }, [settings, customMessagesForm, employeeParametersForm, mailParametersForm, attendanceParametersForm, salaryParametersForm, otherSettingsForm, passwordPolicyForm]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!company) {
    return <Typography>Company not found</Typography>;
  }

  return (
    <Box>
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Bank Details" />
            <Tab label="Custom Messages" />
            <Tab label="Employee Parameters" />
            <Tab label="Mail Parameters" />
            <Tab label="Attendance Parameters" />
            <Tab label="Salary Parameters" />
            <Tab label="Other Settings" />
            <Tab label="Password Policy" />
            <Tab label="SMTP Configuration" />
            <Tab label="WhatsApp Configuration" />
            <Tab label="Employee Code Settings" />
          </Tabs>
        </Box>

        {/* Bank Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={bankDetailsForm.handleSubmit((data) => bankDetailsMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="bankName"
                  control={bankDetailsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Bank Name" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="bankAccountNumber"
                  control={bankDetailsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Account Number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="bankBranch"
                  control={bankDetailsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Branch" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="bankIfscCode"
                  control={bankDetailsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="IFSC Code" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="bankAddress"
                  control={bankDetailsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Bank Address" fullWidth multiline rows={3} />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={bankDetailsMutation.isLoading}>
                Update Bank Details
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Custom Messages Tab */}
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={customMessagesForm.handleSubmit((data) => customMessagesMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="saveMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Save Message" fullWidth multiline rows={2} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="saveCaption"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Save Caption" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="updateMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Update Message" fullWidth multiline rows={2} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="updateCaption"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Update Caption" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="requiredFieldMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Required Field Message" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="duplicateRecordMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Duplicate Record Message" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="deleteConfirmMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Delete Confirm Message" fullWidth multiline rows={2} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="deleteSuccessMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Delete Success Message" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="deleteFailMessage"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Delete Fail Message" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="minimumYear"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Minimum Year" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maximumYear"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Maximum Year" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="reportFooter"
                  control={customMessagesForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Report Footer" fullWidth multiline rows={3} />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={customMessagesMutation.isLoading}>
                Update Custom Messages
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Employee Parameters Tab - Due to length, showing key fields */}
        <TabPanel value={tabValue} index={2}>
          <form onSubmit={employeeParametersForm.handleSubmit((data) => employeeParametersMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="defaultPasswordType"
                  control={employeeParametersForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Default Password Type</InputLabel>
                      <Select {...field} label="Default Password Type">
                        <MenuItem value="temporary">Temporary</MenuItem>
                        <MenuItem value="permanent">Permanent</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="pensionAgeLimit"
                  control={employeeParametersForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Pension Age Limit" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maxAssetsPerEmployee"
                  control={employeeParametersForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Max Assets Per Employee" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maxLoanMonths"
                  control={employeeParametersForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Max Loan Months" type="number" fullWidth />
                  )}
                />
              </Grid>
              {[
                'forcePasswordChangeOnESS',
                'automaticEmployeeCode',
                'displayHistoryMessage',
                'employeeHistoryRecord',
                'automaticLWFApplicable',
                'groupCompanyTransfer',
                'automaticPTApplicable',
                'loanInterestBasedOnOpeningBalance'
              ].map((fieldName) => (
                <Grid item xs={12} md={6} key={fieldName}>
                  <Controller
                    name={fieldName}
                    control={employeeParametersForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={employeeParametersMutation.isLoading}>
                Update Employee Parameters
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Mail Parameters Tab */}
        <TabPanel value={tabValue} index={3}>
          <form onSubmit={mailParametersForm.handleSubmit((data) => mailParametersMutation.mutate(data))}>
            <Grid container spacing={3}>
              {[
                'sendEmailFromEmployeeToAdminChapterVIA',
                'sendEmailOnReimbursementApproval',
                'sendEmailToSolutionProviderOnTicketReopen',
                'sendEmailFromAdminToEmployeeChapterVIA',
                'sendEmailOnReimbursementRequest',
                'sendMailToSolutionProviderOfTicket',
                'sendEmailToEmployeeTicket',
                'sendEmailToNextLevel',
                'sendEmailToAdmin'
              ].map((fieldName) => (
                <Grid item xs={12} md={6} key={fieldName}>
                  <Controller
                    name={fieldName}
                    control={mailParametersForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={mailParametersMutation.isLoading}>
                Update Mail Parameters
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Attendance Parameters Tab */}
        <TabPanel value={tabValue} index={4}>
          <form onSubmit={attendanceParametersForm.handleSubmit((data) => attendanceParametersMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="attendanceProcessMethod"
                  control={attendanceParametersForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Attendance Process Method</InputLabel>
                      <Select {...field} label="Attendance Process Method">
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maxHolidaysForEmployee"
                  control={attendanceParametersForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Max Holidays For Employee" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="staffId"
                  control={attendanceParametersForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Staff ID" fullWidth />
                  )}
                />
              </Grid>
              {[
                'foodingPartOfGross',
                'enableAudit',
                'stateWiseHoliday',
                'autoAssignHoliday',
                'allowNightAllowanceOnDayShift'
              ].map((fieldName) => (
                <Grid item xs={12} md={6} key={fieldName}>
                  <Controller
                    name={fieldName}
                    control={attendanceParametersForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={attendanceParametersMutation.isLoading}>
                Update Attendance Parameters
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Salary Parameters Tab */}
        <TabPanel value={tabValue} index={5}>
          <form onSubmit={salaryParametersForm.handleSubmit((data) => salaryParametersMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="salaryStructureAssignmentMethod"
                  control={salaryParametersForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Salary Structure Assignment Method</InputLabel>
                      <Select {...field} label="Salary Structure Assignment Method">
                        <MenuItem value="grade">Grade</MenuItem>
                        <MenuItem value="designation">Designation</MenuItem>
                        <MenuItem value="employee">Employee</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="cutOffDayOfMonth"
                  control={salaryParametersForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Cut Off Day of Month" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="salaryRoundOff"
                  control={salaryParametersForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Salary Round Off</InputLabel>
                      <Select {...field} label="Salary Round Off">
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="nearest_rupee">Nearest Rupee</MenuItem>
                        <MenuItem value="higher_rupee">Higher Rupee</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              {[
                'payArrearWithSalary',
                'showCompanyAddressOnFNFSlips',
                'showStaffIdAsEmployeeCode',
                'showVariablePayheadOnManualArrear',
                'allowAutoDeductTravelAdvance'
              ].map((fieldName) => (
                <Grid item xs={12} md={6} key={fieldName}>
                  <Controller
                    name={fieldName}
                    control={salaryParametersForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={salaryParametersMutation.isLoading}>
                Update Salary Parameters
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Other Settings Tab - Showing key fields */}
        <TabPanel value={tabValue} index={6}>
          <form onSubmit={otherSettingsForm.handleSubmit((data) => otherSettingsMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="gratuityLimit"
                  control={otherSettingsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Gratuity Limit" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="documentSizeUploadUptoMB"
                  control={otherSettingsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Document Size Upload Upto (MB)" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="serviceCharge"
                  control={otherSettingsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Service Charge (%)" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maxNoOfDaysOpenFormInMonth"
                  control={otherSettingsForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Max Days Open Form in Month" type="number" fullWidth />
                  )}
                />
              </Grid>
              {[
                'exportExcelSheetWithTotalBill',
                'estimateReimbursementAmount',
                'showAllTabDataOnProcessForms',
                'checkEmployeePendingTaskOnFNF',
                'validateEmployeeCodeOnIndividualFNF',
                'autoAdjustmentLoanOrAdvanceOnFNF',
                'giveAuthorityToEditReimbursementRequest',
                'giveAuthorityToEditExpense'
              ].map((fieldName) => (
                <Grid item xs={12} md={6} key={fieldName}>
                  <Controller
                    name={fieldName}
                    control={otherSettingsForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={otherSettingsMutation.isLoading}>
                Update Other Settings
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Password Policy Tab */}
        <TabPanel value={tabValue} index={7}>
          <form onSubmit={passwordPolicyForm.handleSubmit((data) => passwordPolicyMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="minimumCharacters"
                  control={passwordPolicyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Minimum Characters" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maximumCharacters"
                  control={passwordPolicyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Maximum Characters" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="minimumSpecialCharacters"
                  control={passwordPolicyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Minimum Special Characters" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="minimumNumericCharacters"
                  control={passwordPolicyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Minimum Numeric Characters" type="number" fullWidth />
                  )}
                />
              </Grid>
              {[
                'mustBeAlphanumeric',
                'mustBeCaseSensitive',
                'applicableLSTDeduction'
              ].map((fieldName) => (
                <Grid item xs={12} md={6} key={fieldName}>
                  <Controller
                    name={fieldName}
                    control={passwordPolicyForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={passwordPolicyMutation.isLoading}>
                Update Password Policy
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* SMTP Configuration Tab - Existing */}
        <TabPanel value={tabValue} index={8}>
          <form onSubmit={smtpForm.handleSubmit((data) => smtpMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="smtpHost"
                  control={smtpForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="SMTP Host" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="smtpPort"
                  control={smtpForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="SMTP Port" type="number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="smtpUser"
                  control={smtpForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="SMTP Username" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="smtpPassword"
                  control={smtpForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="SMTP Password" type="password" fullWidth />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={smtpMutation.isLoading}>
                Update SMTP Configuration
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* WhatsApp Configuration Tab - Existing */}
        <TabPanel value={tabValue} index={9}>
          <form onSubmit={whatsappForm.handleSubmit((data) => whatsappMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="whatsappEnabled"
                  control={whatsappForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable WhatsApp Notifications"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="twilioAccountSid"
                  control={whatsappForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Twilio Account SID" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="twilioAuthToken"
                  control={whatsappForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Twilio Auth Token" type="password" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="twilioPhoneNumber"
                  control={whatsappForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Twilio Phone Number" fullWidth />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={whatsappMutation.isLoading}>
                Update WhatsApp Configuration
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Employee Code Settings Tab - Existing */}
        <TabPanel value={tabValue} index={10}>
          <form onSubmit={employeeCodeForm.handleSubmit((data) => employeeCodeMutation.mutate(data))}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="employeeCodeGenerationMode"
                  control={employeeCodeForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Generation Mode</InputLabel>
                      <Select {...field} label="Generation Mode">
                        <MenuItem value="manual">Manual</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                        <MenuItem value="matrix">Matrix Software</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="employeeCodePrefix"
                  control={employeeCodeForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Code Prefix" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="employeeCodeFormat"
                  control={employeeCodeForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Code Format"
                      fullWidth
                      helperText="Use {PREFIX}, {YEAR}, {NUMBER}, {DEPARTMENT} as placeholders"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="matrixSoftwareIntegration"
                  control={employeeCodeForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable Matrix Software Integration"
                    />
                  )}
                />
              </Grid>
              {employeeCodeForm.watch('matrixSoftwareIntegration') && (
                <>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="matrixApiKey"
                      control={employeeCodeForm.control}
                      render={({ field }) => (
                        <TextField {...field} label="Matrix API Key" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="matrixApiUrl"
                      control={employeeCodeForm.control}
                      render={({ field }) => (
                        <TextField {...field} label="Matrix API URL" fullWidth />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={employeeCodeMutation.isLoading}>
                Update Employee Code Settings
              </Button>
            </Box>
          </form>
        </TabPanel>
      </Paper>
    </Box>
  );
}
