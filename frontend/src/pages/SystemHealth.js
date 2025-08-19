import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { api, endpoints } from '../services/api';

const SystemHealth = () => {
  // Fetch system health
  const {
    data: systemHealth,
    isLoading,
    refetch,
  } = useQuery(
    'systemHealth',
    () => api.get(endpoints.health).then(res => res.data),
    { refetchInterval: 15000 }
  );

  const getStatusColor = status => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'healthy':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getOverallStatus = () => {
    if (!systemHealth?.services) return 'unknown';

    const services = Object.values(systemHealth.services);
    if (services.every(s => s === 'healthy')) return 'healthy';
    if (services.some(s => s === 'error')) return 'error';
    if (services.some(s => s === 'warning')) return 'warning';
    return 'unknown';
  };

  const overallStatus = getOverallStatus();

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
              label={overallStatus.toUpperCase()}
              color={getStatusColor(overallStatus)}
              size='large'
              sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
            />
          </Box>

          <Typography variant='body2' color='textSecondary'>
            Last updated: {new Date().toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

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
                icon={getStatusIcon(systemHealth?.services?.database)}
                label={systemHealth?.services?.database || 'unknown'}
                color={getStatusColor(systemHealth?.services?.database)}
                size='small'
              />
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
                SQLite database connection
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
                icon={getStatusIcon(systemHealth?.services?.embeddings)}
                label={systemHealth?.services?.embeddings || 'unknown'}
                color={getStatusColor(systemHealth?.services?.embeddings)}
                size='small'
              />
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
                OpenAI embeddings service
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
                icon={getStatusIcon(systemHealth?.services?.openai_api)}
                label={systemHealth?.services?.openai_api || 'unknown'}
                color={getStatusColor(systemHealth?.services?.openai_api)}
                size='small'
              />
              <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
                OpenAI API connectivity
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
                    {systemHealth?.metrics?.memory_usage || 'N/A'}
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
                    CPU Usage
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {systemHealth?.metrics?.cpu_usage || 'N/A'}
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
                    {systemHealth?.metrics?.disk_usage || 'N/A'}
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
                    Uptime
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {systemHealth?.metrics?.uptime || 'N/A'}
                  </Typography>
                </Box>
                <HealthAndSafety sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Events */}
      <Typography
        variant='h5'
        component='h2'
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Recent System Events
      </Typography>
      <Card>
        <CardContent>
          {systemHealth?.events?.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {systemHealth.events.slice(0, 10).map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{event.event}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.level}
                          color={
                            event.level === 'error'
                              ? 'error'
                              : event.level === 'warning'
                                ? 'warning'
                                : 'info'
                          }
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{event.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Info sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant='h6' color='textSecondary' gutterBottom>
                No recent events
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                System is running smoothly with no issues
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Health Check Information */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Health Check Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>Check Interval:</strong> Every 15 seconds
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Last Check:</strong> {new Date().toLocaleString()}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Response Time:</strong>{' '}
                {systemHealth?.response_time || 'N/A'}ms
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>Auto-recovery:</strong> Enabled
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Alert System:</strong> Active
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Logging:</strong> Verbose
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemHealth;
