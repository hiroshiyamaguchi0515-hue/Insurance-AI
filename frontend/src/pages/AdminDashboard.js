import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
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
        <Chip
          label={status}
          color={
            status === 'healthy' || status === 'configured'
              ? 'success'
              : status === 'warning'
                ? 'warning'
                : 'error'
          }
          size='small'
          sx={{ mr: 1 }}
        />
      </Box>

      {details && (
        <Typography variant='body2' color='textSecondary'>
          {details}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
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

  const { data: systemHealth, isLoading: healthLoading } = useQuery(
    'systemHealth',
    () => api.get(endpoints.health).then(res => res.data),
    { refetchInterval: 10000 }
  );

  // Debug logging to help identify data structure issues
  React.useEffect(() => {
    if (systemHealth) {
      console.log('AdminDashboard - System Health Data:', systemHealth);
      console.log('AdminDashboard - Services:', systemHealth.services);
      console.log(
        'AdminDashboard - Database Service:',
        systemHealth.services?.database
      );
    }
  }, [systemHealth]);

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

  const stats = [
    {
      title: 'Total Companies',
      value: companies?.length || 0,
      icon: <Business sx={{ color: 'primary.main', fontSize: 32 }} />,
      color: 'primary',
      trend: 12,
    },
    {
      title: 'Active Users',
      value: '24',
      icon: <People sx={{ color: 'success.main', fontSize: 32 }} />,
      color: 'success',
      trend: 8,
    },
    {
      title: 'PDF Documents',
      value:
        companies?.reduce(
          (acc, company) => acc + getSafeNumber(company.pdf_count),
          0
        ) || 0,
      icon: <Description sx={{ color: 'info.main', fontSize: 32 }} />,
      color: 'info',
      trend: 15,
    },
    {
      title: 'AI Agents',
      value: getSafeNumber(agentsStatus?.stats?.total_agents),
      icon: <SmartToy sx={{ color: 'secondary.main', fontSize: 32 }} />,
      color: 'secondary',
      trend: 5,
    },
  ];

  const systemStatuses = [
    {
      title: 'Database',
      status: getServiceStatus(systemHealth?.services?.database),
      details: 'SQLite database connection',
      icon: <Storage sx={{ color: 'primary.main' }} />,
      color: 'primary',
    },
    {
      title: 'AI Embeddings',
      status: getServiceStatus(systemHealth?.services?.embeddings),
      details: 'OpenAI embeddings service',
      icon: <SmartToy sx={{ color: 'secondary.main' }} />,
      color: 'secondary',
    },
    {
      title: 'OpenAI API',
      status: getServiceStatus(systemHealth?.services?.openai_api),
      details: 'OpenAI API connectivity',
      icon: <HealthAndSafety sx={{ color: 'success.main' }} />,
      color: 'success',
    },
  ];

  if (companiesLoading || agentsLoading || healthLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <LinearProgress sx={{ width: '100%' }} />
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
          Admin Dashboard
        </Typography>
        <IconButton color='primary' size='large'>
          <Refresh />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* System Status */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        System Status
      </Typography>
      <Grid container spacing={3} mb={4}>
        {systemStatuses.map((status, index) => (
          <Grid item xs={12} md={4} key={index}>
            <SystemStatusCard {...status} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Recent Activity
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant='h6' gutterBottom>
              Recent Companies
            </Typography>
            {companies?.slice(0, 5).map(company => (
              <Box key={company.id} display='flex' alignItems='center' mb={1}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant='body2'>{company.name}</Typography>
              </Box>
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant='h6' gutterBottom>
              Agent Status
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
