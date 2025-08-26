import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import LoginModal from './LoginModal';

const LandingHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleLogin = () => {
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    // User will be automatically redirected to the dashboard after successful login
    console.log('Login successful, user will be redirected');
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
  };

  return (
    <>
      <AppBar
        position='fixed'
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Container maxWidth='lg'>
          <Toolbar sx={{ px: { xs: 0 } }}>
            <Typography
              variant='h6'
              component='div'
              sx={{
                flexGrow: 1,
                fontWeight: 'bold',
                color: 'primary.main',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              onClick={() => navigate('/')}
            >
              <img
                src='/favicon.ico'
                alt='AI-powered Insurance Assistant System'
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                }}
              />
              AI-powered Insurance Assistant System
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && (
                <>
                  <Button
                    color='inherit'
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {t('landing.nav.features')}
                  </Button>
                  <Button
                    color='inherit'
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {t('landing.nav.pricing')}
                  </Button>
                  <Button
                    color='inherit'
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {t('landing.nav.about')}
                  </Button>
                </>
              )}

              <LanguageSwitcher />

              <Button
                variant='outlined'
                onClick={handleLogin}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                {t('landing.nav.login')}
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <LoginModal
        open={loginModalOpen}
        onClose={handleCloseLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default LandingHeader;
