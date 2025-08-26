import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  People,
  AdminPanelSettings,
  Person,
  CheckCircle,
  Warning,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, endpoints } from '../services/api';

const UserManagement = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [animateCards, setAnimateCards] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch data with error handling
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get(endpoints.adminUsers).then(res => res.data),
    retry: 1,
    retryDelay: 1000,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: data => api.post(endpoints.adminUsers, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSnackbar({
        open: true,
        message: t('user.createSuccess'),
        severity: 'success',
      });
      handleCloseDialog();
    },
    onError: error => {
      // Extract specific error message from backend response
      let errorMessage = t('user.createError');

      if (error.response?.data) {
        const responseData = error.response.data;

        // Handle different error response formats
        if (typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (Array.isArray(responseData.detail)) {
          // Handle validation error array
          errorMessage = responseData.detail
            .map(err => err.msg || err.message || 'Validation error')
            .join(', ');
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(endpoints.adminUser(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSnackbar({
        open: true,
        message: t('user.updateSuccess'),
        severity: 'success',
      });
      handleCloseDialog();
    },
    onError: error => {
      // Extract specific error message from backend response
      let errorMessage = t('user.updateError');

      if (error.response?.data) {
        const responseData = error.response.data;

        // Handle different error response formats
        if (typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (Array.isArray(responseData.detail)) {
          // Handle validation error array
          errorMessage = responseData.detail
            .map(err => err.msg || err.message || 'Validation error')
            .join(', ');
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: id => api.delete(endpoints.adminUser(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSnackbar({
        open: true,
        message: t('user.deleteSuccess'),
        severity: 'success',
      });
    },
    onError: error => {
      // Extract specific error message from backend response
      let errorMessage = t('user.deleteError');

      if (error.response?.data) {
        const responseData = error.response.data;

        // Handle different error response formats
        if (typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (Array.isArray(responseData.detail)) {
          // Handle validation error array
          errorMessage = responseData.detail
            .map(err => err.msg || err.message || 'Validation error')
            .join(', ');
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    },
  });

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        password: '', // Clear password when editing
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        role: 'user',
        password: '',
      });
    }
    setFormErrors({}); // Clear any previous errors
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      role: 'user',
      password: '',
    });
    setFormErrors({}); // Clear errors when closing
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = { ...formData };

    if (editingUser) {
      // For editing, only include password if it's provided
      if (!submitData.password) {
        delete submitData.password;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      // For creating, password is required
      createUserMutation.mutate(submitData);
    }
  };

  const handleDelete = id => {
    if (window.confirm(t('user.deleteConfirm'))) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleInputChange = field => e => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = t('user.usernameRequired');
    } else if (formData.username.length < 3) {
      errors.username = t('user.usernameMinLength');
    }

    if (!formData.email.trim()) {
      errors.email = t('user.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('user.emailInvalid');
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = t('user.passwordRequired');
    } else if (formData.password && formData.password.length < 8) {
      errors.password = t('user.passwordMinLength');
    }

    if (!formData.role) {
      errors.role = t('user.roleRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle loading state
  if (usersLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <Box sx={{ position: 'relative', mb: 3 }}>
          <LinearProgress size={80} thickness={4} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <People sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
        </Box>
        <Typography variant='h5' color='textSecondary' sx={{ mb: 1 }}>
          {t('common.loading')}
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          Loading users...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (usersError) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <People sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant='h5' color='error.main' sx={{ mb: 2 }}>
            Connection Error
          </Typography>
          <Typography variant='body1' color='textSecondary' sx={{ mb: 3 }}>
            Unable to connect to the backend server. Please check if the server
            is running.
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            This is normal if you&apos;re running the frontend without the
            backend server.
          </Typography>
        </Box>
      </Box>
    );
  }

  const usersData = users || [];
  const totalStats = {
    users: usersData.length,
    admins: usersData.filter(user => user.role === 'admin').length,
    regularUsers: usersData.filter(user => user.role === 'user').length,
    activeUsers: usersData.filter(user => user.is_active !== false).length,
  };

  const statsCards = [
    {
      title: t('user.totalUsers'),
      value: totalStats.users,
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      trend: '+8',
      trendDirection: 'up',
      delay: 0,
    },
    {
      title: t('user.adminUsers'),
      value: totalStats.admins,
      icon: (
        <AdminPanelSettings sx={{ fontSize: 40, color: 'secondary.main' }} />
      ),
      color: 'secondary',
      trend: '+2',
      trendDirection: 'up',
      delay: 100,
    },
    {
      title: t('user.regularUsers'),
      value: totalStats.regularUsers,
      icon: <Person sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      trend: '+6',
      trendDirection: 'up',
      delay: 200,
    },
    {
      title: t('user.activeUsers'),
      value: totalStats.activeUsers,
      icon: <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
      trend: '+10%',
      trendDirection: 'up',
      delay: 300,
    },
  ];

  const getRoleColor = role => {
    const colorMap = {
      admin: 'error',
      user: 'primary',
    };
    return colorMap[role] || 'default';
  };

  const getRoleIcon = role => {
    const iconMap = {
      admin: <AdminPanelSettings />,
      user: <Person />,
    };
    return iconMap[role] || <Person />;
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header Section */}
      <Fade in={animateCards} timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h3'
            component='h1'
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            {t('user.management')}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('user.subtitle')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Divider sx={{ opacity: 0.3, flexGrow: 1, mr: 2 }} />
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              {t('user.addNew')}
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Grow in={animateCards} timeout={800 + card.delay}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    borderColor:
                      theme.palette[card.color]?.main ||
                      theme.palette.primary.main,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    <Zoom in={animateCards} timeout={1000 + card.delay}>
                      {card.icon}
                    </Zoom>
                  </Box>
                  <Typography
                    variant='h3'
                    component='div'
                    sx={{
                      fontWeight: 700,
                      color: theme.palette[card.color].main,
                      mb: 1,
                    }}
                  >
                    {card.value.toLocaleString()}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='textSecondary'
                    sx={{ mb: 2, fontWeight: 500 }}
                  >
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Chip
                      icon={
                        card.trendDirection === 'up' ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )
                      }
                      label={card.trend}
                      size='small'
                      color={card.trendDirection === 'up' ? 'success' : 'error'}
                      variant='outlined'
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Users Table */}
      <Slide direction='up' in={animateCards} timeout={1200}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: theme.shadows[8],
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <People sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {t('user.usersList')}
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('user.username')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('user.email')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('user.role')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('user.status')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('user.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersData.map(user => (
                    <TableRow
                      key={user.id}
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          background: theme.palette.action.hover,
                          transform: 'scale(1.01)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 2,
                              bgcolor:
                                theme.palette[getRoleColor(user.role)].main,
                            }}
                          >
                            {getRoleIcon(user.role)}
                          </Avatar>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 600 }}
                          >
                            {user.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='textSecondary'>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={t(`user.roles.${user.role}`)}
                          size='small'
                          color={getRoleColor(user.role)}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            user.is_active !== false ? (
                              <CheckCircle />
                            ) : (
                              <Warning />
                            )
                          }
                          label={
                            user.is_active !== false
                              ? t('user.active')
                              : t('user.inactive')
                          }
                          size='small'
                          color={
                            user.is_active !== false ? 'success' : 'warning'
                          }
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={t('user.edit')}>
                            <IconButton
                              size='small'
                              color='secondary'
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('user.delete')}>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleDelete(user.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Slide>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingUser ? t('user.editUser') : t('user.addUser')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('user.username')}
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  required
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('user.email')}
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth error={!!formErrors.role}>
                  <InputLabel>{t('user.role')}</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleInputChange('role')}
                    label={t('user.role')}
                  >
                    <MenuItem value='user'>{t('user.roles.user')}</MenuItem>
                    <MenuItem value='admin'>{t('user.roles.admin')}</MenuItem>
                  </Select>
                  {formErrors.role && (
                    <Typography
                      variant='caption'
                      color='error'
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {formErrors.role}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('user.password')}
                  type='password'
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required={!editingUser} // Only required for new users
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={
                createUserMutation.isLoading || updateUserMutation.isLoading
              }
            >
              {editingUser ? t('common.update') : t('common.create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
