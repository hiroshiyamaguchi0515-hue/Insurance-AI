import React from 'react';
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
} from '@mui/material';
import {
  Refresh,
  SmartToy,
  CheckCircle,
  Stop,
  Error,
  Warning,
  Settings,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';

const AgentManagement = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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
        toast.success(t('agent.resetSuccess'));
        queryClient.invalidateQueries('agentsStatus');
      },
      onError: error => {
        toast.error(error.response?.data?.detail || t('agent.resetFailed'));
      },
    }
  );

  // Force remove agent mutation
  const forceRemoveMutation = useMutation(
    companyId => api.delete(endpoints.forceRemoveAgent(companyId)),
    {
      onSuccess: () => {
        toast.success(t('agent.removeSuccess'));
        queryClient.invalidateQueries('agentsStatus');
      },
      onError: error => {
        toast.error(error.response?.data?.detail || t('agent.removeFailed'));
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
        return <CheckCircle />;
      case 'inactive':
        return <Stop />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      default:
        return <Settings />;
    }
  };

  if (isLoading) {
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

  const stats = agentsStatus?.stats || {};
  // Ensure agents is always an array, even if API returns an object
  const agents = Array.isArray(agentsStatus?.agents) ? agentsStatus.agents : [];
  return (
    <Box>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={4}
      >
        <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
          {t('agent.title')}
        </Typography>
        <Button variant='contained' startIcon={<Refresh />} onClick={refetch}>
          {t('common.refresh')}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                {t('agent.totalAgents')}
              </Typography>
              <Typography variant='h4' component='div'>
                {stats.total_agents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                {t('agent.activeAgents')}
              </Typography>
              <Typography variant='h4' component='div' color='success.main'>
                {stats.active_agents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                {t('agent.inactiveAgents')}
              </Typography>
              <Typography variant='h4' component='div' color='textSecondary'>
                {stats.inactive_agents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                {t('agent.errorAgents')}
              </Typography>
              <Typography variant='h4' component='div' color='error.main'>
                {stats.error_agents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agents Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant='h6' gutterBottom>
          {t('agent.agentStatus')}
        </Typography>
        {agents.length === 0 ? (
          <Box textAlign='center' py={4}>
            <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant='h6' color='text.secondary' gutterBottom>
              {t('agent.noAgents')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('agent.agentsInfo')}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('agent.company')}</TableCell>
                  <TableCell>{t('agent.status')}</TableCell>
                  <TableCell>{t('agent.model')}</TableCell>
                  <TableCell>{t('agent.created')}</TableCell>
                  <TableCell>{t('agent.lastActivity')}</TableCell>
                  <TableCell>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map(agent => (
                  <TableRow key={agent.company_id}>
                    <TableCell>
                      <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                        {agent.company_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getAgentStatusIcon(agent.status)}
                        label={agent.status}
                        color={getAgentStatusColor(agent.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>{agent.model_name || 'N/A'}</TableCell>
                    <TableCell>
                      {agent.created_at
                        ? new Date(agent.created_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {agent.last_activity
                        ? new Date(agent.last_activity).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display='flex' gap={1}>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => handleResetAgent(agent.company_id)}
                          disabled={resetAgentMutation.isLoading}
                        >
                          {t('agent.resetAgent')}
                        </Button>
                        <Button
                          size='small'
                          variant='outlined'
                          color='error'
                          onClick={() => handleForceRemove(agent.company_id)}
                          disabled={forceRemoveMutation.isLoading}
                        >
                          {t('agent.forceRemove')}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* System Information */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant='h6' gutterBottom>
          {t('agent.systemInfo')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant='body2' color='textSecondary'>
              <strong>{t('agent.agentFramework')}:</strong> LangChain
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant='body2' color='textSecondary'>
              <strong>{t('agent.memoryType')}:</strong> Conversation Buffer
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant='body2' color='textSecondary'>
              <strong>{t('agent.toolIntegration')}:</strong> OpenAI Functions
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant='body2' color='textSecondary'>
              <strong>{t('agent.autoCreation')}:</strong> Enabled
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AgentManagement;
