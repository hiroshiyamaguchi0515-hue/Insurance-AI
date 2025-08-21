import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { LockOutlined, Business } from '@mui/icons-material';
import { loginUser } from '../store/slices/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading, error, isAuthenticated, user } = useSelector(
    state => state.auth
  );

  // Stabilize the navigate function to prevent unnecessary re-runs
  const handleNavigate = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Debug logging to help identify error handling issues
  useEffect(() => {
    console.log('Login component state:', { loading, error, isAuthenticated });
  }, [loading, error, isAuthenticated]);

  // Simple redirect when authentication succeeds
  useEffect(() => {
    console.log('🔍 Login useEffect triggered:', {
      isAuthenticated,
      user: !!user, // Add user to log for debugging
      timestamp: Date.now(),
    });
    // Only redirect if authenticated AND user data is available
    if (isAuthenticated && user) {
      console.log('🚀 Redirecting to home page');
      handleNavigate();
    }
  }, [isAuthenticated, user, handleNavigate]);

  // Remove the problematic useEffect that was causing infinite loops
  // App.js will handle authentication redirects

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = t('auth.usernameRequired') || 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired') || 'Password is required';
    }
    setErrors(newErrors);
    // Remove this clearError call as it causes infinite loops
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(loginUser(formData));
    }
  };

  return (
    <Container component='main' maxWidth='sm'>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              color: 'primary.main',
            }}
          >
            <Business sx={{ fontSize: 40, mr: 2 }} />
            <Typography component='h1' variant='h4' sx={{ fontWeight: 'bold' }}>
              Insurance System
            </Typography>
          </Box>

          <Typography
            component='h2'
            variant='h5'
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            {t('auth.loginTitle') || 'Sign in to your account'}
          </Typography>

          {error && (
            <Alert severity='error' sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin='normal'
              required
              fullWidth
              id='username'
              label={t('auth.username') || 'Username'}
              name='username'
              autoComplete='username'
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <TextField
              margin='normal'
              required
              fullWidth
              name='password'
              label={t('auth.password') || 'Password'}
              type='password'
              id='password'
              autoComplete='current-password'
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              sx={{ mb: 3 }}
            />
            <Button
              type='submit'
              fullWidth
              variant='contained'
              disabled={loading || !formData.username || !formData.password}
              sx={{
                mt: 1,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color='inherit' />
              ) : (
                <>
                  <LockOutlined sx={{ mr: 1 }} />
                  {t('auth.loginButton') || 'Sign In'}
                </>
              )}
            </Button>
          </Box>

          <Typography
            variant='body2'
            color='text.secondary'
            align='center'
            sx={{ mt: 2 }}
          >
            {t('auth.loginSubtitle') ||
              'AI-powered PDF document analysis and question answering system'}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
