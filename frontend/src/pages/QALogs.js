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
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const QALogs = () => {
  const { t } = useTranslation();
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
  const { data: qaLogs = [], isLoading } = useQuery(
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
    if (window.confirm(t('qa.clearLogsConfirm'))) {
      clearLogsMutation.mutate();
    }
  };

  const handleViewDetails = log => {
    setLogDetails(log);
    setDetailsOpen(true);
  };

  const getUserName = userId => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `${t('common.user')} ${userId}`;
  };

  const getCompanyName = companyId => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : `${t('common.company')} ${companyId}`;
  };

  if (!selectedCompany) {
    return (
      <Box>
        <Typography
          variant='h4'
          component='h1'
          sx={{ mb: 4, fontWeight: 'bold' }}
        >
          {t('qa.title')}
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <QuestionAnswer sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant='h6' color='textSecondary' gutterBottom>
            {t('qa.selectCompany')}
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {t('qa.selectCompanyDescription')}
          </Typography>
        </Paper>
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
          {t('qa.title')} - {getCompanyName(selectedCompany)}
        </Typography>
        <Box display='flex' gap={2}>
          <Button variant='outlined' onClick={() => setSelectedCompany('')}>
            {t('common.change')}
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<Delete />}
            onClick={handleClearLogs}
            disabled={clearLogsMutation.isLoading}
          >
            {t('qa.clearLogs')}
          </Button>
        </Box>
      </Box>

      {/* Company Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id='company-select-label'>
            {t('common.select')} {t('common.company')}
          </InputLabel>
          <Select
            labelId='company-select-label'
            value={selectedCompany}
            label={`${t('common.select')} ${t('common.company')}`}
            onChange={e => setSelectedCompany(e.target.value)}
          >
            {companies.map(company => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* QA Logs Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant='h6' gutterBottom>
          {t('qa.logs')} ({qaLogs.length})
        </Typography>
        {isLoading ? (
          <Box textAlign='center' py={4}>
            <Typography>{t('common.loading')}</Typography>
          </Box>
        ) : qaLogs.length === 0 ? (
          <Box textAlign='center' py={4}>
            <QuestionAnswer
              sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant='h6' color='textSecondary' gutterBottom>
              {t('qa.noLogs')}
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              {t('qa.noLogsDescription')}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('common.user')}</TableCell>
                  <TableCell>{t('qa.question')}</TableCell>
                  <TableCell>{t('qa.answer')}</TableCell>
                  <TableCell>{t('common.created')}</TableCell>
                  <TableCell>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qaLogs.map(log => (
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
                      <Typography variant='body2' sx={{ maxWidth: 300 }}>
                        {log.question}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ maxWidth: 300 }}>
                        {log.answer}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='textSecondary'>
                        {formatDate(log.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => handleViewDetails(log)}
                      >
                        {t('common.view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>{t('qa.logDetails')}</DialogTitle>
        <DialogContent>
          {logDetails && (
            <Box>
              <Typography variant='h6' gutterBottom>
                {t('qa.question')}
              </Typography>
              <Typography variant='body1' sx={{ mb: 3 }}>
                {logDetails.question}
              </Typography>
              <Typography variant='h6' gutterBottom>
                {t('qa.answer')}
              </Typography>
              <Typography variant='body1' sx={{ mb: 3 }}>
                {logDetails.answer}
              </Typography>
              <Typography variant='h6' gutterBottom>
                {t('common.details')}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('common.user')}:</strong>{' '}
                {getUserName(logDetails.user_id)}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('common.company')}:</strong>{' '}
                {getCompanyName(logDetails.company_id)}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('common.created')}:</strong>{' '}
                {formatDate(logDetails.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QALogs;
