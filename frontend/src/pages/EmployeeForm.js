import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { designationService } from '../services/designationService';
import { branchService } from '../services/branchService';
import { costCenterService } from '../services/costCenterService';
import { unitService } from '../services/unitService';
import { gradeService } from '../services/gradeService';
import { levelService } from '../services/levelService';
import { subDepartmentService } from '../services/subDepartmentService';
import { officeLocationService } from '../services/officeLocationService';
import { countryService } from '../services/countryService';
import { stateService } from '../services/stateService';
import { cityService } from '../services/cityService';
import { useDropzone } from 'react-dropzone';
import Divider from '@mui/material/Divider';

const steps = [
  'Basic Information',
  'Posting Information',
  'Employment Details',
  'Address Details',
  'Contact & Emergency',
  'Family Details',
  'Qualification & Experience',
  'PF/ESI/PT Details',
  'Other Information',
  'Documents'
];

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);
  const [documents, setDocuments] = useState([]);

  const { handleSubmit, control, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      // Basic Information
      salutation: 'Mr.',
      firstName: '',
      middleName: '',
      lastName: '',
      fatherHusbandName: '',
      motherName: '',
      dateOfBirth: '',
      gender: 'male',
      // Posting Information
      positionId: '',
      employeeType: 'permanent',
      employeeCode: '',
      designationId: '',
      departmentId: '',
      branchId: '',
      costCenterId: '',
      locationId: '',
      unitId: '',
      gradeId: '',
      levelId: '',
      subDepartmentId: '',
      category: '',
      reportingManagerId: '',
      reportingHrId: '',
      staffId: '',
      // Employment Details
      dateOfJoining: '',
      appointmentLetterDate: '',
      ctcAmount: '',
      ctcCurrency: 'INR',
      effectiveFrom: '',
      leaveAssignDate: '',
      leaveTemplate: '',
      oldEmployeeCode: '',
      officialMailId: '',
      pan: '',
      expat: false,
      noticeDays: 0,
      // Date-Dimension
      confirmationDate: '',
      joiningDateForForm5: '',
      gratuityDate: '',
      dateOfPromotion: '',
      dateOfTransfer: '',
      contractStartDate: '',
      contractEndDate: '',
      dateOfRegularization: '',
      leavingDate: '',
      leavingDateForForm10: '',
      settlementDate: '',
      // Address
      currentAddress1: '',
      currentAddress2: '',
      currentCountry: 'India',
      currentState: '',
      currentCity: '',
      currentZip: '',
      permanentAddress1: '',
      permanentAddress2: '',
      permanentCountry: 'India',
      permanentState: '',
      permanentCity: '',
      permanentZip: '',
      sameAsCurrentAddress: false,
      nationality: 'Indian',
      // Contact
      email: '',
      phone: '',
      officePhone: '',
      residencePhone: '',
      mobileNo: '',
      personalMailId: '',
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactAddress: '',
      emergencyContactEmail: '',
      emergencyContactLandline: '',
      emergencyContactMobile: '',
      // Passport
      passportApplicable: false,
      passportNo: '',
      passportIssueOffice: '',
      passportIssueDate: '',
      passportExpiryDate: '',
      // Family
      maritalStatus: 'single',
      dateOfMarriage: '',
      spouseName: '',
      spouseDateOfBirth: '',
      totalNumberOfChildren: 0,
      totalNumberOfSchoolGoingChildren: 0,
      numberOfDependentsApartFromChildren: 0,
      totalNumberOfChildrenInHostel: 0,
      totalDependent: 0,
      nameOfDependentsApartFromSpouseChildren: '',
      familyDetails: [],
      firstNomineeName: '',
      firstNomineeRelation: '',
      parentMediclaim: 'not_applicable',
      // Qualification & Experience
      qualifications: [],
      previousWorkExperience: [],
      totalExperienceYears: 0,
      totalExperienceMonths: 0,
      totalExperienceNotRelevantYears: 0,
      totalExperienceNotRelevantMonths: 0,
      // PF/ESI/PT
      pfContribution: true,
      vpfContribution: false,
      pfNo: '',
      pfBasicGrossWages: 'basic',
      pensionLimit: '',
      pension: true,
      esiContribution: true,
      esiNo: '',
      dispensaryName: '',
      labourWelfareFundContribution: false,
      professionalTaxContribution: true,
      // Other Information
      religionName: '',
      identificationMark: '',
      hobbies: '',
      billable: 'non_billable',
      statusDomicile: '',
      bloodGroup: '',
      severeDisability: false,
      severeDisabilityDetails: '',
      severeDisabilityBasedOnAttendance: false,
      skillSet: '',
      considerAsDirector: false,
      // Bank
      bankAccountNumber: '',
      bankIfsc: '',
      bankName: '',
      // Additional Fields
      aadhaar: '',
      uan: '',
      drivingLicense: '',
      drivingLicenseExpiryDate: '',
      voterId: '',
      rationCard: '',
      // Status
      isActive: true
    }
  });

  // Fetch dropdown data
  const { data: departmentsData } = useQuery('departments', () => departmentService.getAll());
  const { data: designationsData } = useQuery('designations', () => designationService.getAll());
  const { data: branchesData } = useQuery('branches', () => branchService.getAll());
  const { data: costCentersData } = useQuery('costCenters', () => costCenterService.getAll());
  const { data: unitsData } = useQuery('units', () => unitService.getAll());
  const { data: gradesData } = useQuery('grades', () => gradeService.getAll());
  const { data: levelsData } = useQuery('levels', () => levelService.getAll());
  const { data: subDepartmentsData } = useQuery('subDepartments', () => subDepartmentService.getAll());
  const { data: locationsData } = useQuery('officeLocations', () => officeLocationService.getAll());
  const { data: countriesData } = useQuery('countries', () => countryService.getAll());
  const { data: employeesData } = useQuery('employees', () => employeeService.getAll());

  const watchedCurrentCountry = watch('currentCountry');
  const watchedCurrentState = watch('currentState');
  const watchedPermanentCountry = watch('permanentCountry');
  const watchedPermanentState = watch('permanentState');
  const watchedDepartmentId = watch('departmentId');

  // Fetch states and cities based on selected country/state
  const { data: currentStatesData } = useQuery(
    ['states', watchedCurrentCountry],
    () => stateService.getAll(watchedCurrentCountry),
    { enabled: !!watchedCurrentCountry }
  );
  const { data: currentCitiesData } = useQuery(
    ['cities', watchedCurrentState],
    () => cityService.getAll(watchedCurrentCountry, watchedCurrentState),
    { enabled: !!watchedCurrentState }
  );
  const { data: permanentStatesData } = useQuery(
    ['states', watchedPermanentCountry],
    () => stateService.getAll(watchedPermanentCountry),
    { enabled: !!watchedPermanentCountry }
  );
  const { data: permanentCitiesData } = useQuery(
    ['cities', watchedPermanentState],
    () => cityService.getAll(watchedPermanentCountry, watchedPermanentState),
    { enabled: !!watchedPermanentState }
  );
  const { data: subDepartmentsByDeptData } = useQuery(
    ['subDepartments', watchedDepartmentId],
    () => subDepartmentService.getAll(watchedDepartmentId),
    { enabled: !!watchedDepartmentId }
  );

  const { data: employeeData, isLoading } = useQuery(
    ['employee', id],
    () => employeeService.getById(id),
    { enabled: isEdit, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (employeeData?.data) {
      const employee = employeeData.data;
      // Handle date fields
      const dateFields = [
        'dateOfBirth', 'dateOfJoining', 'appointmentLetterDate', 'confirmationDate',
        'joiningDateForForm5', 'gratuityDate', 'dateOfPromotion', 'dateOfTransfer',
        'contractStartDate', 'contractEndDate', 'dateOfRegularization', 'leavingDate',
        'leavingDateForForm10', 'settlementDate', 'passportIssueDate', 'passportExpiryDate',
        'dateOfMarriage', 'spouseDateOfBirth', 'drivingLicenseExpiryDate'
      ];
      
      Object.keys(employee).forEach(key => {
        if (employee[key] !== null && employee[key] !== undefined) {
          if (dateFields.includes(key) && employee[key]) {
            // Convert date to YYYY-MM-DD format
            const date = new Date(employee[key]);
            setValue(key, date.toISOString().split('T')[0]);
          } else {
            setValue(key, employee[key]);
          }
        }
      });
    }
  }, [employeeData, setValue]);

  // Handle "Same as Current Address"
  const watchedSameAsCurrent = watch('sameAsCurrentAddress');
  useEffect(() => {
    if (watchedSameAsCurrent) {
      setValue('permanentAddress1', watch('currentAddress1'));
      setValue('permanentAddress2', watch('currentAddress2'));
      setValue('permanentCountry', watch('currentCountry'));
      setValue('permanentState', watch('currentState'));
      setValue('permanentCity', watch('currentCity'));
      setValue('permanentZip', watch('currentZip'));
    }
  }, [watchedSameAsCurrent, watch, setValue]);

  const createMutation = useMutation(
    (data) => employeeService.create(data),
    {
      onSuccess: () => {
        toast.success('Employee created successfully');
        queryClient.invalidateQueries('employees');
        navigate('/employees');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create employee');
      }
    }
  );

  const updateMutation = useMutation(
    (data) => employeeService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Employee updated successfully');
        queryClient.invalidateQueries('employees');
        queryClient.invalidateQueries(['employee', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update employee');
      }
    }
  );

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = (data) => {
    const formData = {
      ...data,
      documents: documents
    };

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    onDrop: (acceptedFiles) => {
      setDocuments([...documents, ...acceptedFiles]);
    }
  });

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const departments = departmentsData?.data || [];
  const designations = designationsData?.data || [];
  const branches = branchesData?.data || [];
  const costCenters = costCentersData?.data || [];
  const units = unitsData?.data || [];
  const grades = gradesData?.data || [];
  const levels = levelsData?.data || [];
  const subDepartments = subDepartmentsByDeptData?.data || subDepartmentsData?.data || [];
  const locations = locationsData?.data || [];
  const countries = countriesData?.data || [];
  const currentStates = currentStatesData?.data || [];
  const currentCities = currentCitiesData?.data || [];
  const permanentStates = permanentStatesData?.data || [];
  const permanentCities = permanentCitiesData?.data || [];
  const employees = employeesData?.data || [];

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="salutation"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Salutation</InputLabel>
                    <Select {...field} label="Salutation">
                      <MenuItem value="Mr.">Mr.</MenuItem>
                      <MenuItem value="Mrs.">Mrs.</MenuItem>
                      <MenuItem value="Ms.">Ms.</MenuItem>
                      <MenuItem value="Dr.">Dr.</MenuItem>
                      <MenuItem value="Prof.">Prof.</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="First Name *"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="middleName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Middle Name" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Last name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Last Name *"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="fatherHusbandName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Father/Husband Name" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="motherName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Mother Name" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select {...field} label="Gender">
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Nationality" />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1: // Posting Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="employeeCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Employee Code"
                    disabled={isEdit}
                    helperText={isEdit ? 'Employee code cannot be changed' : 'Auto-generated if left empty'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="positionId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Position ID" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="employeeType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Employee Type</InputLabel>
                    <Select {...field} label="Employee Type">
                      <MenuItem value="permanent">Permanent</MenuItem>
                      <MenuItem value="contract">Contract</MenuItem>
                      <MenuItem value="consultant">Consultant</MenuItem>
                      <MenuItem value="temporary">Temporary</MenuItem>
                      <MenuItem value="intern">Intern</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="staffId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Staff ID" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="designationId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Designation</InputLabel>
                    <Select {...field} label="Designation">
                      {designations.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department">
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="subDepartmentId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={!watchedDepartmentId}>
                    <InputLabel>Sub-Department</InputLabel>
                    <Select {...field} label="Sub-Department" disabled={!watchedDepartmentId}>
                      {subDepartments.map((subDept) => (
                        <MenuItem key={subDept.id} value={subDept.id}>
                          {subDept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Branch</InputLabel>
                    <Select {...field} label="Branch">
                      {branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Location</InputLabel>
                    <Select {...field} label="Location">
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="costCenterId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Cost Center</InputLabel>
                    <Select {...field} label="Cost Center">
                      {costCenters.map((cc) => (
                        <MenuItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select {...field} label="Unit">
                      {units.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="gradeId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Grade</InputLabel>
                    <Select {...field} label="Grade">
                      {grades.map((grade) => (
                        <MenuItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="levelId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Level</InputLabel>
                    <Select {...field} label="Level">
                      {levels.map((level) => (
                        <MenuItem key={level.id} value={level.id}>
                          {level.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Category" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="reportingManagerId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Reporting Manager</InputLabel>
                    <Select {...field} label="Reporting Manager">
                      <MenuItem value="">None</MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 2: // Employment Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="dateOfJoining"
                control={control}
                rules={{ required: 'Date of joining is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Joining *"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.dateOfJoining}
                    helperText={errors.dateOfJoining?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="appointmentLetterDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Appointment Letter Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="ctcAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CTC Amount"
                    type="number"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="ctcCurrency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>CTC Currency</InputLabel>
                    <Select {...field} label="CTC Currency">
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="effectiveFrom"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Effective From"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="leaveAssignDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Leave Assign Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="leaveTemplate"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Leave Template" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="oldEmployeeCode"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Old Employee Code" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="officialMailId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Official Mail ID"
                    type="email"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="pan"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="PAN"
                    helperText="Format: ABCDE1234F"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="noticeDays"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Notice Days"
                    type="number"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="expat"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Expat"
                  />
                )}
              />
            </Grid>
            <Divider sx={{ my: 2, width: '100%' }} />
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Date-Dimension Fields</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="confirmationDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Confirmation Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="gratuityDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Gratuity Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="dateOfPromotion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Promotion"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="dateOfTransfer"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Transfer"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="dateOfRegularization"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Regularization"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="contractStartDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contract Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="contractEndDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contract End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="leavingDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Leaving Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="settlementDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Settlement Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3: // Address Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Current Address</Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="currentAddress1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Current Address Line 1"
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="currentAddress2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Current Address Line 2"
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="currentCountry"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select {...field} label="Country">
                      {countries.map((country) => (
                        <MenuItem key={country.id} value={country.name}>
                          {country.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="currentState"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={!watchedCurrentCountry}>
                    <InputLabel>State</InputLabel>
                    <Select {...field} label="State" disabled={!watchedCurrentCountry}>
                      {currentStates.map((state) => (
                        <MenuItem key={state.id} value={state.name}>
                          {state.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="currentCity"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={!watchedCurrentState}>
                    <InputLabel>City</InputLabel>
                    <Select {...field} label="City" disabled={!watchedCurrentState}>
                      {currentCities.map((city) => (
                        <MenuItem key={city.id} value={city.name}>
                          {city.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="currentZip"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="ZIP Code" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="sameAsCurrentAddress"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Permanent Address Same as Current Address"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Permanent Address</Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="permanentAddress1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Permanent Address Line 1"
                    multiline
                    rows={2}
                    disabled={watchedSameAsCurrent}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="permanentAddress2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Permanent Address Line 2"
                    multiline
                    rows={2}
                    disabled={watchedSameAsCurrent}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="permanentCountry"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={watchedSameAsCurrent}>
                    <InputLabel>Country</InputLabel>
                    <Select {...field} label="Country" disabled={watchedSameAsCurrent}>
                      {countries.map((country) => (
                        <MenuItem key={country.id} value={country.name}>
                          {country.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="permanentState"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={watchedSameAsCurrent || !watchedPermanentCountry}>
                    <InputLabel>State</InputLabel>
                    <Select {...field} label="State" disabled={watchedSameAsCurrent || !watchedPermanentCountry}>
                      {permanentStates.map((state) => (
                        <MenuItem key={state.id} value={state.name}>
                          {state.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="permanentCity"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={watchedSameAsCurrent || !watchedPermanentState}>
                    <InputLabel>City</InputLabel>
                    <Select {...field} label="City" disabled={watchedSameAsCurrent || !watchedPermanentState}>
                      {permanentCities.map((city) => (
                        <MenuItem key={city.id} value={city.name}>
                          {city.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="permanentZip"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="ZIP Code"
                    disabled={watchedSameAsCurrent}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 4: // Contact & Emergency
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Contact Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                rules={{ pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } }}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Email" type="email" error={!!errors.email} helperText={errors.email?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="personalMailId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Personal Email" type="email" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="officePhone"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Office Phone" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="residencePhone"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Residence Phone" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="mobileNo"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Mobile Number" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Passport Information</Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="passportApplicable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Passport Applicable"
                  />
                )}
              />
            </Grid>
            {watch('passportApplicable') && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="passportNo"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Passport Number" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="passportIssueOffice"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Passport Issue Office" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="passportIssueDate"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Passport Issue Date" type="date" InputLabelProps={{ shrink: true }} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="passportExpiryDate"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Passport Expiry Date" type="date" InputLabelProps={{ shrink: true }} />
                    )}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyContactName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Emergency Contact Name" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyContactRelationship"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Relationship" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="emergencyContactAddress"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Address" multiline rows={2} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyContactEmail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Email" type="email" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyContactLandline"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Landline" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyContactMobile"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Mobile Number" />
                )}
              />
            </Grid>
          </Grid>
        );

      case 5: // Family Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Marital Status</InputLabel>
                    <Select {...field} label="Marital Status">
                      <MenuItem value="single">Single</MenuItem>
                      <MenuItem value="married">Married</MenuItem>
                      <MenuItem value="divorced">Divorced</MenuItem>
                      <MenuItem value="widowed">Widowed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            {watch('maritalStatus') === 'married' && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="dateOfMarriage"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Date of Marriage" type="date" InputLabelProps={{ shrink: true }} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="spouseName"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Spouse Name" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="spouseDateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Spouse Date of Birth" type="date" InputLabelProps={{ shrink: true }} />
                    )}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalNumberOfChildren"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Total Number of Children" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalNumberOfSchoolGoingChildren"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="School Going Children" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="numberOfDependentsApartFromChildren"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Dependents (Apart from Children)" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalNumberOfChildrenInHostel"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Children in Hostel" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="nameOfDependentsApartFromSpouseChildren"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Names of Dependents" multiline rows={2} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Nominee Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstNomineeName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="First Nominee Name" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstNomineeRelation"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Relation with Nominee" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="parentMediclaim"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Parent Mediclaim</InputLabel>
                    <Select {...field} label="Parent Mediclaim">
                      <MenuItem value="not_applicable">Not Applicable</MenuItem>
                      <MenuItem value="without_senior_citizen">Without Senior Citizen</MenuItem>
                      <MenuItem value="with_senior_citizen">With Senior Citizen</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 6: // Qualification & Experience
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Total Experience</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalExperienceYears"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Total Experience (Years)" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalExperienceMonths"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Total Experience (Months)" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalExperienceNotRelevantYears"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Experience Not Relevant (Years)" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="totalExperienceNotRelevantMonths"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Experience Not Relevant (Months)" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Note: Qualifications and Previous Work Experience can be added/edited after employee creation.
              </Typography>
            </Grid>
          </Grid>
        );

      case 7: // PF/ESI/PT Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>PF Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="pfContribution"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="PF Contribution"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vpfContribution"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="VPF Contribution"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="pfNo"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="PF Number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="pfBasicGrossWages"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>PF Basic/Gross Wages</InputLabel>
                    <Select {...field} label="PF Basic/Gross Wages">
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="gross">Gross</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="pensionLimit"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Pension Limit" type="number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="pension"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Pension"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="uan"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="UAN (Universal Account Number)" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>ESI Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="esiContribution"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="ESI Contribution"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="esiNo"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="ESI Number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="dispensaryName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Dispensary Name" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Other Statutory Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="labourWelfareFundContribution"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Labour Welfare Fund Contribution"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="professionalTaxContribution"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Professional Tax Contribution"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 8: // Other Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="religionName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Religion" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bloodGroup"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Blood Group</InputLabel>
                    <Select {...field} label="Blood Group">
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="A+">A+</MenuItem>
                      <MenuItem value="A-">A-</MenuItem>
                      <MenuItem value="B+">B+</MenuItem>
                      <MenuItem value="B-">B-</MenuItem>
                      <MenuItem value="AB+">AB+</MenuItem>
                      <MenuItem value="AB-">AB-</MenuItem>
                      <MenuItem value="O+">O+</MenuItem>
                      <MenuItem value="O-">O-</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="identificationMark"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Identification Mark" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="statusDomicile"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Domicile" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="hobbies"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Hobbies" multiline rows={2} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="skillSet"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Skill Set / Keywords" multiline rows={2} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="billable"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Billable Status</InputLabel>
                    <Select {...field} label="Billable Status">
                      <MenuItem value="billable">Billable</MenuItem>
                      <MenuItem value="non_billable">Non-Billable</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="considerAsDirector"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Consider as Director"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="severeDisability"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Severe Disability"
                  />
                )}
              />
            </Grid>
            {watch('severeDisability') && (
              <Grid item xs={12}>
                <Controller
                  name="severeDisabilityDetails"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Severe Disability Details" multiline rows={3} />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Controller
                name="severeDisabilityBasedOnAttendance"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Severe Disability Based on Attendance"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Bank Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Bank Name" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bankAccountNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Bank Account Number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bankIfsc"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="IFSC Code" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Additional Documents</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="aadhaar"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Aadhaar Number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="drivingLicense"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Driving License Number" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="drivingLicenseExpiryDate"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Driving License Expiry Date" type="date" InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="voterId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Voter ID" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="rationCard"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Ration Card" />
                )}
              />
            </Grid>
          </Grid>
        );

      case 9: // Documents
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Drag & drop documents here, or click to select
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported: PDF, JPG, PNG (Max 10MB per file)
                </Typography>
              </Box>
            </Grid>
            {documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Uploaded Documents
                </Typography>
                {documents.map((doc, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2">{doc.name}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeDocument(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/employees')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 3, minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {isEdit ? 'Update' : 'Create'} Employee
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
