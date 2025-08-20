import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, QuestionAnswer, Person, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { parseApiError } from '../utils/errorHandler';

const QALogs = () => {
  const user = useSelector(state => state.auth.user);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [logDetails, setLogDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch companies for filter
  const { data: companies } = useQuery('companies', () =>
    api.get('/companies').then(res => res.data)
  );

  // Fetch users for filter (admin only)
  const { data: users } = useQuery(
    'users',
    () => api.get('/admin/users').then(res => res.data),
    { enabled: user?.role === 'admin' }
  );

  // Fetch QA logs
  const {
    data: qaLogs,
    isLoading,
    error,
  } = useQuery(
    ['qa-logs', selectedCompany, selectedUser, limit, offset],
    () => {
      if (!selectedCompany) return Promise.resolve([]);

      const params = new URLSearchParams();
      if (selectedUser) params.append('user', selectedUser);
      params.append('limit', limit);
      params.append('offset', offset);

      return api
        .get(`/companies/${selectedCompany}/qa/logs?${params}`)
        .then(res => res.data);
    },
    { enabled: !!selectedCompany }
  );

  // Clear logs mutation
  const clearLogsMutation = useMutation(
    () => api.delete(`/companies/${selectedCompany}/qa/logs`),
    {
      onSuccess: () => {
        toast.success('QA logs cleared successfully!');
        queryClient.invalidateQueries(['qa-logs', selectedCompany]);
      },
      onError: error => {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
      },
    }
  );

  const handleClearLogs = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all QA logs for this company?'
      )
    ) {
      clearLogsMutation.mutate();
    }
  };

  const handleViewDetails = log => {
    setLogDetails(log);
    setDetailsOpen(true);
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getUserName = userId => {
    if (!users) return `User ${userId}`;
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  const getCompanyName = companyId => {
    if (!companies) return `Company ${companyId}`;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : `Company ${companyId}`;
  };

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity='error'>You must be logged in to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display='flex' alignItems='center' mb={3}>
        <QuestionAnswer sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant='h4' component='h1'>
          QA Logs
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' mb={2}>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label='Company'
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              required
            >
              <option value=''>Select Company</option>
              {companies?.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </TextField>
          </Grid>

          {user?.role === 'admin' && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label='User'
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
              >
                <option value=''>All Users</option>
                {users?.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label='Limit'
              type='number'
              value={limit}
              onChange={e => setLimit(parseInt(e.target.value) || 50)}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label='Offset'
              type='number'
              value={offset}
              onChange={e => setOffset(parseInt(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={() =>
                queryClient.invalidateQueries(['qa-logs', selectedCompany])
              }
              disabled={!selectedCompany}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        {user?.role === 'admin' && selectedCompany && (
          <Box mt={2}>
            <Button
              variant='outlined'
              color='error'
              startIcon={<Delete />}
              onClick={handleClearLogs}
              disabled={clearLogsMutation.isLoading}
            >
              {clearLogsMutation.isLoading ? 'Clearing...' : 'Clear All Logs'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* QA Logs Table */}
      {selectedCompany ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Answer</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Alert severity='error'>
                        {error.response?.data?.detail ||
                          'Failed to load QA logs'}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : qaLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography color='text.secondary'>
                        No QA logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  qaLogs?.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Box display='flex' alignItems='center'>
                          <Person sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant='body2'>
                            {getUserName(log.user_id)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {log.question}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {log.answer}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {formatDate(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => handleViewDetails(log)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color='text.secondary'>
            Please select a company to view QA logs
          </Typography>
        </Paper>
      )}

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>QA Log Details</DialogTitle>
        <DialogContent>
          {logDetails && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Company
                </Typography>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {getCompanyName(logDetails.company_id)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  User
                </Typography>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {getUserName(logDetails.user_id)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Question
                </Typography>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {logDetails.question}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Answer
                </Typography>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {logDetails.answer}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Timestamp
                </Typography>
                <Typography variant='body1'>
                  {formatDate(logDetails.timestamp)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QALogs;
