import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Rating,
  TextField,
  Alert,
  Snackbar,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  Paper,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  ArrowForward,
  Security,
  Speed,
  Analytics,
  SmartToy,
  Storage,
  CheckCircle,
  Send,
  Email,
  Phone,
  LocationOn,
  Description,
  Schedule,
  Business,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import LoginModal from '../components/LoginModal';
import ScrollButtons from '../components/ScrollButtons';

const LandingPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef({});

  // Lazy loading with intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    // Observe all sections
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll to section

  // Add ref to section
  const addSectionRef = (id, ref) => {
    if (ref) {
      sectionRefs.current[id] = ref;
    }
  };

  const handleGetStarted = () => {
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    console.log('Login successful, user will be redirected');
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
  };

  const handleContactSubmit = e => {
    e.preventDefault();
    setSending(true);

    // Simulate form submission
    setTimeout(() => {
      setSending(false);
      setSnackbar({
        open: true,
        message: t('landing.contact.form.success'),
        severity: 'success',
      });
      setContactForm({ name: '', email: '', company: '', message: '' });
    }, 2000);
  };

  const handleInputChange = field => e => {
    setContactForm(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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

  const reviews = t('landing.reviews.items', { returnObjects: true });

  return (
    <Box>
      <LandingHeader />

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth='lg'>
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
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
              </Fade>
              <Fade in timeout={1200}>
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
              </Fade>
              <Fade in timeout={1400}>
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
              </Fade>
            </Grid>
            <Grid item xs={12} md={6}>
              <Zoom in timeout={1500}>
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
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container
        maxWidth='lg'
        sx={{ py: { xs: 6, md: 10 } }}
        id='features'
        ref={ref => addSectionRef('features', ref)}
      >
        {visibleSections.has('features') && (
          <>
            <Fade in timeout={800}>
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
            </Fade>

            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Grow in timeout={800 + index * 100}>
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
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {/* Pricing Section */}
      <Box
        sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 10 } }}
        id='pricing'
        ref={ref => addSectionRef('pricing', ref)}
      >
        {visibleSections.has('pricing') && (
          <Container maxWidth='lg'>
            <Fade in timeout={800}>
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
                  {t('landing.pricing.title')}
                </Typography>
                <Typography
                  variant='h6'
                  color='textSecondary'
                  sx={{ maxWidth: 600, mx: 'auto' }}
                >
                  {t('landing.pricing.subtitle')}
                </Typography>
              </Box>
            </Fade>

            <Grid container spacing={4}>
              {[
                {
                  title: t('landing.pricing.starter.title'),
                  price: t('landing.pricing.starter.price'),
                  description: t('landing.pricing.starter.description'),
                  features: t('landing.pricing.starter.features', {
                    returnObjects: true,
                  }),
                  popular: false,
                },
                {
                  title: t('landing.pricing.professional.title'),
                  price: t('landing.pricing.professional.price'),
                  description: t('landing.pricing.professional.description'),
                  features: t('landing.pricing.professional.features', {
                    returnObjects: true,
                  }),
                  popular: true,
                },
                {
                  title: t('landing.pricing.enterprise.title'),
                  price: t('landing.pricing.enterprise.price'),
                  description: t('landing.pricing.enterprise.description'),
                  features: t('landing.pricing.enterprise.features', {
                    returnObjects: true,
                  }),
                  popular: false,
                },
              ].map((plan, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Grow in timeout={800 + index * 200}>
                    <Card
                      sx={{
                        height: '100%',
                        position: 'relative',
                        transition:
                          'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[8],
                        },
                        ...(plan.popular && {
                          border: `2px solid ${theme.palette.primary.main}`,
                          transform: 'scale(1.05)',
                        }),
                      }}
                    >
                      {plan.popular && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'primary.main',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {t('landing.pricing.mostPopular')}
                        </Box>
                      )}
                      <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Typography
                          variant='h4'
                          component='h3'
                          sx={{ fontWeight: 'bold', mb: 2 }}
                        >
                          {plan.title}
                        </Typography>
                        <Typography
                          variant='h3'
                          sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            color: 'primary.main',
                          }}
                        >
                          {plan.price}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          sx={{ mb: 3 }}
                        >
                          {plan.description}
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          {plan.features.map((feature, featureIndex) => (
                            <Box
                              key={featureIndex}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1,
                                justifyContent: 'center',
                              }}
                            >
                              <CheckCircle
                                sx={{
                                  color: 'success.main',
                                  mr: 1,
                                  fontSize: 16,
                                }}
                              />
                              <Typography variant='body2'>{feature}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Button
                          variant={plan.popular ? 'contained' : 'outlined'}
                          fullWidth
                          onClick={handleGetStarted}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                          }}
                        >
                          {t('landing.pricing.getStarted')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Container>
        )}
      </Box>

      {/* About Section */}
      <Container
        maxWidth='lg'
        sx={{ py: { xs: 6, md: 10 } }}
        id='about'
        ref={ref => addSectionRef('about', ref)}
      >
        {visibleSections.has('about') && (
          <Grid container spacing={6} alignItems='center'>
            <Grid item xs={12} md={6}>
              <Slide direction='right' in timeout={800}>
                <Box>
                  <Typography
                    variant='h3'
                    component='h2'
                    sx={{
                      fontWeight: 'bold',
                      mb: 4,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                  >
                    {t('landing.about.title')}
                  </Typography>
                  <Typography
                    variant='h6'
                    color='textSecondary'
                    sx={{ mb: 4, lineHeight: 1.6 }}
                  >
                    {t('landing.about.subtitle')}
                  </Typography>
                  <Typography
                    variant='body1'
                    color='textSecondary'
                    sx={{ mb: 4, lineHeight: 1.6 }}
                  >
                    {t('landing.about.description')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant='contained'
                      onClick={handleGetStarted}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      {t('landing.about.getStarted')}
                    </Button>
                    <Button variant='outlined' sx={{ px: 3, py: 1.5 }}>
                      {t('landing.about.learnMore')}
                    </Button>
                  </Box>
                </Box>
              </Slide>
            </Grid>
            <Grid item xs={12} md={6}>
              <Slide direction='left' in timeout={1000}>
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
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: theme.shadows[8],
                    }}
                  >
                    <Business
                      sx={{ fontSize: { xs: 120, md: 160 }, color: 'white' }}
                    />
                  </Box>
                </Box>
              </Slide>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Security Section */}
      <Box
        sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 10 } }}
        id='security'
        ref={ref => addSectionRef('security', ref)}
      >
        {visibleSections.has('security') && (
          <Container maxWidth='lg'>
            <Fade in timeout={800}>
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
                  {t('landing.security.title')}
                </Typography>
                <Typography
                  variant='h6'
                  color='textSecondary'
                  sx={{ maxWidth: 600, mx: 'auto' }}
                >
                  {t('landing.security.subtitle')}
                </Typography>
              </Box>
            </Fade>

            <Grid container spacing={4}>
              {[
                {
                  icon: (
                    <Security sx={{ fontSize: 40, color: 'success.main' }} />
                  ),
                  title: t('landing.security.encryption.title'),
                  description: t('landing.security.encryption.description'),
                },
                {
                  icon: (
                    <CheckCircle sx={{ fontSize: 40, color: 'primary.main' }} />
                  ),
                  title: t('landing.security.compliance.title'),
                  description: t('landing.security.compliance.description'),
                },
                {
                  icon: (
                    <Business sx={{ fontSize: 40, color: 'warning.main' }} />
                  ),
                  title: t('landing.security.access.title'),
                  description: t('landing.security.access.description'),
                },
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Grow in timeout={800 + index * 200}>
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
                        <Box sx={{ mb: 3 }}>{item.icon}</Box>
                        <Typography
                          variant='h6'
                          component='h3'
                          sx={{ fontWeight: 'bold', mb: 2 }}
                        >
                          {item.title}
                        </Typography>
                        <Typography variant='body2' color='textSecondary'>
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Container>
        )}
      </Box>

      {/* Blog Section */}
      <Container
        maxWidth='lg'
        sx={{ py: { xs: 6, md: 10 } }}
        id='blog'
        ref={ref => addSectionRef('blog', ref)}
      >
        {visibleSections.has('blog') && (
          <>
            <Fade in timeout={800}>
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
                  {t('landing.blog.title')}
                </Typography>
                <Typography
                  variant='h6'
                  color='textSecondary'
                  sx={{ maxWidth: 600, mx: 'auto' }}
                >
                  {t('landing.blog.subtitle')}
                </Typography>
              </Box>
            </Fade>

            <Grid container spacing={4}>
              {[
                {
                  title: t('landing.blog.article1.title'),
                  excerpt: t('landing.blog.article1.excerpt'),
                  date: t('landing.blog.article1.date'),
                  category: t('landing.blog.article1.category'),
                },
                {
                  title: t('landing.blog.article2.title'),
                  excerpt: t('landing.blog.article2.excerpt'),
                  date: t('landing.blog.article2.date'),
                  category: t('landing.blog.article2.category'),
                },
                {
                  title: t('landing.blog.article3.title'),
                  excerpt: t('landing.blog.article3.excerpt'),
                  date: t('landing.blog.article3.date'),
                  category: t('landing.blog.article3.category'),
                },
              ].map((article, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Grow in timeout={800 + index * 200}>
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
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={article.category}
                            size='small'
                            color='primary'
                            sx={{ mb: 2 }}
                          />
                          <Typography
                            variant='caption'
                            color='textSecondary'
                            sx={{ display: 'block', mb: 1 }}
                          >
                            {article.date}
                          </Typography>
                        </Box>
                        <Typography
                          variant='h6'
                          component='h3'
                          sx={{ fontWeight: 'bold', mb: 2, lineHeight: 1.3 }}
                        >
                          {article.title}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          sx={{ mb: 3 }}
                        >
                          {article.excerpt}
                        </Typography>
                        <Button
                          variant='outlined'
                          size='small'
                          sx={{ borderRadius: 2 }}
                        >
                          {t('landing.blog.readMore')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {/* Help Section */}
      <Box
        sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 10 } }}
        id='help'
        ref={ref => addSectionRef('help', ref)}
      >
        {visibleSections.has('help') && (
          <Container maxWidth='lg'>
            <Fade in timeout={800}>
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
                  {t('landing.help.title')}
                </Typography>
                <Typography
                  variant='h6'
                  color='textSecondary'
                  sx={{ maxWidth: 600, mx: 'auto' }}
                >
                  {t('landing.help.subtitle')}
                </Typography>
              </Box>
            </Fade>

            <Grid container spacing={4}>
              {[
                {
                  icon: (
                    <Description sx={{ fontSize: 40, color: 'primary.main' }} />
                  ),
                  title: t('landing.help.documentation.title'),
                  description: t('landing.help.documentation.description'),
                },
                {
                  icon: (
                    <Email sx={{ fontSize: 40, color: 'secondary.main' }} />
                  ),
                  title: t('landing.help.support.title'),
                  description: t('landing.help.support.description'),
                },
                {
                  icon: (
                    <Schedule sx={{ fontSize: 40, color: 'success.main' }} />
                  ),
                  title: t('landing.help.training.title'),
                  description: t('landing.help.training.description'),
                },
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Grow in timeout={800 + index * 200}>
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
                        <Box sx={{ mb: 3 }}>{item.icon}</Box>
                        <Typography
                          variant='h6'
                          component='h3'
                          sx={{ fontWeight: 'bold', mb: 2 }}
                        >
                          {item.title}
                        </Typography>
                        <Typography variant='body2' color='textSecondary'>
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Container>
        )}
      </Box>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 10 } }}>
        <Container maxWidth='lg'>
          <Grid container spacing={6} alignItems='center'>
            <Grid item xs={12} md={6}>
              <Slide direction='right' in timeout={800}>
                <Box>
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
                </Box>
              </Slide>
            </Grid>
            <Grid item xs={12} md={6}>
              <Slide direction='left' in timeout={1000}>
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
              </Slide>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Customer Reviews Section */}
      <Container maxWidth='lg' sx={{ py: { xs: 6, md: 10 } }}>
        <Fade in timeout={800}>
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
              {t('landing.reviews.title')}
            </Typography>
            <Typography
              variant='h6'
              color='textSecondary'
              sx={{ maxWidth: 600, mx: 'auto' }}
            >
              {t('landing.reviews.subtitle')}
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {reviews.map((review, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Grow in timeout={800 + index * 200}>
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
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ mb: 3 }}>
                      <Rating value={review.rating} readOnly size='large' />
                    </Box>
                    <Typography
                      variant='body1'
                      sx={{ mb: 3, fontStyle: 'italic', lineHeight: 1.6 }}
                    >
                      &ldquo;{review.comment}&rdquo;
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          mr: 2,
                          bgcolor: theme.palette.primary.main,
                        }}
                      >
                        {review.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography
                          variant='subtitle1'
                          sx={{ fontWeight: 'bold' }}
                        >
                          {review.name}
                        </Typography>
                        <Typography variant='body2' color='textSecondary'>
                          {review.role}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='primary.main'
                          sx={{ fontWeight: 500 }}
                        >
                          {review.company}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 10 } }}>
        <Container maxWidth='lg'>
          <Fade in timeout={800}>
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
                {t('landing.contact.title')}
              </Typography>
              <Typography
                variant='h6'
                color='textSecondary'
                sx={{ maxWidth: 600, mx: 'auto' }}
              >
                {t('landing.contact.subtitle')}
              </Typography>
            </Box>
          </Fade>

          <Grid container spacing={6}>
            <Grid item xs={12} lg={7}>
              <Slide direction='right' in timeout={1000}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant='h5'
                      component='h3'
                      sx={{ fontWeight: 'bold', mb: 3 }}
                    >
                      {t('landing.contact.form.title')}
                    </Typography>
                    <form onSubmit={handleContactSubmit}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('landing.contact.form.name')}
                            value={contactForm.name}
                            onChange={handleInputChange('name')}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('landing.contact.form.email')}
                            type='email'
                            value={contactForm.email}
                            onChange={handleInputChange('email')}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={t('landing.contact.form.company')}
                            value={contactForm.company}
                            onChange={handleInputChange('company')}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={t('landing.contact.form.message')}
                            multiline
                            rows={4}
                            value={contactForm.message}
                            onChange={handleInputChange('message')}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            type='submit'
                            variant='contained'
                            size='large'
                            disabled={sending}
                            startIcon={sending ? null : <Send />}
                            sx={{ px: 4, py: 1.5 }}
                          >
                            {sending
                              ? t('landing.contact.form.sending')
                              : t('landing.contact.form.submit')}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Slide direction='left' in timeout={1200}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant='h5'
                      component='h3'
                      sx={{ fontWeight: 'bold', mb: 3 }}
                    >
                      {t('landing.contact.info.title')}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ color: 'primary.main', mr: 2 }} />
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {t('landing.contact.info.emailLabel')}
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            {t('landing.contact.info.email')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone sx={{ color: 'primary.main', mr: 2 }} />
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {t('landing.contact.info.phoneLabel')}
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            {t('landing.contact.info.phone')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ color: 'primary.main', mr: 2 }} />
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {t('landing.contact.info.addressLabel')}
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            {t('landing.contact.info.address')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ color: 'primary.main', mr: 2 }} />
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {t('landing.contact.info.businessHoursLabel')}
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            {t('landing.contact.info.hours')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container
        maxWidth='md'
        sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}
      >
        <Fade in timeout={800}>
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
        </Fade>
        <Fade in timeout={1000}>
          <Typography
            variant='h6'
            color='textSecondary'
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            {t('landing.cta.subtitle')}
          </Typography>
        </Fade>
        <Fade in timeout={1200}>
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
        </Fade>
      </Container>

      {/* Footer */}
      <LandingFooter />

      <LoginModal
        open={loginModalOpen}
        onClose={handleCloseLoginModal}
        onSuccess={handleLoginSuccess}
      />

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

      <ScrollButtons />
    </Box>
  );
};

export default LandingPage;
