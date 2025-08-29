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
  IconButton,
  Slide,
  useScrollTrigger,
} from '@mui/material';
import { Menu as MenuIcon, ArrowForward, Business } from '@mui/icons-material';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll trigger for collapsible header
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleLogin = () => {
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    console.log('Login successful, user will be redirected');
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
  };

  const scrollToSection = sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Approximate header height
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <AppBar
        position='fixed'
        elevation={0}
        sx={{
          background: trigger
            ? 'rgba(255, 255, 255, 0.42)'
            : 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease-in-out',
          transform: trigger ? 'translateY(-100%)' : 'translateY(0)',
          boxShadow: trigger ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
          height: '64px',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.65)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.18)',
          },
        }}
      >
        <Container maxWidth='lg'>
          <Toolbar
            sx={{
              px: { xs: 0 },
              minHeight: { xs: 44, md: 52 },
              justifyContent: 'space-between',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {/* Logo Section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mr: 2,
                }}
              >
                <Box
                  sx={{
                    width: trigger ? 24 : 28,
                    height: trigger ? 24 : 28,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Business
                    sx={{
                      color: 'white',
                      fontSize: trigger ? 12 : 14,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  />
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: { xs: 'none', sm: 'block' },
                    fontSize: trigger ? '0.875rem' : '1rem',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  Insurance AI
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  color='inherit'
                  onClick={() => scrollToSection('features')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    background: 'transparent',
                    border: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'rgba(25, 118, 210, 0.04)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {t('landing.nav.features')}
                </Button>
                <Button
                  color='inherit'
                  onClick={() => scrollToSection('pricing')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    background: 'transparent',
                    border: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'rgba(25, 118, 210, 0.04)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {t('landing.nav.pricing')}
                </Button>
                <Button
                  color='inherit'
                  onClick={() => scrollToSection('about')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    background: 'transparent',
                    border: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'rgba(25, 118, 210, 0.04)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {t('landing.nav.about')}
                </Button>
              </Box>
            )}

            {/* Right Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LanguageSwitcher />

              {!isMobile && (
                <Button
                  variant='contained'
                  onClick={handleLogin}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    py: 0.8,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  {t('landing.nav.login')}
                  <ArrowForward sx={{ ml: 1, fontSize: 14 }} />
                </Button>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  sx={{
                    color: 'text.primary',
                    p: 0.8,
                    borderRadius: 1.5,
                    '&:hover': {
                      background: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <MenuIcon sx={{ fontSize: 20 }} />
                </IconButton>
              )}
            </Box>
          </Toolbar>

          {/* Mobile Menu */}
          <Slide direction='down' in={mobileMenuOpen && isMobile} timeout={300}>
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                py: 2,
                px: 2,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth
                  color='inherit'
                  onClick={() => scrollToSection('features')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    justifyContent: 'flex-start',
                    py: 1.2,
                    px: 1.5,
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  {t('landing.nav.features')}
                </Button>
                <Button
                  fullWidth
                  color='inherit'
                  onClick={() => scrollToSection('pricing')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    justifyContent: 'flex-start',
                    py: 1.2,
                    px: 1.5,
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  {t('landing.nav.pricing')}
                </Button>
                <Button
                  fullWidth
                  color='inherit'
                  onClick={() => scrollToSection('about')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    justifyContent: 'flex-start',
                    py: 1.2,
                    px: 1.5,
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  {t('landing.nav.about')}
                </Button>
                <Button
                  fullWidth
                  variant='contained'
                  onClick={handleLogin}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    mt: 1,
                    py: 1.2,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    fontSize: '0.9rem',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  {t('landing.nav.login')}
                  <ArrowForward sx={{ ml: 1, fontSize: 16 }} />
                </Button>
              </Box>
            </Box>
          </Slide>
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
