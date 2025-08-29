import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Business,
  Email,
  Phone,
  LocationOn,
  LinkedIn,
  Twitter,
  Facebook,
  GitHub,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const LandingFooter = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

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

  const navigateToPage = path => {
    navigate(path);
  };

  const footerSections = [
    {
      title: t('landing.footer.product'),
      items: [
        {
          text: t('landing.footer.features'),
          sectionId: 'features',
          action: 'scroll',
        },
        {
          text: t('landing.footer.pricing'),
          sectionId: 'pricing',
          action: 'scroll',
        },
        {
          text: t('landing.footer.security'),
          sectionId: 'security',
          action: 'scroll',
        },
        { text: t('landing.footer.api'), sectionId: 'api', action: 'scroll' },
      ],
    },
    {
      title: t('landing.footer.company'),
      items: [
        {
          text: t('landing.footer.about'),
          sectionId: 'about',
          action: 'scroll',
        },
        {
          text: t('landing.footer.careers'),
          sectionId: 'careers',
          action: 'scroll',
        },
        {
          text: t('landing.footer.contact'),
          sectionId: 'contact',
          action: 'scroll',
        },
        { text: t('landing.footer.blog'), sectionId: 'blog', action: 'scroll' },
      ],
    },
    {
      title: t('landing.footer.support'),
      items: [
        {
          text: t('landing.footer.helpCenter'),
          sectionId: 'help',
          action: 'scroll',
        },
        {
          text: t('landing.footer.documentation'),
          sectionId: 'docs',
          action: 'scroll',
        },
        {
          text: t('landing.footer.status'),
          sectionId: 'status',
          action: 'scroll',
        },
        {
          text: t('landing.footer.contactSupport'),
          sectionId: 'support',
          action: 'scroll',
        },
      ],
    },
    {
      title: t('landing.footer.legal'),
      items: [
        {
          text: t('landing.footer.privacyPolicy'),
          path: '/privacy-policy',
          action: 'navigate',
        },
        {
          text: t('landing.footer.termsOfService'),
          path: '/terms-of-service',
          action: 'navigate',
        },
        {
          text: t('landing.footer.cookiePolicy'),
          path: '/cookie-policy',
          action: 'navigate',
        },
        { text: t('landing.footer.gdpr'), path: '/gdpr', action: 'navigate' },
      ],
    },
  ];

  const socialLinks = [
    { icon: <LinkedIn />, href: '#', label: 'LinkedIn' },
    { icon: <Twitter />, href: '#', label: 'Twitter' },
    { icon: <Facebook />, href: '#', label: 'Facebook' },
    { icon: <GitHub />, href: '#', label: 'GitHub' },
  ];

  const contactInfo = [
    { icon: <Email />, text: 'hello@insuranceassistant.com' },
    { icon: <Phone />, text: '+1 (555) 123-4567' },
    { icon: <LocationOn />, text: '123 AI Street, Tech City, TC 12345' },
  ];

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
        },
      }}
    >
      <Container maxWidth='lg' sx={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Content */}
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* Company Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <Business sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant='h5'
                    sx={{
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Insurance AI
                  </Typography>
                </Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: 'grey.300',
                    mb: 3,
                    lineHeight: 1.6,
                  }}
                >
                  {t('landing.footer.description')}
                </Typography>

                {/* Contact Info */}
                <Box sx={{ mb: 3 }}>
                  {contactInfo.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'grey.300',
                          '&:hover': {
                            color: 'white',
                            transition: 'color 0.2s ease-in-out',
                          },
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Social Links */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {socialLinks.map((social, index) => (
                    <IconButton
                      key={index}
                      sx={{
                        color: 'grey.400',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        p: 1,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: theme.palette.primary.main,
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        },
                      }}
                      href={social.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={social.label}
                    >
                      {social.icon}
                    </IconButton>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <Grid item xs={12} sm={6} md={2} key={index}>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: 'white',
                  }}
                >
                  {section.title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      onClick={() => {
                        if (item.action === 'scroll') {
                          scrollToSection(item.sectionId);
                        } else if (item.action === 'navigate') {
                          navigateToPage(item.path);
                        }
                      }}
                      sx={{
                        color: 'grey.300',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: theme.palette.primary.main,
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      {item.text}
                    </Link>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Bottom Section */}
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <Box
          sx={{
            py: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'center' },
            gap: 2,
          }}
        >
          <Typography
            variant='body2'
            sx={{
              color: 'grey.400',
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            {t('landing.footer.copyright')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Typography
              variant='body2'
              sx={{
                color: 'grey.400',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                component='span'
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: theme.palette.success.main,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
                    },
                    '70%': {
                      boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
                    },
                    '100%': {
                      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
                    },
                  },
                }}
              />
              {t('landing.footer.systemStatus')}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingFooter;
