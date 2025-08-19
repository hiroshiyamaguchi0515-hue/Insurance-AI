import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  People,
  AdminPanelSettings,
  Person,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading } = useQuery('users', () =>
    api.get('/admin/users').then(res => res.data)
  );

  // Create/Update user mutation
  const userMutation = useMutation(
    data => {
      if (editingUser) {
        return api.patch(`/admin/users/${editingUser.id}`, data);
      } else {
        return api.post('/admin/users', data);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          editingUser
            ? 'User updated successfully!'
            : 'User created successfully!'
        );
        queryClient.invalidateQueries('users');
        handleCloseDialog();
      },
      onError: error => {
        toast.error(error.response?.data?.detail || 'Operation failed');
      },
    }
  );

  // Delete user mutation
  const deleteMutation = useMutation(
    userId => api.delete(`/admin/users/${userId}`),
    {
      onSuccess: () => {
        toast.success('User deleted successfully!');
        queryClient.invalidateQueries('users');
      },
      onError: error => {
        toast.error(error.response?.data?.detail || 'Delete failed');
      },
    }
  );

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = 'Password is required for new users';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
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
      toast.error('Please fix the form errors before submitting');
      return;
    }

    const submitData = { ...formData };
    if (editingUser && !submitData.password) {
      delete submitData.password;
    }

    userMutation.mutate(submitData);
  };

  const handleDelete = userId => {
    if (
      window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      deleteMutation.mutate(userId);
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
        <Typography>Loading users...</Typography>
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
          User Management
        </Typography>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Box}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display='flex' alignItems='center'>
                    <People sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                      {user.username}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Chip label='Active' color='success' size='small' />
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
            ))}
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
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label='Username'
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              required
              error={!!formErrors.username}
              helperText={formErrors.username}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label='Email'
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Role'
                  select
                  value={formData.role}
                  onChange={e => handleInputChange('role', e.target.value)}
                  required
                  error={!!formErrors.role}
                >
                  <MenuItem value='user'>
                    <Box display='flex' alignItems='center'>
                      <Person sx={{ mr: 1 }} />
                      User
                    </Box>
                  </MenuItem>
                  <MenuItem value='admin'>
                    <Box display='flex' alignItems='center'>
                      <AdminPanelSettings sx={{ mr: 1 }} />
                      Admin
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={
                    editingUser
                      ? 'New Password (leave blank to keep current)'
                      : 'Password'
                  }
                  type='password'
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  required={!editingUser}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={userMutation.isLoading}
            >
              {userMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : editingUser ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
