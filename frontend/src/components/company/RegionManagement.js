import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab
} from '@mui/material';
import CountryManagement from './CountryManagement';
import StateManagement from './StateManagement';
import CityManagement from './CityManagement';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RegionManagement() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Countries" />
          <Tab label="States" />
          <Tab label="Cities" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <CountryManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <StateManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <CityManagement />
      </TabPanel>
    </Box>
  );
}

