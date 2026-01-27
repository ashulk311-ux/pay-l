import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, FormControlLabel, RadioGroup, Radio, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { statutoryService } from '../../services/statutoryService';

export default function TDSConfiguration({ company }) {
  const queryClient = useQueryClient();
  const [slabsDialogOpen, setSlabsDialogOpen] = useState(false);
  const [exemptionsDialogOpen, setExemptionsDialogOpen] = useState(false);

  const { data: slabsData } = useQuery(
    ['tdsSlabs', company?.id],
    () => statutoryService.getTDSSlabs('new'),
    { enabled: !!company?.id, refetchOnWindowFocus: false }
  );

  const { data: exemptionsData } = useQuery(
    ['tdsExemptions', company?.id],
    () => statutoryService.getExemptions({ companyId: company?.id }),
    { enabled: !!company?.id, refetchOnWindowFocus: false }
  );

  const { control: slabsControl, handleSubmit: handleSlabsSubmit } = useForm({
    defaultValues: {
      regime: 'new',
      slabs: slabsData?.data?.slabs || []
    }
  });

  const { handleSubmit: handleExemptionsSubmit } = useForm({
    defaultValues: {
      exemptions: exemptionsData?.data || []
    }
  });

  const updateSlabsMutation = useMutation(
    (data) => statutoryService.updateTDSSlabs({ ...data, companyId: company.id }),
    {
      onSuccess: () => {
        toast.success('TDS slabs updated successfully');
        queryClient.invalidateQueries(['tdsSlabs', company?.id]);
        setSlabsDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update TDS slabs');
      }
    }
  );

  const updateExemptionsMutation = useMutation(
    (data) => statutoryService.updateExemptions({ ...data, companyId: company.id }),
    {
      onSuccess: () => {
        toast.success('TDS exemptions updated successfully');
        queryClient.invalidateQueries(['tdsExemptions', company?.id]);
        setExemptionsDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update TDS exemptions');
      }
    }
  );

  const slabs = slabsData?.data?.slabs || [];
  const exemptions = exemptionsData?.data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Tax Deducted at Source (TDS) Configuration</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => setSlabsDialogOpen(true)}>
            Manage TDS Slabs
          </Button>
          <Button variant="outlined" onClick={() => setExemptionsDialogOpen(true)}>
            Manage Exemptions
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>TDS Slabs</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Income Range</TableCell>
                    <TableCell align="right">Rate (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slabs.map((slab, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        ₹{slab.min.toLocaleString()} - {slab.max === Infinity ? 'Above' : `₹${slab.max.toLocaleString()}`}
                      </TableCell>
                      <TableCell align="right">{slab.rate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Common Exemptions</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Max Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exemptions.slice(0, 5).map((exemption, index) => (
                    <TableRow key={index}>
                      <TableCell>{exemption.section}</TableCell>
                      <TableCell>{exemption.description}</TableCell>
                      <TableCell align="right">
                        {exemption.maxAmount ? `₹${exemption.maxAmount.toLocaleString()}` : 'Unlimited'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* TDS Slabs Dialog */}
      <Dialog open={slabsDialogOpen} onClose={() => setSlabsDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSlabsSubmit((data) => updateSlabsMutation.mutate(data))}>
          <DialogTitle>Manage TDS Slabs</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Controller
                name="regime"
                control={slabsControl}
                render={({ field }) => (
                  <FormControlLabel
                    control={<RadioGroup {...field} row>
                      <FormControlLabel value="new" control={<Radio />} label="New Regime" />
                      <FormControlLabel value="old" control={<Radio />} label="Old Regime" />
                    </RadioGroup>}
                    label="Tax Regime"
                  />
                )}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                TDS slabs are configured based on the selected tax regime. Modify as per your company requirements.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSlabsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Exemptions Dialog */}
      <Dialog open={exemptionsDialogOpen} onClose={() => setExemptionsDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleExemptionsSubmit((data) => updateExemptionsMutation.mutate(data))}>
          <DialogTitle>Manage TDS Exemptions</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Configure tax exemptions available to employees. These will be considered during TDS calculation.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExemptionsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}



