import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessIcon from '@mui/icons-material/Business';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

// Menu items - can be filtered based on user role
const getMenuItems = (user) => {
  const roleName = user?.role?.name?.toLowerCase() || '';
  const isEmployee = roleName === 'employee';
  const isSuperAdmin = roleName === 'super admin';
  const isHRAdmin = roleName === 'hr/admin';
  const isFinance = roleName === 'finance';
  const isAuditor = roleName === 'auditor';
  const isCompanyAdmin = roleName === 'company admin';
  
  if (isEmployee) {
    // Employee Portal Menu - Self-service portal only
    return [
      { text: 'My Dashboard', icon: <DashboardIcon />, path: '/portal' },
      { text: 'My Payslips', icon: <AccountBalanceIcon />, path: '/portal/payslips' },
      { text: 'My Attendance', icon: <EventAvailableIcon />, path: '/portal/attendance' },
      { text: 'My Leaves', icon: <EventBusyIcon />, path: '/portal/leaves' },
      { text: 'IT Declaration', icon: <AssessmentIcon />, path: '/portal/it-declaration' },
      { text: 'Helpdesk', icon: <HelpIcon />, path: '/portal/helpdesk' },
      { text: 'My Profile', icon: <PeopleIcon />, path: '/portal/profile' },
    ];
  }
  
  if (isSuperAdmin) {
    // Super Admin Menu - Only Company Management
    return [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Companies', icon: <BusinessIcon />, path: '/companies' },
    ];
  }

  if (isAuditor) {
    // Auditor Menu - Read-only access to all data
    return [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
      { text: 'Payroll', icon: <AccountBalanceIcon />, path: '/payroll' },
      { text: 'Attendance', icon: <EventAvailableIcon />, path: '/attendance' },
      { text: 'Leaves', icon: <EventBusyIcon />, path: '/leaves' },
      { text: 'Loans', icon: <AccountBalanceWalletIcon />, path: '/loans' },
      { text: 'Reimbursements', icon: <ReceiptIcon />, path: '/reimbursements' },
      { text: 'Supplementary', icon: <AttachMoneyIcon />, path: '/supplementary' },
      { text: 'Increments', icon: <TrendingUpIcon />, path: '/increments' },
      { text: 'Statutory Config', icon: <SettingsIcon />, path: '/statutory' },
      { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
      { text: 'Analytics', icon: <AssessmentIcon />, path: '/analytics' },
    ];
  }

  if (isFinance) {
    // Finance Menu - Salary Processing + Statutory Reports
    return [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Payroll', icon: <AccountBalanceIcon />, path: '/payroll' },
      { text: 'Statutory Config', icon: <SettingsIcon />, path: '/statutory' },
      { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
      { text: 'Analytics', icon: <AssessmentIcon />, path: '/analytics' },
    ];
  }

  // Company Admin or HR/Admin Menu - Employee + Payroll + Attendance
  if (isCompanyAdmin || isHRAdmin) {
    const menuItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
      { text: 'Payroll', icon: <AccountBalanceIcon />, path: '/payroll' },
      { text: 'Attendance', icon: <EventAvailableIcon />, path: '/attendance' },
      { text: 'Biometric Devices', icon: <FingerprintIcon />, path: '/biometric' },
      { text: 'Office Locations', icon: <LocationOnIcon />, path: '/office-locations' },
      { text: 'Leaves', icon: <EventBusyIcon />, path: '/leaves' },
      { text: 'Loans', icon: <AccountBalanceWalletIcon />, path: '/loans' },
      { text: 'Reimbursements', icon: <ReceiptIcon />, path: '/reimbursements' },
      { text: 'Supplementary', icon: <AttachMoneyIcon />, path: '/supplementary' },
      { text: 'Increments', icon: <TrendingUpIcon />, path: '/increments' },
      { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    ];

    // Add Company Management submenu and Users only for Company Admin
    if (isCompanyAdmin) {
      menuItems.push({ 
        text: 'Company Management', 
        icon: <BusinessIcon />, 
        path: '/company',
        hasSubmenu: true,
        submenu: [
          { text: 'Company Info', path: '/company', tab: 0 },
          { text: 'Branches', path: '/company', tab: 1 },
          { text: 'Departments', path: '/company', tab: 2 },
          { text: 'Designations', path: '/company', tab: 3 },
          { text: 'Regions', path: '/company', tab: 4 },
          { text: 'Email Templates', path: '/company', tab: 5 },
          { text: 'News & Policies', path: '/company', tab: 6 },
          { text: 'Settings', path: '/company', tab: 7 },
        ]
      });
      menuItems.push({ text: 'Users', icon: <PeopleIcon />, path: '/users' });
    }

    return menuItems;
  }
  
  // Default menu for other roles
  return [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  ];
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Auto-open Company Management submenu if on that page
  React.useEffect(() => {
    if (location.pathname.startsWith('/company')) {
      setOpenSubmenus(prev => ({
        ...prev,
        'Company Management': true
      }));
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmenuToggle = (itemText) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  };

  const handleSubmenuClick = (item, submenuItem) => {
    if (submenuItem.tab !== undefined) {
      // Store tab index in sessionStorage to restore it when navigating
      sessionStorage.setItem('companyManagementTab', submenuItem.tab.toString());
      // Trigger a custom event to notify the CompanyManagement component
      window.dispatchEvent(new Event('companyManagementTabChange'));
    }
    navigate(submenuItem.path);
  };

  const renderMenuItem = (item) => {
    if (item.hasSubmenu && item.submenu) {
      const isOpen = openSubmenus[item.text] || false;
      const isSelected = location.pathname.startsWith(item.path);
      
      return (
        <React.Fragment key={item.text}>
          <ListItem disablePadding>
            <ListItemButton
              selected={isSelected}
              onClick={() => handleSubmenuToggle(item.text)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu.map((submenuItem) => (
                <ListItem key={submenuItem.text} disablePadding>
                  <ListItemButton
                    sx={{ pl: 4 }}
                    selected={location.pathname === submenuItem.path && 
                             (submenuItem.tab === undefined || 
                              parseInt(sessionStorage.getItem('companyManagementTab') || '0') === submenuItem.tab)}
                    onClick={() => handleSubmenuClick(item, submenuItem)}
                  >
                    <ListItemText primary={submenuItem.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.text} disablePadding>
        <ListItemButton
          selected={location.pathname.startsWith(item.path)}
          onClick={() => navigate(item.path)}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    );
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Payroll System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems(user).map((item) => renderMenuItem(item))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Welcome, {user?.firstName} {user?.lastName}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

