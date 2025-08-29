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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Cookie,
  CheckCircle,
  Analytics,
  Settings,
  Info,
} from '@mui/icons-material';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import ScrollButtons from '../components/ScrollButtons';

const CookiePolicy = () => {
  const theme = useTheme();

  const cookieTypes = [
    {
      name: 'Essential Cookies',
      purpose: 'Required for basic site functionality',
      duration: 'Session',
      examples: ['Authentication', 'Security', 'Session management'],
    },
    {
      name: 'Analytics Cookies',
      purpose: 'Help us understand how visitors use our site',
      duration: '2 years',
      examples: ['Page views', 'User behavior', 'Performance metrics'],
    },
    {
      name: 'Functional Cookies',
      purpose: 'Enable enhanced functionality and personalization',
      duration: '1 year',
      examples: ['Language preferences', 'User settings', 'Feature toggles'],
    },
    {
      name: 'Marketing Cookies',
      purpose: 'Used to deliver relevant advertisements',
      duration: '90 days',
      examples: ['Ad targeting', 'Campaign tracking', 'Conversion measurement'],
    },
  ];

  const sections = [
    {
      title: 'What Are Cookies?',
      icon: <Cookie />,
      content: [
        'Small text files stored on your device when you visit our website',
        'Help us provide a better user experience and improve our services',
        'Can be session-based (temporary) or persistent (longer-term)',
        'Do not contain personal information but may track your preferences',
        'Essential for modern web applications to function properly',
      ],
    },
    {
      title: 'How We Use Cookies',
      icon: <Analytics />,
      content: [
        'Ensure our website functions correctly and securely',
        'Remember your preferences and settings across sessions',
        'Analyze website traffic and user behavior patterns',
        'Provide personalized content and recommendations',
        'Improve our services based on usage analytics',
      ],
    },
    {
      title: 'Cookie Management',
      icon: <Settings />,
      content: [
        'You can control cookies through your browser settings',
        'Most browsers allow you to block or delete cookies',
        'Some features may not work if cookies are disabled',
        'You can opt-out of non-essential cookies',
        'We respect Do Not Track browser signals',
      ],
    },
    {
      title: 'Third-Party Cookies',
      icon: <Info />,
      content: [
        'We use trusted third-party services for analytics and functionality',
        'Google Analytics for website performance insights',
        'Stripe for secure payment processing',
        'OpenAI for AI-powered features',
        'All third-party cookies comply with our privacy standards',
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
                Cookie Policy
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
                Learn how we use cookies to enhance your experience on our
                AI-powered Insurance Assistant System and how you can manage
                them.
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
              Understanding Our Cookie Usage
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
              This Cookie Policy explains how AI-powered Insurance Assistant
              System uses cookies and similar technologies to provide,
              customize, evaluate, improve, promote, and protect our services.
            </Typography>

            <Divider sx={{ mb: 6 }} />

            {/* Cookie Types Table */}
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
                Types of Cookies We Use
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Cookie Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Purpose</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Duration
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Examples
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cookieTypes.map((cookie, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {cookie.name}
                        </TableCell>
                        <TableCell>{cookie.purpose}</TableCell>
                        <TableCell>{cookie.duration}</TableCell>
                        <TableCell>
                          <List dense>
                            {cookie.examples.map((example, exIndex) => (
                              <ListItem key={exIndex} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                  <CheckCircle
                                    sx={{
                                      color: theme.palette.success.main,
                                      fontSize: 16,
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText primary={example} />
                              </ListItem>
                            ))}
                          </List>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                If you have questions about our cookie usage or would like to
                manage your cookie preferences, please contact us:
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

export default CookiePolicy;
