import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  HealthAndSafety,
  Refresh,
  SmartToy,
  Storage,
  Memory,
  Api,
  People,
  Business,
  Description,
  QuestionAnswer,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { api, endpoints } from '../services/api';

const SystemHealth = () => {
  // Fetch comprehensive system status
  const {
    data: systemStatus,
    isLoading,
    refetch,
  } = useQuery(
    'systemStatus',
    () => api.get(endpoints.systemStatus).then(res => res.data),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Safety function to ensure we get a string status

  // Safety function to ensure we get a string message

  // Safety function to ensure we never render objects directly
  const safeRender = React.useCallback(value => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object') {
      console.warn('Attempted to render object directly:', value);
      return 'Object';
    }
    return String(value);
  }, []);

  // Ultra-safe render function that handles nested objects
  const ultraSafeRender = React.useCallback(
    value => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'string' || typeof value === 'number') return value;
      if (typeof value === 'object') {
        // If it's an object with status/message, extract the status
        if (value.status !== undefined) {
          return safeRender(value.status);
        }
        // If it's an object with message, extract the message
        if (value.message !== undefined) {
          return safeRender(value.message);
        }
        return 'Complex Object';
      }
      return String(value);
    },
    [safeRender]
  );

  // Final safety wrapper component

  // Comprehensive safety wrapper for all system status data - wrapped in useMemo
  const safeSystemStatus = React.useMemo(
    () => ({
      overall_status: ultraSafeRender(systemStatus?.overall_status),
      timestamp: systemStatus?.timestamp,
      counts: {
        users: ultraSafeRender(systemStatus?.counts?.users),
        companies: ultraSafeRender(systemStatus?.counts?.companies),
        pdf_files: ultraSafeRender(systemStatus?.counts?.pdf_files),
        qa_logs: ultraSafeRender(systemStatus?.counts?.qa_logs),
        agent_logs: ultraSafeRender(systemStatus?.counts?.agent_logs),
      },
      services: {
        database: {
          status: ultraSafeRender(systemStatus?.services?.database),
          message: ultraSafeRender(systemStatus?.services?.database),
        },
        embeddings: {
          status: ultraSafeRender(systemStatus?.services?.embeddings),
          message: ultraSafeRender(systemStatus?.services?.embeddings),
        },
        openai_api: {
          status: ultraSafeRender(systemStatus?.services?.openai_api),
          message: ultraSafeRender(systemStatus?.services?.openai_api),
        },
      },
      system: {
        memory_total: ultraSafeRender(systemStatus?.system?.memory_total),
        memory_available: ultraSafeRender(
          systemStatus?.system?.memory_available
        ),
        cpu_count: ultraSafeRender(systemStatus?.system?.cpu_count),
        disk_usage: ultraSafeRender(systemStatus?.system?.disk_usage),
        python_version: ultraSafeRender(systemStatus?.system?.python_version),
        platform: ultraSafeRender(systemStatus?.system?.platform),
      },
      agents: {
        active_agents: ultraSafeRender(systemStatus?.agents?.active_agents),
        total_memory: ultraSafeRender(systemStatus?.agents?.total_memory),
      },
    }),
    [systemStatus, ultraSafeRender]
  );

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'configured':
        return 'success';
      case 'degraded':
      case 'warning':
        return 'warning';
      case 'unhealthy':
      case 'error':
        return 'error';
      case 'unavailable':
      case 'not_configured':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return <CheckCircle />;
      case 'degraded':
      case 'warning':
        return <Warning />;
      case 'unhealthy':
      case 'error':
        return <Error />;
      case 'unavailable':
      case 'not_configured':
        return <Info />;
      default:
        return <Info />;
    }
  };

  const getOverallStatus = () => {
    if (!safeSystemStatus?.overall_status) return 'unknown';
    return safeSystemStatus.overall_status;
  };

  const overallStatus = getOverallStatus();

  // Debug logging to help identify data structure issues
  React.useEffect(() => {
    if (systemStatus) {
      console.log('System Status Data:', systemStatus);
      console.log('Services:', systemStatus.services);
      console.log('Database Service:', systemStatus.services?.database);

      // Check for any unexpected data types
      Object.entries(systemStatus).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          console.log(`Key: ${key}, Type: ${typeof value}, Value:`, value);
        }
      });

      // Log the safe version
      console.log('Safe System Status:', safeSystemStatus);
    }
  }, [systemStatus, safeSystemStatus]);

  const formatBytes = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatPercentage = value => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}%`;
    }
    return 'N/A';
  };

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={4}
      >
        <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
          System Health
        </Typography>
        <Button
          variant='outlined'
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {/* Overall Status */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display='flex' alignItems='center' mb={2}>
            <HealthAndSafety
              sx={{ fontSize: 32, color: 'primary.main', mr: 2 }}
            />
            <Typography variant='h5' component='h2'>
              Overall System Status
            </Typography>
          </Box>

          <Box display='flex' alignItems='center' mb={2}>
            <Chip
              icon={getStatusIcon(overallStatus)}
              label={safeRender(overallStatus).toUpperCase()}
              color={getStatusColor(overallStatus)}
              size='large'
              sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
            />
          </Box>

          <Typography variant='body2' color='textSecondary'>
            Last updated:{' '}
            {safeSystemStatus?.timestamp
              ? new Date(safeSystemStatus.timestamp).toLocaleString()
              : 'N/A'}
          </Typography>
        </CardContent>
      </Card>

      {/* System Counts */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        System Counts
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant='h6'>Users</Typography>
              </Box>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {safeSystemStatus?.counts?.users || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Business sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant='h6'>Companies</Typography>
              </Box>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {safeSystemStatus?.counts?.companies || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Description sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant='h6'>PDF Files</Typography>
              </Box>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {safeSystemStatus?.counts?.pdf_files || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <QuestionAnswer sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant='h6'>QA Logs</Typography>
              </Box>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {safeSystemStatus?.counts?.qa_logs || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <SmartToy sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant='h6'>Agent Logs</Typography>
              </Box>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {safeSystemStatus?.counts?.agent_logs || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <SmartToy sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant='h6'>Active Agents</Typography>
              </Box>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {safeSystemStatus?.agents?.active_agents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Service Status */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Service Status
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Storage sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant='h6'>Database</Typography>
              </Box>
              <Chip
                icon={getStatusIcon(
                  safeSystemStatus?.services?.database?.status
                )}
                label={safeSystemStatus?.services?.database?.status}
                color={getStatusColor(
                  safeSystemStatus?.services?.database?.status
                )}
                size='small'
              />
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
                {safeSystemStatus?.services?.database?.message ||
                  'Database connection status'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <SmartToy sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant='h6'>AI Embeddings</Typography>
              </Box>
              <Chip
                icon={getStatusIcon(
                  safeSystemStatus?.services?.embeddings?.status
                )}
                label={safeSystemStatus?.services?.embeddings?.status}
                color={getStatusColor(
                  safeSystemStatus?.services?.embeddings?.status
                )}
                size='small'
              />
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
                {safeSystemStatus?.services?.embeddings?.message ||
                  'OpenAI embeddings service'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Api sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant='h6'>OpenAI API</Typography>
              </Box>
              <Chip
                icon={getStatusIcon(
                  safeSystemStatus?.services?.openai_api?.status
                )}
                label={safeSystemStatus?.services?.openai_api?.status}
                color={getStatusColor(
                  safeSystemStatus?.services?.openai_api?.status
                )}
                size='small'
              />
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
                {safeSystemStatus?.services?.openai_api?.message ||
                  'OpenAI API connectivity'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Metrics */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        System Metrics
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    color='textSecondary'
                    gutterBottom
                    variant='body2'
                  >
                    Memory Usage
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {safeSystemStatus?.system?.memory_total
                      ? formatPercentage(
                          ((safeSystemStatus.system.memory_total -
                            safeSystemStatus.system.memory_available) /
                            safeSystemStatus.system.memory_total) *
                            100
                        )
                      : 'N/A'}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    {safeSystemStatus?.system?.memory_total
                      ? formatBytes(safeSystemStatus.system.memory_total)
                      : 'N/A'}
                  </Typography>
                </Box>
                <Memory sx={{ fontSize: 32, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    color='textSecondary'
                    gutterBottom
                    variant='body2'
                  >
                    CPU Cores
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {safeSystemStatus?.system?.cpu_count || 'N/A'}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Available cores
                  </Typography>
                </Box>
                <Memory sx={{ fontSize: 32, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    color='textSecondary'
                    gutterBottom
                    variant='body2'
                  >
                    Disk Usage
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {formatPercentage(safeSystemStatus?.system?.disk_usage)}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Root partition
                  </Typography>
                </Box>
                <Storage sx={{ fontSize: 32, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    color='textSecondary'
                    gutterBottom
                    variant='body2'
                  >
                    Python Version
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {safeSystemStatus?.system?.python_version || 'N/A'}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    Runtime version
                  </Typography>
                </Box>
                <HealthAndSafety sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agent Status */}
      {safeSystemStatus?.agents && (
        <>
          <Typography
            variant='h5'
            component='h2'
            sx={{ mb: 3, fontWeight: 'bold' }}
          >
            Agent Status
          </Typography>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display='flex' alignItems='center' mb={2}>
                    <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant='h6'>Active Agents</Typography>
                  </Box>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {safeSystemStatus?.agents?.active_agents || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='textSecondary'
                    sx={{ mt: 1 }}
                  >
                    Currently running AI agents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display='flex' alignItems='center' mb={2}>
                    <Memory sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant='h6'>Total Memory</Typography>
                  </Box>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {safeSystemStatus?.agents?.total_memory || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='textSecondary'
                    sx={{ mt: 1 }}
                  >
                    Combined agent memory usage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Health Check Information */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Health Check Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>Check Interval:</strong> Every 30 seconds
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Last Check:</strong>{' '}
                {safeSystemStatus?.timestamp
                  ? new Date(safeSystemStatus.timestamp).toLocaleString()
                  : 'N/A'}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Overall Status:</strong> {safeRender(overallStatus)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>Platform:</strong>{' '}
                {safeSystemStatus?.system?.platform || 'N/A'}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Database:</strong>{' '}
                {safeSystemStatus?.services?.database?.status}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Embeddings:</strong>{' '}
                {safeSystemStatus?.services?.embeddings?.status}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemHealth;
