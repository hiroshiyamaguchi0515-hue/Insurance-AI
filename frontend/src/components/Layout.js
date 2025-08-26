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
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  People,
  Description,
  SmartToy,
  Storage,
  AccountCircle,
  Logout,
  QuestionAnswer,
  Chat,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/slices/authSlice';
import { setSidebarOpen } from '../store/slices/uiSlice';
import LanguageSwitcher from './LanguageSwitcher';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const Layout = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
      roles: ['admin'],
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
      text: t('navigation.chat'),
      icon: <Chat />,
      path: '/chat',
      roles: ['admin', 'user'],
    },
    {
      text: t('navigation.vectorStore'),
      icon: <Storage />,
      path: '/vectorstore',
      roles: ['admin'],
    },
  ];

  const currentDrawerWidth = sidebarCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  const drawer = (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 64,
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant='h6' component='div' sx={{ fontWeight: 'bold' }}>
            Insurance Assistant
          </Typography>
        )}
        <IconButton
          onClick={handleSidebarCollapse}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navigationItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <ListItem key={item.text} disablePadding>
              <Tooltip
                title={sidebarCollapsed ? item.text : ''}
                placement='right'
                disableHoverListener={!sidebarCollapsed}
              >
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) dispatch(setSidebarOpen(false));
                  }}
                  sx={{
                    minHeight: 48,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    px: sidebarCollapsed ? 1 : 3,
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
                      color: 'inherit',
                      minWidth: sidebarCollapsed ? 0 : 40,
                      mr: sidebarCollapsed ? 0 : 3,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && <ListItemText primary={item.text} />}
                </ListItemButton>
              </Tooltip>
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
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
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
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 } }}
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
              width: currentDrawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
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
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
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
