import React, { useEffect } from 'react';
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
  Alert,
  Box
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { biometricService } from '../../services/biometricService';
import { branchService } from '../../services/branchService';

export default function DeviceDialog({ open, device, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!device;

  const { data: branchesData } = useQuery('branches', () => branchService.getAll(), { enabled: open });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      deviceName: '',
      deviceSerialNumber: '',
      deviceType: 'fingerprint',
      deviceModel: '',
      deviceManufacturer: '',
      ipAddress: '',
      port: 80,
      location: '',
      branchId: '',
      syncMode: 'push',
      syncInterval: 5
    }
  });

  useEffect(() => {
    if (device && open) {
      reset({
        deviceName: device.deviceName || '',
        deviceSerialNumber: device.deviceSerialNumber || '',
        deviceType: device.deviceType || 'fingerprint',
        deviceModel: device.deviceModel || '',
        deviceManufacturer: device.deviceManufacturer || '',
        ipAddress: device.ipAddress || '',
        port: device.port || 80,
        location: device.location || '',
        branchId: device.branchId || '',
        syncMode: device.syncMode || 'push',
        syncInterval: device.syncInterval || 5
      });
    } else if (!device && open) {
      reset();
    }
  }, [device, reset, open]);

  const createMutation = useMutation(
    (data) => biometricService.registerDevice(data),
    {
      onSuccess: (response) => {
        toast.success('Device registered successfully');
        queryClient.invalidateQueries('biometricDevices');
        // Show API credentials
        if (response.data?.apiKey && response.data?.apiSecret) {
          alert(`Device registered!\n\nAPI Key: ${response.data.apiKey}\nAPI Secret: ${response.data.apiSecret}\n\nPlease save these credentials securely. They will not be shown again.`);
        }
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to register device');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => biometricService.updateDevice(id, data),
    {
      onSuccess: () => {
        toast.success('Device updated successfully');
        queryClient.invalidateQueries('biometricDevices');
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update device');
      }
    }
  );

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id: device.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const branches = branchesData?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Biometric Device' : 'Register Biometric Device'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="deviceName"
                control={control}
                rules={{ required: 'Device name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Device Name" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="deviceSerialNumber"
                control={control}
                rules={{ required: 'Serial number is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Serial Number" fullWidth required disabled={isEdit} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="deviceType"
                control={control}
                rules={{ required: 'Device type is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Device Type" fullWidth required>
                    <MenuItem value="fingerprint">Fingerprint</MenuItem>
                    <MenuItem value="face">Face Recognition</MenuItem>
                    <MenuItem value="iris">Iris</MenuItem>
                    <MenuItem value="palm">Palm</MenuItem>
                    <MenuItem value="rfid">RFID</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="deviceManufacturer"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Manufacturer" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="deviceModel"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Model" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Location" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Branch" fullWidth>
                    <MenuItem value="">None</MenuItem>
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="ipAddress"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="IP Address" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="port"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Port" type="number" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="syncMode"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Sync Mode" fullWidth>
                    <MenuItem value="push">Push (Device sends data)</MenuItem>
                    <MenuItem value="pull">Pull (System fetches data)</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="syncInterval"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Sync Interval (minutes)" type="number" fullWidth />
                )}
              />
            </Grid>
          </Grid>
          {!isEdit && (
            <Alert severity="info" sx={{ mt: 2 }}>
              After registration, you will receive API credentials (API Key and Secret) that the device needs to authenticate.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isLoading || updateMutation.isLoading}>
            {isEdit ? 'Update' : 'Register'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}



