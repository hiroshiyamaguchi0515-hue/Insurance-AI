import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  Fade,
  Slide,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Business,
  Description,
  SmartToy,
  QuestionAnswer,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, endpoints } from '../services/api';

const CompanyManagement = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [animateCards, setAnimateCards] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model_name: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch companies with error handling
  const {
    data: companies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get(endpoints.adminCompanies).then(res => res.data),
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch available OpenAI models
  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
  } = useQuery({
    queryKey: ['openaiModels'],
    queryFn: () =>
      api.get(endpoints.openaiModels).then(res => res.data?.models),
    retry: 1,
    retryDelay: 1000,
  });

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: data => api.post(endpoints.adminCompanies, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setSnackbar({
        open: true,
        message: t('company.createSuccess'),
        severity: 'success',
      });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: t('company.createError'),
        severity: 'error',
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) =>
      api.patch(`${endpoints.adminCompanies}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setSnackbar({
        open: true,
        message: t('company.updateSuccess'),
        severity: 'success',
      });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: t('company.updateError'),
        severity: 'error',
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: id => api.delete(`${endpoints.adminCompanies}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setSnackbar({
        open: true,
        message: t('company.deleteSuccess'),
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: t('company.deleteError'),
        severity: 'error',
      });
    },
  });

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Set default model when models are loaded
  useEffect(() => {
    if (models && models.length > 0 && !formData.model_name) {
      setFormData(prev => ({
        ...prev,
        model_name: models[0].id,
      }));
    }
  }, [models, formData.model_name]);

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        description: company.description,
        model_name: company.model_name || 'gpt-4',
        temperature: company.temperature || 0.7,
        max_tokens: company.max_tokens || 1000,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        description: '',
        model_name: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompany(null);
    setFormData({
      name: '',
      description: '',
      model_name: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createCompanyMutation.mutate(formData);
    }
  };

  const handleDelete = id => {
    if (window.confirm(t('company.deleteConfirm'))) {
      deleteCompanyMutation.mutate(id);
    }
  };

  const handleInputChange = field => e => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
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
            <Business sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
        </Box>
        <Typography variant='h5' color='textSecondary' sx={{ mb: 1 }}>
          {t('common.loading')}
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          Loading companies...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        flexDirection='column'
      >
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <Business sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant='h5' color='error.main' sx={{ mb: 2 }}>
            Connection Error
          </Typography>
          <Typography variant='body1' color='textSecondary' sx={{ mb: 3 }}>
            Unable to connect to the backend server. Please check if the server
            is running.
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            This is normal if you&apos;re running the frontend without the
            backend server.
          </Typography>
        </Box>
      </Box>
    );
  }

  const companiesData = companies || [];

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
            {t('company.management')}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('company.subtitle')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Divider sx={{ opacity: 0.3, flexGrow: 1, mr: 2 }} />
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              {t('company.addNew')}
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Companies Table */}
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
              <Business sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {t('company.companiesList')}
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.name')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.description')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.aiModel')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.temperature')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.maxTokens')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.documents')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.qaLogs')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.agentLogs')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('company.created')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('common.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companiesData.map(company => (
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
                        <Typography variant='body2' color='textSecondary'>
                          {company.description || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={company.model_name || 'N/A'}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='textSecondary'>
                          {company.temperature || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='textSecondary'>
                          {company.max_tokens || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<Description />}
                          label={company.pdf_count || 0}
                          size='small'
                          color='info'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<QuestionAnswer />}
                          label={company.qa_logs_count || 0}
                          size='small'
                          color='secondary'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<SmartToy />}
                          label={company.agent_logs_count || 0}
                          size='small'
                          color='warning'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='textSecondary'>
                          {company.created_at
                            ? new Date(company.created_at).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={t('company.edit')}>
                            <IconButton
                              size='small'
                              color='secondary'
                              onClick={() => handleOpenDialog(company)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('company.delete')}>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleDelete(company.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Slide>

      {/* Add/Edit Company Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingCompany ? t('company.editCompany') : t('company.addCompany')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('company.name')}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  disabled={!!editingCompany} // Disable when editing
                  helperText={
                    editingCompany ? t('company.nameChangeNotAllowed') : ''
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('company.description')}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('company.model')}
                  value={formData.model_name}
                  onChange={handleInputChange('model_name')}
                  select
                  SelectProps={{ native: true }}
                  disabled={modelsLoading}
                  helperText={
                    modelsLoading
                      ? t('company.loadingModels')
                      : modelsError
                        ? t('company.modelsError')
                        : ''
                  }
                  error={!!modelsError}
                >
                  {modelsLoading ? (
                    <option value=''>{t('company.loadingModels')}</option>
                  ) : modelsError ? (
                    <option value=''>{t('company.modelsError')}</option>
                  ) : models?.length > 0 ? (
                    models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.id}
                      </option>
                    ))
                  ) : (
                    <option value=''>{t('company.noModelsAvailable')}</option>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('company.temperature')}
                  type='number'
                  value={formData.temperature}
                  onChange={handleInputChange('temperature')}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('company.maxTokens')}
                  type='number'
                  value={formData.max_tokens}
                  onChange={handleInputChange('max_tokens')}
                  helperText={t('company.maxTokensHelp')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={
                createCompanyMutation.isLoading ||
                updateCompanyMutation.isLoading
              }
            >
              {editingCompany ? t('common.update') : t('common.create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyManagement;
