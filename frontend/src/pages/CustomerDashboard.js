import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Description,
  SmartToy,
  Chat,
  CheckCircle,
  Speed,
  Security,
  Analytics,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api, endpoints } from '../services/api';

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [animateCards, setAnimateCards] = useState(false);

  // Fetch data with error handling

  const {
    data: chatHistory,
    isLoading: chatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ['customerChatHistory'],
    queryFn: () => api.get(endpoints.chatConversations).then(res => res.data),
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle loading state
  if (chatLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <Box sx={{ position: 'relative', mb: 3 }}>
          <CircularProgress size={80} thickness={4} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <SmartToy sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
        </Box>
        <Typography variant='h5' color='textSecondary' sx={{ mb: 1 }}>
          {t('common.loading')}
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          {t('customerDashboard.loadingDashboard')}
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (chatError) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <SmartToy sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant='h5' color='error.main' sx={{ mb: 2 }}>
            {t('customerDashboard.connectionError')}
          </Typography>
          <Typography variant='body1' color='textSecondary' sx={{ mb: 3 }}>
            {t('customerDashboard.connectionErrorDescription')}
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {t('customerDashboard.connectionErrorNote')}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Safe data extraction with fallbacks
  const chatHistoryData = chatHistory || [];

  const statsCards = [
    {
      title: t('customerDashboard.totalChats'),
      value: chatHistoryData.length,
      icon: <Chat sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      trend: '+8%',
      trendDirection: 'up',
      delay: 200,
    },
    {
      title: t('customerDashboard.aiAssistance'),
      value: '24/7',
      icon: <SmartToy sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning',
      trend: 'Active',
      trendDirection: 'up',
      delay: 300,
    },
  ];

  return (
    <Box sx={{ p: 0 }}>
      {/* Header Section */}
      <Fade in={animateCards} timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h3'
            component='h1'
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            {t('customerDashboard.welcome')}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('customerDashboard.subtitle')}
          </Typography>
          <Divider sx={{ opacity: 0.3 }} />
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
            <Grow in={animateCards} timeout={800 + card.delay}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    borderColor:
                      theme.palette[card.color]?.main ||
                      theme.palette.primary.main,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    <Zoom in={animateCards} timeout={1000 + card.delay}>
                      {card.icon}
                    </Zoom>
                  </Box>
                  <Typography
                    variant='h3'
                    component='div'
                    sx={{
                      fontWeight: 700,
                      color: theme.palette[card.color].main,
                      mb: 1,
                    }}
                  >
                    {card.value}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='textSecondary'
                    sx={{ mb: 2, fontWeight: 500 }}
                  >
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Chip
                      icon={
                        card.trendDirection === 'up' ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )
                      }
                      label={card.trend}
                      size='small'
                      color={card.trendDirection === 'up' ? 'success' : 'error'}
                      variant='outlined'
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions & Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Performance Metrics */}
        <Grid item xs={12} lg={12}>
          <Slide direction='up' in={animateCards} timeout={1600}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Analytics
                    sx={{ fontSize: 32, color: 'primary.main', mr: 2 }}
                  />
                  <Typography
                    variant='h5'
                    component='h2'
                    sx={{ fontWeight: 700 }}
                  >
                    {t('customerDashboard.performanceMetrics')}
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {[
                    {
                      label: t('customerDashboard.aiResponseTime'),
                      value: '<2s',
                      icon: <Speed />,
                      color: 'success',
                      progress: 95,
                    },
                    {
                      label: t('customerDashboard.documentProcessing'),
                      value: '99%',
                      icon: <Description />,
                      color: 'info',
                      progress: 99,
                    },
                    {
                      label: t('customerDashboard.questionAccuracy'),
                      value: '98%',
                      icon: <CheckCircle />,
                      color: 'primary',
                      progress: 98,
                    },
                    {
                      label: t('customerDashboard.systemUptime'),
                      value: '99.9%',
                      icon: <Security />,
                      color: 'warning',
                      progress: 99.9,
                    },
                  ].map((metric, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          background: theme.palette.background.default,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            background: theme.palette.action.hover,
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: theme.palette[metric.color].main,
                          }}
                        >
                          {metric.icon}
                        </Avatar>
                        <Typography
                          variant='h6'
                          component='div'
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          {metric.value}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          sx={{ mb: 2 }}
                        >
                          {metric.label}
                        </Typography>
                        <LinearProgress
                          variant='determinate'
                          value={metric.progress}
                          color={metric.color}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDashboard;
