import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';

const LoginModal = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = field => event => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = t('auth.usernameRequired');
    }
    if (!formData.password.trim()) {
      errors.password = t('auth.passwordRequired');
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData)).unwrap();
      if (result.access_token) {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (error) {
      // Error is handled by the auth slice
      console.error('Login failed:', error);
    }
  };

  const handleClose = () => {
    setFormData({ username: '', password: '' });
    setValidationErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountCircle sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant='h5' component='div' sx={{ fontWeight: 'bold' }}>
            {t('auth.login')}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size='small'
          sx={{ color: 'grey.500' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Typography
            variant='body2'
            color='textSecondary'
            sx={{ mb: 3, textAlign: 'center' }}
          >
            {t('auth.loginSubtitle')}
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('auth.username')}
            placeholder={t('auth.usernamePlaceholder')}
            value={formData.username}
            onChange={handleInputChange('username')}
            error={!!validationErrors.username}
            helperText={validationErrors.username}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <AccountCircle sx={{ color: 'grey.500' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.passwordPlaceholder')}
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Lock sx={{ color: 'grey.500' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge='end'
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            variant='outlined'
            sx={{ minWidth: 100 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={loading}
            sx={{ minWidth: 100 }}
            startIcon={
              loading ? <CircularProgress size={20} color='inherit' /> : null
            }
          >
            {loading ? t('common.loading') : t('auth.loginButton')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LoginModal;
