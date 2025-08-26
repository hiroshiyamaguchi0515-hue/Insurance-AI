import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
} from '@mui/material';
import {
  Storage,
  Refresh,
  Build,
  CheckCircle,
  Warning,
  Error,
  Business,
  Description,
  TrendingUp,
  TrendingDown,
  Settings,
  Visibility,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api, endpoints } from '../services/api';

const VectorStore = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [animateCards, setAnimateCards] = useState(false);
  const [rebuildDialogOpen, setRebuildDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery(
    'companies',
    () => api.get(endpoints.adminCompanies).then(res => res.data),
    { staleTime: 30000 }
  );

  // Rebuild vector store mutation
  const rebuildMutation = useMutation(
    companyId => api.post(`/vectorstore/rebuild/${companyId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        setRebuildDialogOpen(false);
        setSelectedCompany(null);
      },
      onError: error => {
        console.error('Rebuild failed:', error);
      },
    }
  );

  // Calculate stats
  const totalStats = {
    totalCompanies: companies.length,
    activeVectorStores: companies.filter(
      c => c.vector_store_status === 'active'
    ).length,
    totalDocuments: companies.reduce((sum, c) => sum + (c.pdf_count || 0), 0),
    totalSize: '2.4 GB',
  };

  const statsCards = [
    {
      title: t('vectorStore.totalCompanies'),
      value: totalStats.totalCompanies,
      icon: <Business sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      trend: '+2',
      trendDirection: 'up',
      delay: 0,
    },
    {
      title: t('vectorStore.activeVectorStores'),
      value: totalStats.activeVectorStores,
      icon: <Storage sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      trend: '+1',
      trendDirection: 'up',
      delay: 100,
    },
    {
      title: t('vectorStore.totalDocuments'),
      value: totalStats.totalDocuments,
      icon: <Description sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      trend: '+15',
      trendDirection: 'up',
      delay: 200,
    },
    {
      title: t('vectorStore.vectorStoreSize'),
      value: totalStats.totalSize,
      icon: <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
      trend: '+0.3 GB',
      trendDirection: 'up',
      delay: 300,
    },
  ];

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'success';
      case 'building':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'building':
        return <Build />;
      case 'error':
        return <Error />;
      default:
        return <Warning />;
    }
  };

  const handleRebuild = companyId => {
    setSelectedCompany(companies.find(c => c.id === companyId));
    setRebuildDialogOpen(true);
  };

  const confirmRebuild = () => {
    if (selectedCompany) {
      rebuildMutation.mutate(selectedCompany.id);
    }
  };

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
            {t('vectorStore.title')}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('vectorStore.subtitle')}
          </Typography>
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

      {/* Vector Store Table */}
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
              <Storage sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {t('vectorStore.vectorStoreStatus')}
              </Typography>
            </Box>

            {companiesLoading ? (
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
                    <Storage sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                </Box>
                <Typography variant='h6' color='textSecondary' sx={{ mb: 1 }}>
                  {t('common.loading')}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Loading vector stores...
                </Typography>
              </Box>
            ) : companies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Storage
                  sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant='h6' color='textSecondary' gutterBottom>
                  {t('vectorStore.noCompanies')}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {t('vectorStore.companiesInfo')}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('vectorStore.company')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('vectorStore.status')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('vectorStore.documents')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('vectorStore.vectorStoreSize')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('vectorStore.lastUpdated')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('common.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.map(company => (
                      <TableRow
                        key={company.id}
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
                              <Business />
                            </Avatar>
                            <Typography
                              variant='subtitle2'
                              sx={{ fontWeight: 600 }}
                            >
                              {company.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(
                              company.vector_store_status || 'unknown'
                            )}
                            label={t(
                              `vectorStore.status.${company.vector_store_status || 'unknown'}`
                            )}
                            color={getStatusColor(
                              company.vector_store_status || 'unknown'
                            )}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {company.pdf_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {company.vector_store_size ||
                              t('vectorStore.notCreated')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='textSecondary'>
                            {company.vector_store_updated_at ||
                              t('vectorStore.never')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={t('common.view')}>
                              <IconButton size='small' color='primary'>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('vectorStore.rebuild')}>
                              <IconButton
                                size='small'
                                color='warning'
                                onClick={() => handleRebuild(company.id)}
                                disabled={rebuildMutation.isLoading}
                              >
                                <Build />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('common.settings')}>
                              <IconButton size='small' color='info'>
                                <Settings />
                              </IconButton>
                            </Tooltip>
                          </Box>
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

      {/* System Information */}
      <Slide direction='up' in={animateCards} timeout={1400}>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
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
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
                  {t('vectorStore.systemInfo')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='textSecondary'>
                      {t('vectorStore.storageEngine')}:
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      ChromaDB
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='textSecondary'>
                      {t('vectorStore.embeddingModel')}:
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      text-embedding-ada-002
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='textSecondary'>
                      {t('vectorStore.indexType')}:
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      HNSW
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
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
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
                  {t('vectorStore.configuration')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='textSecondary'>
                      {t('vectorStore.chunkSize')}:
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      1000
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='textSecondary'>
                      {t('vectorStore.overlap')}:
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      200
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='textSecondary'>
                      {t('vectorStore.autoRebuild')}:
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      Enabled
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Slide>

      {/* Rebuild Dialog */}
      <Dialog
        open={rebuildDialogOpen}
        onClose={() => setRebuildDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>{t('vectorStore.rebuildTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant='body1' sx={{ mb: 2 }}>
            {t('vectorStore.rebuildConfirm', {
              companyName: selectedCompany?.name,
            })}
          </Typography>
          <Alert severity='warning' sx={{ mb: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {t('vectorStore.rebuildWarning')}
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>{t('vectorStore.rebuildWarning1')}</li>
              <li>{t('vectorStore.rebuildWarning2')}</li>
              <li>{t('vectorStore.rebuildWarning3')}</li>
              <li>{t('vectorStore.rebuildWarning4')}</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebuildDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={confirmRebuild}
            variant='contained'
            color='warning'
            disabled={rebuildMutation.isLoading}
          >
            {rebuildMutation.isLoading
              ? t('vectorStore.rebuilding')
              : t('vectorStore.rebuild')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VectorStore;
