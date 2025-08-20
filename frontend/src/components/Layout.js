import React, { useState } from 'react';
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
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  People,
  Description,
  SmartToy,
  Storage,
  HealthAndSafety,
  AccountCircle,
  Logout,
  QuestionAnswer,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/slices/authSlice';
import { setSidebarOpen } from '../store/slices/uiSlice';
import LanguageSwitcher from './LanguageSwitcher';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const user = useSelector(state => state.auth.user);
  const sidebarOpen = useSelector(state => state.ui.sidebarOpen);

  const handleDrawerToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  const handleProfileMenuOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    dispatch(logout());
    navigate('/login');
  };

  const navigationItems = [
    {
      text: t('navigation.dashboard'),
      icon: <Dashboard />,
      path: '/',
      roles: ['admin', 'user'],
    },
    {
      text: t('navigation.companies'),
      icon: <Business />,
      path: '/companies',
      roles: ['admin'],
    },
    {
      text: t('navigation.users'),
      icon: <People />,
      path: '/users',
      roles: ['admin'],
    },
    {
      text: t('navigation.documents'),
      icon: <Description />,
      path: '/documents',
      roles: ['admin', 'user'],
    },
    {
      text: t('navigation.agents'),
      icon: <SmartToy />,
      path: '/agents',
      roles: ['admin'],
    },
    {
      text: t('navigation.qaLogs'),
      icon: <QuestionAnswer />,
      path: '/qa-logs',
      roles: ['admin', 'user'],
    },
    {
      text: t('navigation.vectorStore'),
      icon: <Storage />,
      path: '/vectorstore',
      roles: ['admin'],
    },
    {
      text: t('navigation.systemHealth'),
      icon: <HealthAndSafety />,
      path: '/health',
      roles: ['admin'],
    },
  ];

  const drawer = (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' component='div' sx={{ fontWeight: 'bold' }}>
          Insurance System
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) dispatch(setSidebarOpen(false));
                }}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path ? 'inherit' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position='fixed'
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color='inherit'
            aria-label='open drawer'
            edge='start'
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)
              ?.text || t('navigation.dashboard')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageSwitcher />
            <Typography variant='body2' sx={{ mr: 2 }}>
              {user?.username}
            </Typography>
            <IconButton
              size='large'
              edge='end'
              aria-label='account of current user'
              aria-controls='menu-appbar'
              aria-haspopup='true'
              onClick={handleProfileMenuOpen}
              color='inherit'
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component='nav'
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant='temporary'
          open={sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant='permanent'
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize='small' />
          </ListItemIcon>
          {t('navigation.logout')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
