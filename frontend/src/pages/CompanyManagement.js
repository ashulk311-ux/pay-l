import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../services/companyService';
import CompanyInfo from '../components/company/CompanyInfo';
import BranchManagement from '../components/company/BranchManagement';
import DepartmentManagement from '../components/company/DepartmentManagement';
import SubDepartmentManagement from '../components/company/SubDepartmentManagement';
import DesignationManagement from '../components/company/DesignationManagement';
import RegionManagement from '../components/company/RegionManagement';
import CostCenterManagement from '../components/company/CostCenterManagement';
import UnitManagement from '../components/company/UnitManagement';
import GradeManagement from '../components/company/GradeManagement';
import LevelManagement from '../components/company/LevelManagement';
import EmailTemplateManagement from '../components/company/EmailTemplateManagement';
import NewsPolicyManagement from '../components/company/NewsPolicyManagement';
import CompanySettings from '../components/company/CompanySettings';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CompanyManagement() {
  // Restore tab from sessionStorage if available
  const savedTab = parseInt(sessionStorage.getItem('companyManagementTab') || '0');
  const [tabValue, setTabValue] = useState(savedTab);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect Super Admin to Companies page
  useEffect(() => {
    if (user && user.role?.name?.toLowerCase() === 'super admin') {
      navigate('/companies', { replace: true });
    }
  }, [user, navigate]);

  // Sync tab with sessionStorage when navigating from submenu
  useEffect(() => {
    const handleTabChange = () => {
      const savedTab = parseInt(sessionStorage.getItem('companyManagementTab') || '0');
      if (savedTab !== tabValue && savedTab >= 0 && savedTab <= 7) {
        setTabValue(savedTab);
      }
    };

    // Check on mount
    const savedTab = parseInt(sessionStorage.getItem('companyManagementTab') || '0');
    if (savedTab >= 0 && savedTab <= 12) {
      setTabValue(savedTab);
    }

    // Listen for custom event when navigating from submenu
    window.addEventListener('companyManagementTabChange', handleTabChange);
    return () => window.removeEventListener('companyManagementTabChange', handleTabChange);
  }, []);

  const { data: companyData, isLoading } = useQuery(
    'myCompany',
    () => companyService.getMyCompany(),
    {
      refetchOnWindowFocus: false,
      retry: false,
      enabled: user?.role?.name?.toLowerCase() === 'company admin'
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Save tab to sessionStorage for submenu highlighting
    sessionStorage.setItem('companyManagementTab', newValue.toString());
  };

  // Check if user is Company Admin
  if (user && user.role?.name?.toLowerCase() !== 'company admin') {
    return (
      <Container>
        <Alert severity="error">Access Denied. Only Company Admin can access this page.</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const company = companyData?.data;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Company Management
        </Typography>
        {company && (
          <Typography variant="subtitle1" color="text.secondary">
            {company.name} ({company.code})
          </Typography>
        )}
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Company Info" />
            <Tab label="Branches" />
            <Tab label="Departments" />
            <Tab label="Sub-Departments" />
            <Tab label="Designations" />
            <Tab label="Regions" />
            <Tab label="Cost Centers" />
            <Tab label="Units" />
            <Tab label="Grades" />
            <Tab label="Levels" />
            <Tab label="Email Templates" />
            <Tab label="News & Policies" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CompanyInfo company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <BranchManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <DepartmentManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <SubDepartmentManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <DesignationManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <RegionManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <CostCenterManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={7}>
          <UnitManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={8}>
          <GradeManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={9}>
          <LevelManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={10}>
          <EmailTemplateManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={11}>
          <NewsPolicyManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={12}>
          <CompanySettings company={company} />
        </TabPanel>
      </Paper>
    </Container>
  );
}

