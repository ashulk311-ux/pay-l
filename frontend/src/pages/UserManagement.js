import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { companyService } from '../services/companyService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const isSuperAdmin = currentUser?.role?.name?.toLowerCase() === 'super admin';
  const isCompanyAdmin = currentUser?.role?.name?.toLowerCase() === 'company admin';

  // Redirect Super Admin - they should only manage companies, not users
  React.useEffect(() => {
    if (currentUser && isSuperAdmin) {
      navigate('/companies', { replace: true });
    }
  }, [currentUser, isSuperAdmin, navigate]);

  const { data: usersData, isLoading, error: usersError } = useQuery(
    ['users', selectedCompanyId], 
    () => userService.getAll({ companyId: selectedCompanyId || undefined }), 
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const { data: rolesData } = useQuery('roles', () => roleService.getAll(), {
    refetchOnWindowFocus: false
  });

  const { data: companiesData } = useQuery(
    'companies',
    () => companyService.getAll(),
    {
      refetchOnWindowFocus: false,
      enabled: isSuperAdmin
    }
  );

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
      companyId: '',
      isActive: true
    }
  });

  const createMutation = useMutation(
    (data) => userService.create(data),
    {
      onSuccess: () => {
        toast.success('User created successfully');
        queryClient.invalidateQueries('users');
        setDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => userService.update(id, data),
    {
      onSuccess: () => {
        toast.success('User updated successfully');
        queryClient.invalidateQueries('users');
        setDialogOpen(false);
        reset();
        setSelectedUser(null);
        setIsEdit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => userService.delete(id),
    {
      onSuccess: () => {
        toast.success('User deleted successfully');
        queryClient.invalidateQueries('users');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );

  const resetPasswordMutation = useMutation(
    ({ id, newPassword }) => userService.resetPassword(id, newPassword),
    {
      onSuccess: () => {
        toast.success('Password reset successfully');
        setResetPasswordDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    }
  );

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setIsEdit(true);
      reset({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        roleId: user.roleId,
        companyId: user.companyId || '',
        isActive: user.isActive,
        password: '' // Don't pre-fill password
      });
    } else {
      setSelectedUser(null);
      setIsEdit(false);
      reset({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        roleId: '',
        companyId: selectedCompanyId || currentUser?.companyId || '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setIsEdit(false);
    reset();
  };

  const onSubmit = (data) => {
    if (isEdit) {
      // Remove password from update if empty
      if (!data.password) {
        delete data.password;
      }
      // Company Admin cannot change company
      if (!isSuperAdmin) {
        delete data.companyId;
      }
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      // Company Admin automatically assigns their company
      if (!isSuperAdmin && !data.companyId) {
        data.companyId = currentUser?.companyId;
      }
      createMutation.mutate(data);
    }
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.email}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    resetPasswordMutation.mutate({ id: selectedUser.id, newPassword });
  };

  // Only Company Admin can access this page (HR/Admin can view but not manage users)
  if (currentUser && !isCompanyAdmin && !isSuperAdmin) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          Access Denied. Only Company Admin can manage users.
        </Alert>
      </Container>
    );
  }

  const users = usersData?.data || [];
  const roles = rolesData?.data || [];
  const companies = companiesData?.data || [];

  // Group users by company
  const usersByCompany = users.reduce((acc, user) => {
    const companyName = user.company?.name || 'No Company';
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(user);
    return acc;
  }, {});

  const columns = [
    {
      field: 'email',
      header: 'Email',
      minWidth: 200
    },
    {
      field: 'name',
      header: 'Name',
      minWidth: 150,
      accessor: (row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'N/A'
    },
    {
      field: 'company',
      header: 'Company',
      minWidth: 150,
      accessor: (row) => row.company?.name || 'N/A'
    },
    {
      field: 'role',
      header: 'Role',
      minWidth: 120,
      accessor: (row) => row.role?.name || 'N/A'
    },
    {
      field: 'phone',
      header: 'Phone',
      minWidth: 120
    },
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
          <IconButton size="small" onClick={() => handleOpenDialog(row)} title="Edit User">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleResetPassword(row)} title="Reset Password">
            <LockResetIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(row)} color="error" title="Delete User">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isSuperAdmin && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Company</InputLabel>
              <Select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                label="Filter by Company"
              >
                <MenuItem value="">All Companies</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {/* Error Message */}
      {usersError && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body1">
            Error loading users: {usersError?.response?.data?.message || usersError?.message || 'Unknown error'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Status: {usersError?.response?.status || 'N/A'} | 
            URL: {usersError?.config?.url || 'N/A'}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1">Loading users...</Typography>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !usersError && users.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No users found. Create your first user to get started.
          </Typography>
        </Box>
      )}

      {/* Data Table - Grouped by Company if multiple companies, single table if one company */}
      {!isLoading && !usersError && users.length > 0 && (
        <>
          {Object.keys(usersByCompany).length > 1 ? (
            // Show grouped by company if multiple companies
            <Box>
              {Object.entries(usersByCompany).map(([companyName, companyUsers]) => (
                <Box key={companyName} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    {companyName} ({companyUsers.length} {companyUsers.length === 1 ? 'user' : 'users'})
                  </Typography>
                  <DataTable
                    columns={columns.filter(col => col.field !== 'company')} // Remove company column when grouped
                    data={companyUsers}
                    loading={false}
                    searchable
                    searchPlaceholder={`Search users in ${companyName}...`}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            // Show single table if one company or filtered
            <DataTable
              columns={columns}
              data={users}
              loading={isLoading}
              searchable
              searchPlaceholder="Search users..."
            />
          )}
        </>
      )}

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="email"
                control={control}
                rules={{ required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                rules={{ required: !isEdit && 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type="password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message || (isEdit && 'Leave blank to keep current password')}
                  />
                )}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />

                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Box>

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                  />
                )}
              />

              {isSuperAdmin && (
                <Controller
                  name="companyId"
                  control={control}
                  rules={{ required: isSuperAdmin && !isEdit ? 'Company is required' : false }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.companyId}>
                      <InputLabel>Company</InputLabel>
                      <Select {...field} label="Company" disabled={isEdit}>
                        <MenuItem value="">Select Company</MenuItem>
                        {companies.map((company) => (
                          <MenuItem key={company.id} value={company.id}>
                            {company.name} ({company.code})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.companyId && <Typography variant="caption" color="error">{errors.companyId.message}</Typography>}
                    </FormControl>
                  )}
                />
              )}

              <Controller
                name="roleId"
                control={control}
                rules={{ required: 'Role is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.roleId}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role">
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.roleId && <Typography variant="caption" color="error">{errors.roleId.message}</Typography>}
                  </FormControl>
                )}
              />

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Active"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleResetPasswordSubmit}>
          <DialogTitle>Reset Password for {selectedUser?.email}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                name="newPassword"
                label="New Password"
                type="password"
                fullWidth
                required
                inputProps={{ minLength: 6 }}
              />
              <TextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                fullWidth
                required
                inputProps={{ minLength: 6 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={resetPasswordMutation.isLoading}>
              Reset Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

