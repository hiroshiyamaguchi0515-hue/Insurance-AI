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
  Alert,
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Lock,
  Visibility,
  Delete,
  Download,
  Gavel,
} from '@mui/icons-material';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import ScrollButtons from '../components/ScrollButtons';

const GDPR = () => {
  const theme = useTheme();

  const rights = [
    {
      title: 'Right to Access',
      icon: <Visibility />,
      description:
        'You have the right to request access to your personal data and information about how it is processed.',
    },
    {
      title: 'Right to Rectification',
      icon: <CheckCircle />,
      description:
        'You can request correction of inaccurate or incomplete personal data.',
    },
    {
      title: 'Right to Erasure',
      icon: <Delete />,
      description:
        'You have the right to request deletion of your personal data under certain circumstances.',
    },
    {
      title: 'Right to Data Portability',
      icon: <Download />,
      description:
        'You can request a copy of your personal data in a structured, machine-readable format.',
    },
    {
      title: 'Right to Restrict Processing',
      icon: <Lock />,
      description:
        'You can request limitation of how your personal data is processed.',
    },
    {
      title: 'Right to Object',
      icon: <Gavel />,
      description:
        'You have the right to object to processing of your personal data for specific purposes.',
    },
  ];

  const sections = [
    {
      title: 'What is GDPR?',
      icon: <Security />,
      content: [
        'General Data Protection Regulation (GDPR) is a comprehensive data protection law',
        'Applies to all organizations processing personal data of EU residents',
        'Enforces strict rules on data collection, processing, and storage',
        'Gives individuals greater control over their personal information',
        'Requires organizations to implement robust data protection measures',
      ],
    },
    {
      title: 'Our GDPR Compliance',
      icon: <CheckCircle />,
      content: [
        'We are fully committed to GDPR compliance and data protection',
        'All data processing activities are documented and auditable',
        'We implement appropriate technical and organizational measures',
        'Regular staff training on data protection and privacy',
        'Data Protection Impact Assessments conducted for high-risk processing',
      ],
    },
    {
      title: 'Data Processing Legal Basis',
      icon: <Gavel />,
      content: [
        'Contract performance for providing our services',
        'Legitimate interest in improving our services and security',
        'Legal obligations for compliance and record-keeping',
        'Consent for marketing communications and analytics',
        'Vital interests for security and fraud prevention',
      ],
    },
    {
      title: 'Data Security Measures',
      icon: <Lock />,
      content: [
        'AES-256 encryption for data in transit and at rest',
        'Multi-factor authentication and role-based access control',
        'Regular security audits and penetration testing',
        'Secure data centers with physical security measures',
        'Incident response procedures and breach notification protocols',
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
                GDPR Compliance
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
                We are committed to protecting your data rights and ensuring
                full compliance with the General Data Protection Regulation
                (GDPR).
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
            {/* GDPR Notice */}
            <Alert
              severity='info'
              sx={{
                mb: 4,
                fontSize: '1rem',
                '& .MuiAlert-message': {
                  fontSize: '1rem',
                },
              }}
            >
              <Typography variant='body1' sx={{ fontWeight: 'bold', mb: 1 }}>
                Important Notice:
              </Typography>
              <Typography variant='body2'>
                This page outlines our GDPR compliance measures. If you are an
                EU resident and have questions about your data rights, please
                contact our Data Protection Officer.
              </Typography>
            </Alert>

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
              Your Data Rights Under GDPR
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
              The GDPR provides you with several important rights regarding your
              personal data. We are committed to upholding these rights and
              making it easy for you to exercise them.
            </Typography>

            <Divider sx={{ mb: 6 }} />

            {/* Data Rights Grid */}
            <Box sx={{ mb: 6 }}>
              <Typography
                variant='h5'
                component='h3'
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  color: theme.palette.primary.main,
                  textAlign: 'center',
                }}
              >
                Your Rights
              </Typography>
              <Fade in timeout={800}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 3,
                  }}
                >
                  {rights.map((right, index) => (
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.grey[200]}`,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                      key={index}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {right.icon}
                        </Box>
                        <Typography
                          variant='h6'
                          sx={{
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                          }}
                        >
                          {right.title}
                        </Typography>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        {right.description}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Fade>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Detailed Sections */}
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
                Exercise Your Rights
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                }}
              >
                To exercise any of your GDPR rights or for questions about our
                data processing, please contact us:
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                }}
              >
                Data Protection Officer: dpo@insuranceassistant.com
              </Typography>
              <Typography
                variant='body1'
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                }}
              >
                General Inquiries: privacy@insuranceassistant.com
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

export default GDPR;
