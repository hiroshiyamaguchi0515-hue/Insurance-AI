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
  Chip,
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
  Info,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/slices/authSlice';
import { setSidebarOpen } from '../store/slices/uiSlice';
import LanguageSwitcher from './LanguageSwitcher';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

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

  // Get version from package.json
  const version = '1.0.0'; // This could be imported from package.json or environment variable

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
      category: 'main',
    },
    {
      text: t('navigation.companies'),
      icon: <Business />,
      path: '/companies',
      roles: ['admin'],
      category: 'management',
    },
    {
      text: t('navigation.users'),
      icon: <People />,
      path: '/users',
      roles: ['admin'],
      category: 'management',
    },
    {
      text: t('navigation.documents'),
      icon: <Description />,
      path: '/documents',
      roles: ['admin'],
      category: 'content',
    },
    {
      text: t('navigation.agents'),
      icon: <SmartToy />,
      path: '/agents',
      roles: ['admin'],
      category: 'ai',
    },
    {
      text: t('navigation.qaLogs'),
      icon: <QuestionAnswer />,
      path: '/qa-logs',
      roles: ['admin'],
      category: 'ai',
    },
    {
      text: t('navigation.chat'),
      icon: <Chat />,
      path: '/chat',
      roles: ['admin', 'user'],
      category: 'ai',
    },
    {
      text: t('navigation.vectorStore'),
      icon: <Storage />,
      path: '/vectorstore',
      roles: ['admin'],
      category: 'ai',
    },
  ];

  const currentDrawerWidth = sidebarCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  // Group navigation items by category
  const groupedItems = navigationItems
    .filter(item => item.roles.includes(user?.role))
    .reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          minHeight: 80,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.light} 100%)`,
          },
        }}
      >
        {!sidebarCollapsed && (
          <Box>
            <Typography
              variant='h6'
              component='div'
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '0.5px',
                mb: 0.5,
              }}
            >
              Insurance Assistant
            </Typography>
            <Typography
              variant='caption'
              sx={{
                opacity: 0.9,
                fontSize: '0.75rem',
                letterSpacing: '0.3px',
              }}
            >
              AI-Powered System
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={handleSidebarCollapse}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {Object.entries(groupedItems).map(([category, items]) => (
          <Box key={category} sx={{ mb: 2 }}>
            {!sidebarCollapsed && (
              <Box sx={{ px: 3, py: 1.5 }}>
                <Typography
                  variant='overline'
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  {category === 'main'
                    ? t('navigation.categories.main')
                    : category === 'management'
                      ? t('navigation.categories.management')
                      : category === 'content'
                        ? t('navigation.categories.content')
                        : category === 'ai'
                          ? t('navigation.categories.aiServices')
                          : category}
                </Typography>
              </Box>
            )}
            <List sx={{ py: 0 }}>
              {items.map(item => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
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
                        minHeight: 52,
                        mx: 1.5,
                        borderRadius: 2,
                        justifyContent: sidebarCollapsed
                          ? 'center'
                          : 'flex-start',
                        px: sidebarCollapsed ? 2 : 3,
                        py: 1.5,
                        transition: 'all 0.2s ease-in-out',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          boxShadow: theme.shadows[4],
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                            transform: 'translateY(-1px)',
                            boxShadow: theme.shadows[6],
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'inherit',
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[2],
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: 'inherit',
                          minWidth: sidebarCollapsed ? 0 : 40,
                          mr: sidebarCollapsed ? 0 : 2.5,
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!sidebarCollapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            letterSpacing: '0.2px',
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer with Version */}
      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
          }}
        >
          {!sidebarCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                }}
              >
                v{version}
              </Typography>
            </Box>
          )}
          {sidebarCollapsed && (
            <Tooltip title={`Version ${version}`} placement='right'>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Chip
                  label={version}
                  size='small'
                  sx={{
                    fontSize: '0.6rem',
                    height: 20,
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
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
