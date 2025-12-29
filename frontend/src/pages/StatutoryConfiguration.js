import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../services/companyService';
import PFConfiguration from '../components/statutory/PFConfiguration';
import ESIConfiguration from '../components/statutory/ESIConfiguration';
import PTConfiguration from '../components/statutory/PTConfiguration';
import LWFConfiguration from '../components/statutory/LWFConfiguration';
import TDSConfiguration from '../components/statutory/TDSConfiguration';
import SalaryHeadMapping from '../components/statutory/SalaryHeadMapping';
import Form16Management from '../components/statutory/Form16Management';
import IncomeTaxSlabsManagement from '../components/statutory/IncomeTaxSlabsManagement';
import ProfessionalTaxSlabsManagement from '../components/statutory/ProfessionalTaxSlabsManagement';
import LWFSlabsManagement from '../components/statutory/LWFSlabsManagement';
import PFGroupsManagement from '../components/statutory/PFGroupsManagement';
import ESIGroupsManagement from '../components/statutory/ESIGroupsManagement';
import PTGroupsManagement from '../components/statutory/PTGroupsManagement';
import TDSDeductorManagement from '../components/statutory/TDSDeductorManagement';
import StatutoryLocationMappingManagement from '../components/statutory/StatutoryLocationMappingManagement';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function StatutoryConfiguration() {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();

  const { data: companyData } = useQuery(
    'myCompany',
    () => companyService.getMyCompany(),
    {
      refetchOnWindowFocus: false,
      retry: false,
      enabled: !!user?.companyId
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const company = companyData?.data;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Statutory Configurations
        </Typography>
        {company && (
          <Typography variant="subtitle1" color="text.secondary">
            Configure PF, ESI, PT, LWF, and TDS settings for {company.name}
          </Typography>
        )}
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Income Tax Slabs" />
            <Tab label="Professional Tax Slabs" />
            <Tab label="LWF Slabs" />
            <Tab label="PF Groups" />
            <Tab label="ESI Groups" />
            <Tab label="PT Groups" />
            <Tab label="TDS Deductor" />
            <Tab label="Location Mapping" />
            <Tab label="PF Configuration" />
            <Tab label="ESI Configuration" />
            <Tab label="PT Configuration" />
            <Tab label="LWF Configuration" />
            <Tab label="TDS Configuration" />
            <Tab label="Salary Head Mapping" />
            <Tab label="Form 16" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <IncomeTaxSlabsManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ProfessionalTaxSlabsManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <LWFSlabsManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <PFGroupsManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <ESIGroupsManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <PTGroupsManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <TDSDeductorManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={7}>
          <StatutoryLocationMappingManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={8}>
          <PFConfiguration company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={9}>
          <ESIConfiguration company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={10}>
          <PTConfiguration company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={11}>
          <LWFConfiguration company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={12}>
          <TDSConfiguration company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={13}>
          <SalaryHeadMapping company={company} />
        </TabPanel>
        <TabPanel value={tabValue} index={14}>
          <Form16Management company={company} />
        </TabPanel>
      </Paper>
    </Container>
  );
}


