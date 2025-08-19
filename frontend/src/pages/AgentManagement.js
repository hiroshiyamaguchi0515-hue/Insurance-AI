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
  IconButton,
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
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';

const AgentManagement = () => {
  const queryClient = useQueryClient();

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
        toast.success('Agent reset successfully!');
        queryClient.invalidateQueries('agentsStatus');
      },
      onError: error => {
        toast.error(error.response?.data?.detail || 'Agent reset failed');
      },
    }
  );

  // Force remove agent mutation
  const forceRemoveMutation = useMutation(
    companyId => api.delete(endpoints.forceRemoveAgent(companyId)),
    {
      onSuccess: () => {
        toast.success('Agent removed successfully!');
        queryClient.invalidateQueries('agentsStatus');
      },
      onError: error => {
        toast.error(error.response?.data?.detail || 'Agent removal failed');
      },
    }
  );

  const handleResetAgent = companyId => {
    if (
      window.confirm(
        'Are you sure you want to reset this agent? This will clear its memory and conversation history.'
      )
    ) {
      resetAgentMutation.mutate(companyId);
    }
  };

  const handleForceRemove = companyId => {
    if (
      window.confirm(
        'Are you sure you want to force remove this agent? This action cannot be undone.'
      )
    ) {
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
      case 'loading':
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
      case 'loading':
        return <Warning />;
      default:
        return <SmartToy />;
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

  return (
    <Box>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={4}
      >
        <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
          AI Agent Management
        </Typography>
        <Button
          variant='outlined'
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {/* Agent Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
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
                    Total Agents
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {agentsStatus?.stats?.total_agents || 0}
                  </Typography>
                </Box>
                <SmartToy sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
                    Active Agents
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {agentsStatus?.stats?.active_agents || 0}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
                    Inactive Agents
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {agentsStatus?.stats?.inactive_agents || 0}
                  </Typography>
                </Box>
                <Stop sx={{ fontSize: 32, color: 'default.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
                    Error Agents
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {agentsStatus?.stats?.error_agents || 0}
                  </Typography>
                </Box>
                <Error sx={{ fontSize: 32, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agents Table */}
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Agent Status
          </Typography>

          {agentsStatus?.agents?.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agentsStatus.agents.map(agent => (
                    <TableRow key={agent.company_id}>
                      <TableCell>
                        <Box display='flex' alignItems='center'>
                          <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography
                            variant='body1'
                            sx={{ fontWeight: 'medium' }}
                          >
                            {agent.company_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getAgentStatusIcon(agent.status)}
                          label={agent.status}
                          color={getAgentStatusColor(agent.status)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={agent.model_name || 'N/A'}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(agent.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {agent.last_activity
                          ? new Date(agent.last_activity).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Box display='flex' gap={1}>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleResetAgent(agent.company_id)}
                            disabled={resetAgentMutation.isLoading}
                          >
                            <Settings />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleForceRemove(agent.company_id)}
                            disabled={forceRemoveMutation.isLoading}
                          >
                            <Stop />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SmartToy sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant='h6' color='textSecondary' gutterBottom>
                No agents found
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Agents will appear here once companies are created with
                documents
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>Agent Framework:</strong> LangChain
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Memory Type:</strong> Conversation Buffer
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Tool Integration:</strong> PDF Q&A, Vector Store
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>Auto-creation:</strong> Enabled
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Auto-update:</strong> On vector store changes
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>Health Check:</strong> Every 10 seconds
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AgentManagement;
