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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Description,
  SmartToy,
  QuestionAnswer,
  Chat,
  CheckCircle,
  Speed,
  Security,
  Analytics,
  Visibility,
  Download,
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
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ['customerDocuments'],
    queryFn: () => api.get(endpoints.customerDocuments).then(res => res.data),
    retry: 1,
    retryDelay: 1000,
  });

  const {
    data: qaLogs,
    isLoading: qaLogsLoading,
    error: qaLogsError,
  } = useQuery({
    queryKey: ['customerQALogs'],
    queryFn: () => api.get(endpoints.customerQALogs).then(res => res.data),
    retry: 1,
    retryDelay: 1000,
  });

  const {
    data: chatHistory,
    isLoading: chatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ['customerChatHistory'],
    queryFn: () => api.get(endpoints.customerChatHistory).then(res => res.data),
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle loading state
  if (documentsLoading || qaLogsLoading || chatLoading) {
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
          Loading your insurance dashboard...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (documentsError || qaLogsError || chatError) {
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
            Connection Error
          </Typography>
          <Typography variant='body1' color='textSecondary' sx={{ mb: 3 }}>
            Unable to connect to the backend server. Please check if the server
            is running.
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            This is normal if you&apos;re running the frontend without the
            backend server.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Safe data extraction with fallbacks
  const documentsData = documents || [];
  const qaLogsData = qaLogs || [];
  const chatHistoryData = chatHistory || [];

  const statsCards = [
    {
      title: t('customerDashboard.totalDocuments'),
      value: documentsData.length,
      icon: <Description sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      trend: '+5%',
      trendDirection: 'up',
      delay: 0,
    },
    {
      title: t('customerDashboard.totalQuestions'),
      value: qaLogsData.length,
      icon: <QuestionAnswer sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      trend: '+12%',
      trendDirection: 'up',
      delay: 100,
    },
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

  const recentDocuments = documentsData.slice(0, 5);
  const recentQuestions = qaLogsData.slice(0, 5);

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
          <Grid item xs={12} sm={6} md={3} key={index}>
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

      {/* Recent Documents & Questions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Documents */}
        <Grid item xs={12} lg={6}>
          <Slide direction='up' in={animateCards} timeout={1000}>
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
                  <Description
                    sx={{ fontSize: 32, color: 'primary.main', mr: 2 }}
                  />
                  <Typography
                    variant='h5'
                    component='h2'
                    sx={{ fontWeight: 700 }}
                  >
                    {t('customerDashboard.recentDocuments')}
                  </Typography>
                </Box>
                {recentDocuments.length > 0 ? (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {recentDocuments.map((doc, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          background: theme.palette.background.default,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            background: theme.palette.action.hover,
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 2,
                              bgcolor: theme.palette.primary.main,
                            }}
                          >
                            <Description />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant='subtitle2'
                              sx={{ fontWeight: 600 }}
                            >
                              {doc.filename || `Document ${index + 1}`}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              {doc.upload_date || 'Recently uploaded'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title='View'>
                              <IconButton size='small' color='primary'>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Download'>
                              <IconButton size='small' color='secondary'>
                                <Download />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Description
                      sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography variant='body1' color='textSecondary'>
                      {t('customerDashboard.noDocuments')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        {/* Recent Questions */}
        <Grid item xs={12} lg={6}>
          <Slide direction='up' in={animateCards} timeout={1200}>
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
                  <QuestionAnswer
                    sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }}
                  />
                  <Typography
                    variant='h5'
                    component='h2'
                    sx={{ fontWeight: 700 }}
                  >
                    {t('customerDashboard.recentQuestions')}
                  </Typography>
                </Box>
                {recentQuestions.length > 0 ? (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {recentQuestions.map((qa, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          background: theme.palette.background.default,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            background: theme.palette.action.hover,
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 2,
                              bgcolor: theme.palette.secondary.main,
                            }}
                          >
                            <QuestionAnswer />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant='subtitle2'
                              sx={{ fontWeight: 600 }}
                            >
                              {qa.question?.substring(0, 50) ||
                                `Question ${index + 1}`}
                              ...
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              {qa.timestamp || 'Recently asked'}
                            </Typography>
                          </Box>
                          <Chip
                            label={qa.status || 'Answered'}
                            color={
                              qa.status === 'Answered' ? 'success' : 'warning'
                            }
                            size='small'
                            variant='outlined'
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <QuestionAnswer
                      sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography variant='body1' color='textSecondary'>
                      {t('customerDashboard.noQuestions')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      {/* Quick Actions & Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Slide direction='up' in={animateCards} timeout={1400}>
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
                <Typography
                  variant='h6'
                  component='h3'
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  {t('customerDashboard.quickActions')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    {
                      icon: <Description />,
                      label: t('customerDashboard.uploadDocument'),
                      color: 'primary',
                    },
                    {
                      icon: <QuestionAnswer />,
                      label: t('customerDashboard.askQuestion'),
                      color: 'secondary',
                    },
                    {
                      icon: <Chat />,
                      label: t('customerDashboard.startChat'),
                      color: 'info',
                    },
                    {
                      icon: <SmartToy />,
                      label: t('customerDashboard.aiAssistant'),
                      color: 'warning',
                    },
                  ].map((action, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.default,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          background: theme.palette.action.hover,
                          borderColor: theme.palette[action.color].main,
                          transform: 'translateX(8px)',
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 2,
                          bgcolor: theme.palette[action.color].main,
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Typography variant='body2' sx={{ fontWeight: 500 }}>
                        {action.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} lg={8}>
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
                      label: 'AI Response Time',
                      value: '<2s',
                      icon: <Speed />,
                      color: 'success',
                      progress: 95,
                    },
                    {
                      label: 'Document Processing',
                      value: '99%',
                      icon: <Description />,
                      color: 'info',
                      progress: 99,
                    },
                    {
                      label: 'Question Accuracy',
                      value: '98%',
                      icon: <CheckCircle />,
                      color: 'primary',
                      progress: 98,
                    },
                    {
                      label: 'System Uptime',
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
