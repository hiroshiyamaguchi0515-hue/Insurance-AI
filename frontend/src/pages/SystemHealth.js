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
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';

const SystemHealth = () => {
  const { t } = useTranslation();

  // Fetch comprehensive system status
  const {
    data: systemStatus,
    isLoading,
    refetch,
  } = useQuery(
    'systemStatus',
    () => api.get(endpoints.health).then(res => res.data),
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

  // Helper function to get translated status message
  const getTranslatedStatusMessage = React.useCallback(
    (service, status) => {
      if (!service || !status) return t('systemHealth.noInformation');

      const statusKey = status.toLowerCase();

      // Map backend status to translation keys
      switch (service) {
        case 'database':
          if (statusKey === 'healthy') return t('systemHealth.databaseHealthy');
          if (statusKey === 'error') return t('systemHealth.databaseError');
          return t('systemHealth.databaseUnknown');

        case 'embeddings':
          if (statusKey === 'healthy')
            return t('systemHealth.embeddingsHealthy');
          if (statusKey === 'error') return t('systemHealth.embeddingsError');
          return t('systemHealth.embeddingsUnknown');

        case 'openai_api':
          if (statusKey === 'configured')
            return t('systemHealth.openaiConfigured');
          if (statusKey === 'healthy') return t('systemHealth.openaiHealthy');
          if (statusKey === 'error') return t('systemHealth.openaiError');
          return t('systemHealth.openaiUnknown');

        default:
          return t('systemHealth.noInformation');
      }
    },
    [t]
  );

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
          status: ultraSafeRender(systemStatus?.services?.database?.status),
          message: getTranslatedStatusMessage(
            'database',
            ultraSafeRender(systemStatus?.services?.database?.status)
          ),
        },
        embeddings: {
          status: ultraSafeRender(systemStatus?.services?.embeddings?.status),
          message: getTranslatedStatusMessage(
            'embeddings',
            ultraSafeRender(systemStatus?.services?.embeddings?.status)
          ),
        },
        openai_api: {
          status: ultraSafeRender(systemStatus?.services?.openai_api?.status),
          message: getTranslatedStatusMessage(
            'openai_api',
            ultraSafeRender(systemStatus?.services?.openai_api?.status)
          ),
        },
        vector_store: {
          status: ultraSafeRender(systemStatus?.services?.vector_store?.status),
          message: getTranslatedStatusMessage(
            'vector_store',
            ultraSafeRender(systemStatus?.services?.vector_store?.status)
          ),
        },
      },
      metrics: {
        memory_usage: ultraSafeRender(systemStatus?.metrics?.memory_usage),
        cpu_usage: ultraSafeRender(systemStatus?.metrics?.cpu_usage),
        disk_usage: ultraSafeRender(systemStatus?.metrics?.disk_usage),
        uptime: ultraSafeRender(systemStatus?.metrics?.uptime),
      },
      events: systemStatus?.events || [],
    }),
    [systemStatus, ultraSafeRender, getTranslatedStatusMessage]
  );

  const getStatusColor = status => {
    if (typeof status !== 'string') return 'default';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('healthy') || lowerStatus.includes('ok'))
      return 'success';
    if (lowerStatus.includes('warning')) return 'warning';
    if (lowerStatus.includes('error') || lowerStatus.includes('failed'))
      return 'error';
    if (lowerStatus.includes('unknown') || lowerStatus.includes('n/a'))
      return 'default';
    return 'info';
  };

  const getStatusIcon = status => {
    if (typeof status !== 'string') return <Info />;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('healthy') || lowerStatus.includes('ok'))
      return <CheckCircle />;
    if (lowerStatus.includes('warning')) return <Warning />;
    if (lowerStatus.includes('error') || lowerStatus.includes('failed'))
      return <Error />;
    if (lowerStatus.includes('unknown') || lowerStatus.includes('n/a'))
      return <Info />;
    return <Info />;
  };

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress />
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
          {t('systemHealth.title')}
        </Typography>
        <Button variant='contained' startIcon={<Refresh />} onClick={refetch}>
          {t('common.refresh')}
        </Button>
      </Box>

      {/* Overall Status */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display='flex' alignItems='center' mb={2}>
            <HealthAndSafety
              sx={{ mr: 2, fontSize: 32, color: 'primary.main' }}
            />
            <Typography variant='h5' component='h2'>
              {t('systemHealth.overallStatus')}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' gap={2}>
            <Chip
              icon={getStatusIcon(safeSystemStatus.overall_status)}
              label={safeSystemStatus.overall_status}
              color={getStatusColor(safeSystemStatus.overall_status)}
              size='large'
            />
            <Typography variant='body2' color='textSecondary'>
              {t('systemHealth.lastCheck')}:{' '}
              {safeSystemStatus.timestamp || 'N/A'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant='h4' component='div'>
                {safeSystemStatus.counts.users}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.users')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Business sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant='h4' component='div'>
                {safeSystemStatus.counts.companies}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.companies')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Description sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant='h4' component='div'>
                {safeSystemStatus.counts.pdf_files}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.documents')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <QuestionAnswer
                sx={{ fontSize: 32, color: 'warning.main', mb: 1 }}
              />
              <Typography variant='h4' component='div'>
                {safeSystemStatus.counts.qa_logs}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.qaLogs')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Service Status */}
      <Typography variant='h5' component='h2' mb={3}>
        {t('systemHealth.serviceStatus')}
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Storage sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant='h6' component='div'>
                  {t('systemHealth.database')}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(safeSystemStatus.services.database.status)}
                label={safeSystemStatus.services.database.status}
                color={getStatusColor(
                  safeSystemStatus.services.database.status
                )}
                size='small'
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <SmartToy sx={{ mr: 2, color: 'secondary.main' }} />
                <Typography variant='h6' component='div'>
                  {t('systemHealth.aiEmbeddings')}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(
                  safeSystemStatus.services.embeddings.status
                )}
                label={safeSystemStatus.services.embeddings.status}
                color={getStatusColor(
                  safeSystemStatus.services.embeddings.status
                )}
                size='small'
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Api sx={{ mr: 2, color: 'success.main' }} />
                <Typography variant='h6' component='div'>
                  {t('systemHealth.openaiApi')}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(
                  safeSystemStatus.services.openai_api.status
                )}
                label={safeSystemStatus.services.openai_api.status}
                color={getStatusColor(
                  safeSystemStatus.services.openai_api.status
                )}
                size='small'
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <Storage sx={{ mr: 2, color: 'info.main' }} />
                <Typography variant='h6' component='div'>
                  {t('systemHealth.vectorStore')}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(
                  safeSystemStatus.services.vector_store.status
                )}
                label={safeSystemStatus.services.vector_store.status}
                color={getStatusColor(
                  safeSystemStatus.services.vector_store.status
                )}
                size='small'
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Metrics */}
      <Typography variant='h5' component='h2' mb={3}>
        {t('systemHealth.systemMetrics')}
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Memory sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant='h6' component='div'>
                {safeSystemStatus.metrics.memory_usage}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.memoryUsage')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SmartToy sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant='h6' component='div'>
                {safeSystemStatus.metrics.cpu_usage}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.cpuUsage')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Storage sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant='h6' component='div'>
                {safeSystemStatus.metrics.disk_usage}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.diskUsage')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <HealthAndSafety
                sx={{ fontSize: 32, color: 'warning.main', mb: 1 }}
              />
              <Typography variant='h6' component='div'>
                {safeSystemStatus.metrics.uptime}
              </Typography>
              <Typography color='textSecondary' variant='body2'>
                {t('systemHealth.uptime')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Events */}
      <Typography variant='h5' component='h2' mb={3}>
        {t('systemHealth.recentEvents')}
      </Typography>
      <Card>
        <CardContent>
          {safeSystemStatus.events.length === 0 ? (
            <Box textAlign='center' py={4}>
              <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant='h6' color='textSecondary' gutterBottom>
                {t('systemHealth.noEvents')}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {t('systemHealth.noEventsInfo')}
              </Typography>
            </Box>
          ) : (
            <Box>
              {safeSystemStatus.events.slice(0, 10).map((event, index) => (
                <Box
                  key={index}
                  display='flex'
                  alignItems='center'
                  gap={2}
                  py={1}
                  borderBottom={
                    index < safeSystemStatus.events.length - 1 ? 1 : 0
                  }
                  borderColor='divider'
                >
                  <Chip
                    icon={getStatusIcon(event.level)}
                    label={event.level}
                    color={getStatusColor(event.level)}
                    size='small'
                  />
                  <Typography variant='body2' sx={{ flexGrow: 1 }}>
                    {event.message || event.details || 'No message'}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>
                    {event.timestamp || 'N/A'}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemHealth;
