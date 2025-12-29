import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { companyService } from '../services/companyService';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import DataTable from '../components/DataTable';

export default function Companies() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const { data: companiesData, isLoading, error: companiesError } = useQuery(
    'companies', 
    () => companyService.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  );
  const { data: rolesData } = useQuery('roles', () => roleService.getAll());

  const companyForm = useForm({
    defaultValues: {
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      pan: '',
      gstin: ''
    }
  });

  const adminForm = useForm({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: ''
    }
  });

  const createMutation = useMutation(
    (data) => companyService.create(data),
    {
      onSuccess: () => {
        toast.success('Company created successfully');
        queryClient.invalidateQueries('companies');
        setDialogOpen(false);
        companyForm.reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create company');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => companyService.delete(id),
    {
      onSuccess: () => {
        toast.success('Company deleted successfully');
        queryClient.invalidateQueries('companies');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete company');
      }
    }
  );

  const createAdminMutation = useMutation(
    (data) => userService.create(data),
    {
      onSuccess: () => {
        toast.success('Company Admin created successfully');
        queryClient.invalidateQueries('companies');
        setAdminDialogOpen(false);
        adminForm.reset();
        setSelectedCompany(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create Company Admin');
      }
    }
  );

  const handleOpenDialog = () => {
    setSelectedCompany(null);
    companyForm.reset();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    companyForm.reset();
    setSelectedCompany(null);
  };

  const handleOpenAdminDialog = (company) => {
    setSelectedCompany(company);
    adminForm.reset();
    setAdminDialogOpen(true);
  };

  const handleCloseAdminDialog = () => {
    setAdminDialogOpen(false);
    adminForm.reset();
    setSelectedCompany(null);
  };

  const onSubmitCompany = (data) => {
    createMutation.mutate(data);
  };

  const onSubmitAdmin = (data) => {
    const companyAdminRole = rolesData?.data?.find(r => r.name === 'Company Admin');
    if (!companyAdminRole) {
      toast.error('Company Admin role not found');
      return;
    }
    createAdminMutation.mutate({
      ...data,
      roleId: companyAdminRole.id,
      companyId: selectedCompany.id
    });
  };

  const handleDelete = (company) => {
    if (window.confirm(`Are you sure you want to delete company "${company.name}"?`)) {
      deleteMutation.mutate(company.id);
    }
  };

  const companies = companiesData?.data || [];
  const companyAdminRole = rolesData?.data?.find(r => r.name === 'Company Admin');

  const columns = [
    { field: 'name', header: 'Company Name', minWidth: 200 },
    { field: 'code', header: 'Code', minWidth: 100 },
    { field: 'email', header: 'Email', minWidth: 200 },
    { field: 'city', header: 'City', minWidth: 120 },
    { field: 'state', header: 'State', minWidth: 120 },
    {
      field: 'isActive',
      header: 'Status',
      minWidth: 100,
      render: (value, row) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 150,
      render: (value, row) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenAdminDialog(row)} title="Create Company Admin">
            <PersonAddIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(row)} color="error" title="Delete Company">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Companies</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Company
        </Button>
      </Box>

      {/* Error Message */}
      {companiesError && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body1">
            Error loading companies: {companiesError?.response?.data?.message || companiesError?.message || 'Unknown error'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Status: {companiesError?.response?.status || 'N/A'} | 
            URL: {companiesError?.config?.url || 'N/A'}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1">Loading companies...</Typography>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !companiesError && companies.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No companies found. Create your first company to get started.
          </Typography>
        </Box>
      )}

      {/* Data Table */}
      {!isLoading && !companiesError && companies.length > 0 && (
        <DataTable
          columns={columns}
          data={companies}
          loading={isLoading}
          searchable
          searchPlaceholder="Search companies..."
        />
      )}

      {/* Create Company Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={companyForm.handleSubmit(onSubmitCompany)}>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="name"
                  control={companyForm.control}
                  rules={{ required: 'Company name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Company Name"
                      fullWidth
                      error={!!companyForm.formState.errors.name}
                      helperText={companyForm.formState.errors.name?.message}
                    />
                  )}
                />
                <Controller
                  name="code"
                  control={companyForm.control}
                  rules={{ required: 'Company code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Company Code"
                      fullWidth
                      error={!!companyForm.formState.errors.code}
                      helperText={companyForm.formState.errors.code?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="email"
                  control={companyForm.control}
                  rules={{ required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!companyForm.formState.errors.email}
                      helperText={companyForm.formState.errors.email?.message}
                    />
                  )}
                />
                <Controller
                  name="phone"
                  control={companyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Phone" fullWidth />
                  )}
                />
              </Box>
              <Controller
                name="address"
                control={companyForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address"
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="city"
                  control={companyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="City" fullWidth />
                  )}
                />
                <Controller
                  name="state"
                  control={companyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="State" fullWidth />
                  )}
                />
                <Controller
                  name="pincode"
                  control={companyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Pincode" fullWidth />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="pan"
                  control={companyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="PAN" fullWidth />
                  )}
                />
                <Controller
                  name="gstin"
                  control={companyForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="GSTIN" fullWidth />
                  )}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              Create Company
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create Company Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={handleCloseAdminDialog} maxWidth="sm" fullWidth>
        <form onSubmit={adminForm.handleSubmit(onSubmitAdmin)}>
          <DialogTitle>Create Company Admin for {selectedCompany?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="email"
                control={adminForm.control}
                rules={{ required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!adminForm.formState.errors.email}
                    helperText={adminForm.formState.errors.email?.message}
                  />
                )}
              />
              <Controller
                name="password"
                control={adminForm.control}
                rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type="password"
                    fullWidth
                    error={!!adminForm.formState.errors.password}
                    helperText={adminForm.formState.errors.password?.message}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="firstName"
                  control={adminForm.control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!adminForm.formState.errors.firstName}
                      helperText={adminForm.formState.errors.firstName?.message}
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={adminForm.control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!adminForm.formState.errors.lastName}
                      helperText={adminForm.formState.errors.lastName?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="phone"
                control={adminForm.control}
                render={({ field }) => (
                  <TextField {...field} label="Phone" fullWidth />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdminDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createAdminMutation.isLoading}>
              Create Company Admin
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

