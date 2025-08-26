import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Delete,
  QuestionAnswer,
  Person,
  Business,
  TrendingUp,
  TrendingDown,
  Visibility,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const QALogs = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logDetails, setLogDetails] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);
  const queryClient = useQueryClient();

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get(endpoints.adminCompanies);
        setCompanies(response.data);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
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

  // Calculate stats for the selected company
  const totalStats = {
    totalLogs: qaLogs.length,
    totalQuestions: qaLogs.length,
    totalAnswers: qaLogs.length,
    averageResponseTime: '2.3s',
  };

  const statsCards = [
    {
      title: t('qa.totalLogs'),
      value: totalStats.totalLogs,
      icon: <QuestionAnswer sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      trend: '+12',
      trendDirection: 'up',
      delay: 0,
    },
    {
      title: t('qa.totalQuestions'),
      value: totalStats.totalQuestions,
      icon: <Person sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      trend: '+8',
      trendDirection: 'up',
      delay: 100,
    },
    {
      title: t('qa.totalAnswers'),
      value: totalStats.totalAnswers,
      icon: <QuestionAnswer sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      trend: '+15',
      trendDirection: 'up',
      delay: 200,
    },
    {
      title: t('qa.averageResponseTime'),
      value: totalStats.averageResponseTime,
      icon: <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
      trend: '-0.5s',
      trendDirection: 'down',
      delay: 300,
    },
  ];

  if (!selectedCompany) {
    return (
      <Box sx={{ p: 0 }}>
        {/* Header Section */}
        <Fade in={animateCards} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant='h3'
              component='h1'
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              {t('qa.title')}
            </Typography>
            <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
              {t('qa.selectCompanyDescription')}
            </Typography>
          </Box>
        </Fade>

        {/* Company Selection */}
        <Slide direction='up' in={animateCards} timeout={1200}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <QuestionAnswer sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant='h6' color='textSecondary' gutterBottom>
                {t('qa.selectCompany')}
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                {t('qa.selectCompanyDescription')}
              </Typography>

              <FormControl sx={{ minWidth: 300 }}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Business sx={{ mr: 1, color: 'primary.main' }} />
                        {company.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Slide>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header Section */}
      <Fade in={animateCards} timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h3'
            component='h1'
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            {t('qa.title')} - {getCompanyName(selectedCompany)}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('qa.selectCompanyDescription')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Divider sx={{ opacity: 0.3, flexGrow: 1, mr: 2 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant='outlined'
                onClick={() => setSelectedCompany('')}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                {t('common.change')}
              </Button>
              <Button
                variant='outlined'
                color='error'
                startIcon={<Delete />}
                onClick={handleClearLogs}
                disabled={clearLogsMutation.isLoading}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                {t('qa.clearLogs')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Grow in={animateCards} timeout={800 + card.delay}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    borderColor:
                      theme.palette[card.color]?.main ||
                      theme.palette.primary.main,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    <Zoom in={animateCards} timeout={1000 + card.delay}>
                      {card.icon}
                    </Zoom>
                  </Box>
                  <Typography
                    variant='h3'
                    component='div'
                    sx={{
                      fontWeight: 700,
                      color: theme.palette[card.color].main,
                      mb: 1,
                    }}
                  >
                    {typeof card.value === 'number'
                      ? card.value.toLocaleString()
                      : card.value}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='textSecondary'
                    sx={{ mb: 2, fontWeight: 500 }}
                  >
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Chip
                      icon={
                        card.trendDirection === 'up' ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )
                      }
                      label={card.trend}
                      size='small'
                      color={card.trendDirection === 'up' ? 'success' : 'error'}
                      variant='outlined'
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* QA Logs Table */}
      <Slide direction='up' in={animateCards} timeout={1200}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: theme.shadows[8],
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <QuestionAnswer
                sx={{ fontSize: 32, color: 'primary.main', mr: 2 }}
              />
              <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {t('qa.logs')} ({qaLogs.length})
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <LinearProgress size={80} thickness={4} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <QuestionAnswer
                      sx={{ fontSize: 32, color: 'primary.main' }}
                    />
                  </Box>
                </Box>
                <Typography variant='h6' color='textSecondary' sx={{ mb: 1 }}>
                  {t('common.loading')}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Loading QA logs...
                </Typography>
              </Box>
            ) : qaLogs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
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
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('common.user')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('qa.question')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('qa.answer')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('common.created')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('common.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qaLogs.map(log => (
                      <TableRow
                        key={log.id}
                        sx={{
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            background: theme.palette.action.hover,
                            transform: 'scale(1.01)',
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 2,
                                bgcolor: theme.palette.primary.main,
                              }}
                            >
                              <Person />
                            </Avatar>
                            <Typography
                              variant='subtitle2'
                              sx={{ fontWeight: 600 }}
                            >
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
                            {formatDate(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={t('common.view')}>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={() => handleViewDetails(log)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Slide>

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
                {formatDate(logDetails.timestamp)}
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
