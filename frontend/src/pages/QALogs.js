import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete, QuestionAnswer, Person } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, endpoints } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const QALogs = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logDetails, setLogDetails] = useState(null);
  const queryClient = useQueryClient();

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get(endpoints.companies);
        setCompanies(response.data);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch users for display
  const { data: users = [] } = useQuery(
    'users',
    () => api.get(endpoints.adminUsers).then(res => res.data),
    { enabled: !!selectedCompany }
  );

  // Fetch QA logs for selected company
  const {
    data: qaLogs = [],
    isLoading,
    refetch,
  } = useQuery(
    ['qaLogs', selectedCompany],
    () =>
      api.get(endpoints.companyQALogs(selectedCompany)).then(res => res.data),
    { enabled: !!selectedCompany }
  );

  // Clear QA logs mutation
  const clearLogsMutation = useMutation(
    () => api.delete(endpoints.companyQALogs(selectedCompany)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['qaLogs', selectedCompany]);
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

  const getUserName = userId => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  const getCompanyName = companyId => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : `Company ${companyId}`;
  };

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
        <FormControl fullWidth>
          <InputLabel id='company-select-label'>Company</InputLabel>
          <Select
            labelId='company-select-label'
            value={selectedCompany}
            label='Company'
            onChange={e => setSelectedCompany(e.target.value)}
            disabled={!companies.length}
          >
            <MenuItem value=''>
              {companies.length === 0 ? 'Loading...' : 'Select Company'}
            </MenuItem>
            {companies.length > 0 ? (
              companies.map(company => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value='' disabled>
                No companies available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        {selectedCompany && (
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

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <Box mt={2} p={2} bgcolor='grey.100' borderRadius={1}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Debug Info:
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Companies loaded: {companies.length || 0} | Selected company:{' '}
              {selectedCompany || 'None'}
            </Typography>
            {companies.length > 0 && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Available companies:{' '}
                {companies.map(c => `${c.name} (ID: ${c.id})`).join(', ')}
              </Typography>
            )}
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
                      Loading...
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
            <Box>
              <Typography variant='subtitle2' color='text.secondary'>
                Company
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {getCompanyName(logDetails.company_id)}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                User
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {getUserName(logDetails.user_id)}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                Question
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {logDetails.question}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                Answer
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {logDetails.answer}
              </Typography>

              <Typography variant='subtitle2' color='text.secondary'>
                Timestamp
              </Typography>
              <Typography variant='body1'>
                {formatDate(logDetails.timestamp)}
              </Typography>
            </Box>
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
