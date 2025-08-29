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
  Security,
  Shield,
  Lock,
  Visibility,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import ScrollButtons from '../components/ScrollButtons';

const PrivacyPolicy = () => {
  const theme = useTheme();

  const sections = [
    {
      title: 'Information We Collect',
      icon: <Visibility />,
      content: [
        'Personal information (name, email, company)',
        'Usage data and analytics',
        'Document uploads and processing data',
        'AI interaction logs and responses',
        'System performance metrics',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: <CheckCircle />,
      content: [
        'Provide AI-powered insurance assistance',
        'Improve our services and algorithms',
        'Process insurance documents and claims',
        'Generate insights and analytics',
        'Ensure system security and compliance',
      ],
    },
    {
      title: 'Data Security Measures',
      icon: <Security />,
      content: [
        'AES-256 encryption for data in transit and at rest',
        'HIPAA-compliant data handling procedures',
        'Role-based access control and authentication',
        'Regular security audits and penetration testing',
        'Secure data centers with physical security',
      ],
    },
    {
      title: 'Data Sharing and Disclosure',
      icon: <Shield />,
      content: [
        'We do not sell your personal information',
        'Limited sharing with authorized service providers',
        'Compliance with legal requirements',
        'Business transfers and acquisitions',
        'Protection of rights and safety',
      ],
    },
    {
      title: 'Your Rights and Choices',
      icon: <Lock />,
      content: [
        'Access and review your personal data',
        'Request correction of inaccurate information',
        'Delete your account and associated data',
        'Opt-out of certain data processing',
        'Data portability and export',
      ],
    },
    {
      title: 'Data Retention',
      icon: <Warning />,
      content: [
        'Active account data retained while account is active',
        'Document processing data retained for 7 years',
        'AI interaction logs retained for 2 years',
        'Analytics data retained for 3 years',
        'Right to request earlier deletion',
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
                Privacy Policy
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
                Your privacy and data security are our top priorities. Learn how
                we protect your information and maintain the highest standards
                of confidentiality.
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
              Our Commitment to Privacy
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
              At AI-powered Insurance Assistant System, we are committed to
              protecting your privacy and ensuring the security of your personal
              and business information. This Privacy Policy explains how we
              collect, use, protect, and share your information when you use our
              services.
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
                Contact Us
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                }}
              >
                If you have any questions about this Privacy Policy or our data
                practices, please contact us:
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                }}
              >
                Email: privacy@insuranceassistant.com
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

export default PrivacyPolicy;
