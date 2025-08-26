import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Refresh,
  SmartToy,
  Stop,
  Error,
  Warning,
  Settings,
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  RestartAlt,
  DeleteForever,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';

const AgentManagement = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const theme = useTheme();
  const [animateCards, setAnimateCards] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch agents status
  const {
    data: agentsStatus,
    isLoading,
    refetch,
  } = useQuery(
    'agentsStatus',
    () => api.get(endpoints.agentsStatus).then(res => res.data),
    { refetchInterval: 10000 }
  );

  // Reset agent mutation
  const resetAgentMutation = useMutation(
    companyId => api.post(endpoints.agentReset(companyId)),
    {
      onSuccess: () => {
        const message = t('agent.resetSuccess');
        toast.success(message);
        setSnackbar({ open: true, message, severity: 'success' });
        queryClient.invalidateQueries('agentsStatus');
      },
      onError: error => {
        const message = error.response?.data?.detail || t('agent.resetFailed');
        toast.error(message);
        setSnackbar({ open: true, message, severity: 'error' });
      },
    }
  );

  // Force remove agent mutation
  const forceRemoveMutation = useMutation(
    companyId => api.delete(endpoints.forceRemoveAgent(companyId)),
    {
      onSuccess: () => {
        const message = t('agent.removeSuccess');
        toast.success(message);
        setSnackbar({ open: true, message, severity: 'success' });
        queryClient.invalidateQueries('agentsStatus');
      },
      onError: error => {
        const message = error.response?.data?.detail || t('agent.removeFailed');
        toast.error(message);
        setSnackbar({ open: true, message, severity: 'error' });
      },
    }
  );

  const handleResetAgent = companyId => {
    if (window.confirm(t('agent.resetConfirm'))) {
      resetAgentMutation.mutate(companyId);
    }
  };

  const handleForceRemove = companyId => {
    if (window.confirm(t('agent.removeConfirm'))) {
      forceRemoveMutation.mutate(companyId);
    }
  };

  const getAgentStatusColor = status => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAgentStatusIcon = status => {
    switch (status) {
      case 'active':
        return <PlayArrow />;
      case 'inactive':
        return <Pause />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      default:
        return <Stop />;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <Box sx={{ position: 'relative', mb: 3 }}>
          <LinearProgress size={80} thickness={4} />
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
          Loading AI agents...
        </Typography>
      </Box>
    );
  }

  // Safe data extraction with fallbacks
  const agentsData = agentsStatus?.agents || {};
  const totalStats = {
    total: agentsStatus?.stats?.total_agents || 0,
    max: agentsStatus?.stats?.max_agents || 0,
    active: 0, // Will be calculated if agents is an array
    inactive: 0, // Will be calculated if agents is an array
    error: 0, // Will be calculated if agents is an array
  };

  // If agents is an array, calculate status counts
  if (Array.isArray(agentsData)) {
    totalStats.active = agentsData.filter(
      agent => agent.status === 'active'
    ).length;
    totalStats.inactive = agentsData.filter(
      agent => agent.status === 'inactive'
    ).length;
    totalStats.error = agentsData.filter(
      agent => agent.status === 'error'
    ).length;
  }

  const statsCards = [
    {
      title: t('agent.totalAgents'),
      value: totalStats.total,
      icon: <SmartToy sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      trend: `/${totalStats.max}`,
      trendDirection: 'neutral',
      delay: 0,
    },
    {
      title: t('agent.maxAgents'),
      value: totalStats.max,
      icon: <Settings sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      trend: 'Limit',
      trendDirection: 'neutral',
      delay: 100,
    },
    {
      title: t('agent.activeAgents'),
      value: totalStats.active,
      icon: <PlayArrow sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
      trend: totalStats.active > 0 ? `+${totalStats.active}` : '0',
      trendDirection: totalStats.active > 0 ? 'up' : 'neutral',
      delay: 200,
    },
    {
      title: t('agent.inactiveAgents'),
      value: totalStats.inactive,
      icon: <Pause sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning',
      trend: totalStats.inactive > 0 ? `+${totalStats.inactive}` : '0',
      trendDirection: totalStats.inactive > 0 ? 'up' : 'neutral',
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
            {t('agent.title')}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('agent.subtitle')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Divider sx={{ opacity: 0.3, flexGrow: 1, mr: 2 }} />
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={() => refetch()}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              {t('common.refresh')}
            </Button>
          </Box>
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
                    {card.value.toLocaleString()}
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

      {/* Agents Table */}
      <Slide direction='up' in={animateCards} timeout={1200}>
        <Card
          sx={{
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
              <SmartToy sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {t('agent.agentStatus')}
              </Typography>
            </Box>

            {Array.isArray(agentsData) && agentsData.length > 0 ? (
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('agent.company')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('agent.status')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('agent.model')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('agent.created')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('agent.lastActivity')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('common.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agentsData.map((agent, index) => (
                      <TableRow
                        key={agent.company_id || index}
                        sx={{
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            background: theme.palette.action.hover,
                            transform: 'scale(1.01)',
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 2,
                                bgcolor: theme.palette.primary.main,
                              }}
                            >
                              <SmartToy />
                            </Avatar>
                            <Typography
                              variant='subtitle2'
                              sx={{ fontWeight: 600 }}
                            >
                              {agent.company_name || `Company ${index + 1}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getAgentStatusIcon(agent.status)}
                            label={agent.status || 'unknown'}
                            size='small'
                            color={getAgentStatusColor(agent.status)}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='textSecondary'>
                            {agent.model_name || 'gpt-4'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='textSecondary'>
                            {agent.created_at
                              ? new Date(agent.created_at).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='textSecondary'>
                            {agent.last_activity
                              ? new Date(
                                  agent.last_activity
                                ).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={t('agent.resetAgent')}>
                              <IconButton
                                size='small'
                                color='warning'
                                onClick={() =>
                                  handleResetAgent(agent.company_id)
                                }
                                disabled={resetAgentMutation.isLoading}
                              >
                                <RestartAlt />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('agent.forceRemove')}>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() =>
                                  handleForceRemove(agent.company_id)
                                }
                                disabled={forceRemoveMutation.isLoading}
                              >
                                <DeleteForever />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('common.settings')}>
                              <IconButton size='small' color='info'>
                                <Settings />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SmartToy
                  sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                />
                <Typography
                  variant='body1'
                  color='textSecondary'
                  sx={{ mb: 2 }}
                >
                  {t('agent.noAgents')}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {t('agent.agentsInfo')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Slide>

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
    </Box>
  );
};

export default AgentManagement;
