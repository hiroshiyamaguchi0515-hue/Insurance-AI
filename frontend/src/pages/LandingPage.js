import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Description,
  SmartToy,
  Storage,
  Security,
  Speed,
  Analytics,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LandingHeader from '../components/LandingHeader';
import LoginModal from '../components/LoginModal';

const LandingPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleGetStarted = () => {
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    // User will be automatically redirected to the dashboard after successful login
    console.log('Login successful, user will be redirected');
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
  };

  const features = [
    {
      icon: <Description sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: t('landing.features.documentAnalysis.title'),
      description: t('landing.features.documentAnalysis.description'),
    },
    {
      icon: <SmartToy sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: t('landing.features.aiAgents.title'),
      description: t('landing.features.aiAgents.description'),
    },
    {
      icon: <Storage sx={{ fontSize: 40, color: 'info.main' }} />,
      title: t('landing.features.vectorStore.title'),
      description: t('landing.features.vectorStore.description'),
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'success.main' }} />,
      title: t('landing.features.security.title'),
      description: t('landing.features.security.description'),
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: t('landing.features.performance.title'),
      description: t('landing.features.performance.description'),
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: 'error.main' }} />,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
    },
  ];

  const benefits = [
    t('landing.benefits.time'),
    t('landing.benefits.accuracy'),
    t('landing.benefits.scalability'),
    t('landing.benefits.cost'),
    t('landing.benefits.security'),
    t('landing.benefits.integration'),
  ];

  return (
    <Box>
      <LandingHeader />

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          pt: { xs: 10, md: 14 }, // Add top padding for fixed header
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth='lg'>
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} md={6}>
              <Typography
                variant='h2'
                component='h1'
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
                {t('landing.hero.title')}
              </Typography>
              <Typography
                variant='h5'
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  lineHeight: 1.6,
                }}
              >
                {t('landing.hero.subtitle')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='contained'
                  size='large'
                  onClick={handleGetStarted}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  {t('landing.hero.getStarted')}
                  <ArrowForward sx={{ ml: 1 }} />
                </Button>
                <Button
                  variant='outlined'
                  size='large'
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  {t('landing.hero.learnMore')}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 280, md: 400 },
                    height: { xs: 280, md: 400 },
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <SmartToy
                    sx={{ fontSize: { xs: 120, md: 160 }, opacity: 0.8 }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth='lg' sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant='h3'
            component='h2'
            sx={{
              fontWeight: 'bold',
              mb: 3,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            {t('landing.features.title')}
          </Typography>
          <Typography
            variant='h6'
            color='textSecondary'
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            {t('landing.features.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition:
                    'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ mb: 3 }}>{feature.icon}</Box>
                  <Typography
                    variant='h6'
                    component='h3'
                    sx={{ fontWeight: 'bold', mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 10 } }}>
        <Container maxWidth='lg'>
          <Grid container spacing={6} alignItems='center'>
            <Grid item xs={12} md={6}>
              <Typography
                variant='h3'
                component='h2'
                sx={{
                  fontWeight: 'bold',
                  mb: 4,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                {t('landing.benefits.title')}
              </Typography>
              <Typography
                variant='h6'
                color='textSecondary'
                sx={{ mb: 4, lineHeight: 1.6 }}
              >
                {t('landing.benefits.subtitle')}
              </Typography>
              <Box>
                {benefits.map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        color: 'success.main',
                        mr: 2,
                        fontSize: 20,
                      }}
                    />
                    <Typography variant='body1'>{benefit}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                }}
              >
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 'bold',
                    mb: 3,
                    color: 'white',
                    textAlign: 'center',
                  }}
                >
                  {t('landing.stats.title')}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant='h3'
                        sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                      >
                        99.9%
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {t('landing.stats.uptime')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant='h3'
                        sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                      >
                        &lt;2s
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {t('landing.stats.responseTime')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant='h3'
                        sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                      >
                        24/7
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {t('landing.stats.support')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant='h3'
                        sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                      >
                        SSL
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {t('landing.stats.security')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container
        maxWidth='md'
        sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}
      >
        <Typography
          variant='h3'
          component='h2'
          sx={{
            fontWeight: 'bold',
            mb: 3,
            fontSize: { xs: '2rem', md: '2.5rem' },
          }}
        >
          {t('landing.cta.title')}
        </Typography>
        <Typography
          variant='h6'
          color='textSecondary'
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          {t('landing.cta.subtitle')}
        </Typography>
        <Button
          variant='contained'
          size='large'
          onClick={handleGetStarted}
          sx={{
            px: 6,
            py: 2,
            fontSize: '1.1rem',
            borderRadius: 2,
          }}
        >
          {t('landing.cta.button')}
          <ArrowForward sx={{ ml: 1 }} />
        </Button>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: 'grey.900',
          color: 'white',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Container maxWidth='lg'>
          <Typography variant='body2' sx={{ opacity: 0.8 }}>
            {t('landing.footer.copyright')}
          </Typography>
        </Container>
      </Box>

      <LoginModal
        open={loginModalOpen}
        onClose={handleCloseLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </Box>
  );
};

export default LandingPage;
