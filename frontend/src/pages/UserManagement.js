import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch users
  const { isLoading, refetch } = useQuery(
    'adminUsers',
    () =>
      api.get(endpoints.adminUsers).then(res => {
        setUsers(res.data);
        return res.data;
      }),
    { refetchInterval: 30000 }
  );

  // Create/Update user mutation
  const userMutation = useMutation(
    data => {
      if (editingUser) {
        return api.patch(endpoints.adminUser(editingUser.id), data);
      } else {
        return api.post(endpoints.adminUsers, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          editingUser ? t('user.updateSuccess') : t('user.createSuccess')
        );
        setDialogOpen(false);
        setEditingUser(null);
        refetch();
      },
      onError: error => {
        toast.error(
          error.response?.data?.detail ||
            (editingUser ? t('errors.general') : t('errors.general'))
        );
      },
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    userId => api.delete(endpoints.adminUser(userId)),
    {
      onSuccess: () => {
        toast.success(t('user.deleteSuccess'));
        refetch();
      },
      onError: error => {
        toast.error(error.response?.data?.detail || t('errors.general'));
      },
    }
  );

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = `${t('common.username')} ${t('common.required')}`;
    }

    if (!formData.email.trim()) {
      errors.email = `${t('common.email')} ${t('common.required')}`;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('user.emailInvalid');
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = t('user.passwordRequired');
    }

    if (!formData.role) {
      errors.role = t('user.roleRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email || '',
        role: user.role,
        password: '',
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
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      role: 'user',
      password: '',
    });
    setFormErrors({});
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('errors.validation'));
      return;
    }

    const submitData = { ...formData };
    if (editingUser && !submitData.password) {
      delete submitData.password;
    }

    userMutation.mutate(submitData);
  };

  const handleDelete = userId => {
    if (window.confirm(t('user.deleteConfirm'))) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const getRoleColor = role => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleIcon = role => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings />;
      case 'user':
        return <Person />;
      default:
        return <Person />;
    }
  };

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={4}
      >
        <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
          {t('user.title')}
        </Typography>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          {t('user.addUser')}
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Box}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('common.email')}</TableCell>
              <TableCell>{t('common.role')}</TableCell>
              <TableCell>{t('common.created')}</TableCell>
              <TableCell>{t('common.updated')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <Typography>{t('common.loading')}</Typography>
                </TableCell>
              </TableRow>
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <Typography color='text.secondary'>
                    {t('common.no')} {t('common.name')} {t('common.found')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users
                .filter(
                  user =>
                    user && typeof user === 'object' && user.id && user.username
                )
                .map(user => {
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box display='flex' alignItems='center'>
                          <Person sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography
                            variant='body1'
                            sx={{ fontWeight: 'medium' }}
                          >
                            {user.username || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role || 'N/A'}
                          color={getRoleColor(user.role)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {user.updated_at
                            ? new Date(user.updated_at).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t('common.active')}
                          color='success'
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Box display='flex' gap={1}>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDelete(user.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingUser ? t('user.editUser') : t('user.addUser')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label={t('common.username')}
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              required
              error={!!formErrors.username}
              helperText={formErrors.username}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={t('common.email')}
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id='role-label'>{t('common.role')}</InputLabel>
              <Select
                labelId='role-label'
                value={formData.role}
                label={t('common.role')}
                onChange={e => handleInputChange('role', e.target.value)}
                required
                error={!!formErrors.role}
              >
                <MenuItem value='user'>
                  <Box display='flex' alignItems='center'>
                    <Person sx={{ mr: 1 }} />
                    {t('common.user')}
                  </Box>
                </MenuItem>
                <MenuItem value='admin'>
                  <Box display='flex' alignItems='center'>
                    <AdminPanelSettings sx={{ mr: 1 }} />
                    {t('common.admin')}
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={editingUser ? t('user.newPassword') : t('common.password')}
              type='password'
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              required={!editingUser}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={userMutation.isLoading}
            >
              {userMutation.isLoading ? (
                <Typography>{t('common.saving')}</Typography>
              ) : editingUser ? (
                t('common.update')
              ) : (
                t('common.create')
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
