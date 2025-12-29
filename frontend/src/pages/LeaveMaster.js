import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControlLabel,
  Switch,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import { leaveMasterService } from '../services/leaveMasterService';
import { attendanceMatrixService } from '../services/attendanceMatrixService';
import DataTable from '../components/DataTable';
import LeaveTypeManagement from '../components/leave/LeaveTypeManagement';
import LeaveBalanceManagement from '../components/leave/LeaveBalanceManagement';
import HolidayCalendarManagement from '../components/leave/HolidayCalendarManagement';
import LeaveEncashmentManagement from '../components/leave/LeaveEncashmentManagement';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LeaveMaster() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Leave Master
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage leave types, balances, holidays, and encashment rules
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Leave Types" />
            <Tab label="Leave Balance" />
            <Tab label="Holiday Calendar" />
            <Tab label="Encashment Rules" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <LeaveTypeManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <LeaveBalanceManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <HolidayCalendarManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <LeaveEncashmentManagement />
        </TabPanel>
      </Paper>
    </Container>
  );
}



