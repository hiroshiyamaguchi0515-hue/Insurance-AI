import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  Fade,
  Slide,
} from '@mui/material';
import {
  Gavel,
  CheckCircle,
  Warning,
  Security,
  Business,
  Description,
} from '@mui/icons-material';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import ScrollButtons from '../components/ScrollButtons';

const TermsOfService = () => {
  const theme = useTheme();

  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: <CheckCircle />,
      content: [
        'By accessing and using our services, you agree to be bound by these terms',
        'These terms apply to all users, including administrators and customers',
        'Continued use of the service constitutes acceptance of any modifications',
        'You must be at least 18 years old to use our services',
        'Corporate users must have authority to bind their organization',
      ],
    },
    {
      title: 'Service Description',
      icon: <Description />,
      content: [
        'AI-powered insurance document analysis and processing',
        'Intelligent chatbot assistance for insurance inquiries',
        'Document storage and vector database management',
        'Analytics and reporting capabilities',
        'API access for integration with existing systems',
      ],
    },
    {
      title: 'User Responsibilities',
      icon: <Business />,
      content: [
        'Provide accurate and complete information during registration',
        'Maintain the security of your account credentials',
        'Comply with all applicable laws and regulations',
        'Use the service only for lawful insurance-related purposes',
        'Report any security vulnerabilities or suspicious activity',
      ],
    },
    {
      title: 'Prohibited Activities',
      icon: <Warning />,
      content: [
        'Attempting to gain unauthorized access to the system',
        'Uploading malicious files or content',
        'Interfering with service availability or performance',
        'Reverse engineering or attempting to copy our technology',
        'Using the service for any illegal or fraudulent activities',
      ],
    },
    {
      title: 'Data and Privacy',
      icon: <Security />,
      content: [
        'We process data in accordance with our Privacy Policy',
        'You retain ownership of your uploaded documents',
        'We implement industry-standard security measures',
        'Data is processed in compliance with HIPAA regulations',
        'You are responsible for obtaining necessary consents',
      ],
    },
    {
      title: 'Intellectual Property',
      icon: <Gavel />,
      content: [
        'Our platform and technology remain our exclusive property',
        'You retain rights to your uploaded content and data',
        'AI-generated responses are provided for informational purposes',
        'No transfer of intellectual property rights occurs',
        'Custom integrations may be subject to separate agreements',
      ],
    },
  ];

  return (
    <Box>
      <LandingHeader />

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          pt: { xs: 12, md: 16 },
          pb: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth='lg'>
          <Fade in timeout={800}>
            <Box>
              <Typography
                variant='h2'
                component='h1'
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
                Terms of Service
              </Typography>
              <Typography
                variant='h5'
                sx={{
                  opacity: 0.9,
                  maxWidth: 800,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Please read these terms carefully before using our AI-powered
                Insurance Assistant System. These terms govern your use of our
                services.
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Content Section */}
      <Container maxWidth='lg' sx={{ py: { xs: 6, md: 10 } }}>
        <Slide direction='up' in timeout={1000}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography
              variant='h4'
              component='h2'
              sx={{
                fontWeight: 'bold',
                mb: 4,
                color: theme.palette.primary.main,
                textAlign: 'center',
              }}
            >
              Legal Agreement
            </Typography>

            <Typography
              variant='body1'
              sx={{
                mb: 6,
                lineHeight: 1.8,
                fontSize: '1.1rem',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              These Terms of Service constitute a legally binding agreement
              between you and AI-powered Insurance Assistant System. By using
              our services, you acknowledge that you have read, understood, and
              agree to be bound by these terms.
            </Typography>

            <Divider sx={{ mb: 6 }} />

            <Fade in timeout={800}>
              <Box>
                {sections.map((section, index) => (
                  <Box sx={{ mb: 6 }} key={index}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {section.icon}
                      </Box>
                      <Typography
                        variant='h5'
                        component='h3'
                        sx={{
                          fontWeight: 'bold',
                          color: theme.palette.primary.main,
                        }}
                      >
                        {section.title}
                      </Typography>
                    </Box>

                    <List>
                      {section.content.map((item, itemIndex) => (
                        <ListItem key={itemIndex} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircle
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: 20,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: '1rem',
                                lineHeight: 1.6,
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </Box>
            </Fade>

            <Divider sx={{ my: 6 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant='h5'
                component='h3'
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  color: theme.palette.primary.main,
                }}
              >
                Contact Information
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                }}
              >
                If you have any questions about these Terms of Service, please
                contact us:
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                }}
              >
                Email: legal@insuranceassistant.com
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                }}
              >
                Phone: +1 (555) 123-4567
              </Typography>
            </Box>

            <Box sx={{ mt: 6, textAlign: 'center' }}>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontStyle: 'italic' }}
              >
                Last updated: August 15, 2024
              </Typography>
            </Box>
          </Paper>
        </Slide>
      </Container>

      <LandingFooter />
      <ScrollButtons />
    </Box>
  );
};

export default TermsOfService;
