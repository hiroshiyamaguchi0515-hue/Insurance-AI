import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Business,
  People,
  Description,
  SmartToy,
  Storage,
  HealthAndSafety,
  TrendingUp,
  TrendingDown,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';

const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Box>
          <Typography color='textSecondary' gutterBottom variant='body2'>
            {title}
          </Typography>
          <Typography
            variant='h4'
            component='div'
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant='body2' color='textSecondary'>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
      {trend && (
        <Box display='flex' alignItems='center' mt={2}>
          {trend > 0 ? (
            <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
          ) : (
            <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
          )}
          <Typography
            variant='body2'
            color={trend > 0 ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'medium' }}
          >
            {Math.abs(trend)}% from last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const SystemStatusCard = ({ title, status, details, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display='flex' alignItems='center' mb={2}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 1,
            p: 1,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant='h6' component='div'>
          {title}
        </Typography>
      </Box>

      <Box display='flex' alignItems='center' mb={1}>
        <Chip label={status} color={color} size='small' sx={{ mr: 2 }} />
        <Typography variant='body2' color='textSecondary'>
          {details}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { t } = useTranslation();

  // Fetch dashboard data using existing endpoints
  const { data: companies, isLoading: companiesLoading } = useQuery(
    'companies',
    () => api.get(endpoints.adminCompanies).then(res => res.data),
    { refetchInterval: 30000 }
  );

  const { data: agentsStatus, isLoading: agentsLoading } = useQuery(
    'agentsStatus',
    () => api.get(endpoints.agentsStatus).then(res => res.data),
    { refetchInterval: 15000 }
  );

  const { data: systemStatus, isLoading: healthLoading } = useQuery(
    'systemStatus',
    () => api.get(endpoints.health).then(res => res.data),
    { refetchInterval: 10000 }
  );

  // Helper function to safely extract status from service objects
  const getServiceStatus = service => {
    if (!service) return 'unknown';
    if (typeof service === 'string') return service;
    if (typeof service === 'object' && service.status) return service.status;
    return 'unknown';
  };

  // Helper function to safely extract numeric values
  const getSafeNumber = value => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Helper function to get translated status message
  const getTranslatedStatusMessage = (service, status) => {
    if (!service || !status) return t('systemHealth.noInformation');

    const statusKey = status.toLowerCase();

    // Map backend status to translation keys
    switch (service) {
      case 'database':
        if (statusKey === 'healthy') return t('systemHealth.databaseHealthy');
        if (statusKey === 'error') return t('systemHealth.databaseError');
        return t('systemHealth.databaseUnknown');

      case 'embeddings':
        if (statusKey === 'healthy') return t('systemHealth.embeddingsHealthy');
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
  };

  const stats = [
    {
      title: t('dashboard.totalCompanies'),
      value: companies?.length || 0,
      icon: <Business />,
      color: 'primary',
      trend: 0,
    },
    {
      title: t('dashboard.activeUsers'),
      value: '0', // This would come from a users endpoint
      icon: <People />,
      color: 'success',
      trend: 0,
    },
    {
      title: t('dashboard.totalDocuments'),
      value:
        companies?.reduce(
          (acc, company) => acc + getSafeNumber(company.pdf_count),
          0
        ) || 0,
      icon: <Description />,
      color: 'info',
      trend: 0,
    },
    {
      title: t('dashboard.aiAgents'),
      value: getSafeNumber(agentsStatus?.stats?.total_agents),
      icon: <SmartToy />,
      color: 'warning',
      trend: 0,
    },
  ];

  const systemStatuses = [
    {
      title: t('systemHealth.database'),
      status: getServiceStatus(systemStatus?.services?.database),
      details: getTranslatedStatusMessage(
        'database',
        getServiceStatus(systemStatus?.services?.database)
      ),
      icon: <Storage />,
      color:
        getServiceStatus(systemStatus?.services?.database) === 'healthy'
          ? 'success'
          : 'error',
    },
    {
      title: t('systemHealth.aiEmbeddings'),
      status: getServiceStatus(systemStatus?.services?.embeddings),
      details: getTranslatedStatusMessage(
        'embeddings',
        getServiceStatus(systemStatus?.services?.embeddings)
      ),
      icon: <SmartToy />,
      color:
        getServiceStatus(systemStatus?.services?.embeddings) === 'healthy'
          ? 'success'
          : 'error',
    },
    {
      title: t('systemHealth.openaiApi'),
      status: getServiceStatus(systemStatus?.services?.openai_api),
      details: getTranslatedStatusMessage(
        'openai_api',
        getServiceStatus(systemStatus?.services?.openai_api)
      ),
      icon: <HealthAndSafety />,
      color:
        getServiceStatus(systemStatus?.services?.openai_api) === 'healthy'
          ? 'success'
          : 'error',
    },
    {
      title: t('systemHealth.memoryUsage'),
      status: systemStatus?.system?.memory_usage || 'Unknown',
      details: t('systemHealth.memoryStatus'),
      icon: <Storage />,
      color: 'info',
    },
  ];

  if (companiesLoading || agentsLoading || healthLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant='h6' color='textSecondary'>
          {t('common.loading')}
        </Typography>
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
          {t('dashboard.title')}
        </Typography>
        <IconButton onClick={() => window.location.reload()} color='primary'>
          <Refresh />
        </IconButton>
      </Box>

      {/* Statistics Grid */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* System Status */}
      <Typography variant='h5' component='h2' mb={3}>
        {t('dashboard.systemStatus')}
      </Typography>
      <Grid container spacing={3}>
        {systemStatuses.map((status, index) => (
          <Grid item xs={12} md={6} key={index}>
            <SystemStatusCard {...status} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Box mt={4}>
        <Typography variant='h5' component='h2' mb={3}>
          {t('dashboard.recentActivity')}
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant='body2' color='textSecondary'>
            {t('dashboard.lastUpdated')}: {new Date().toLocaleString()}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
