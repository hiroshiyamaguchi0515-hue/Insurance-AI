import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  List,
  ListItem,
  LinearProgress,
  useTheme,
  Fade,
  Slide,
  Grow,
  Zoom,
  Divider,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete,
  Business,
  Description,
  Upload,
  CloudUpload,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { parseApiError } from '../utils/errorHandler';
import { formatDate } from '../utils/dateUtils';

const PDFManagement = () => {
  const { user } = useSelector(state => state.auth);
  const theme = useTheme();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [animateCards, setAnimateCards] = useState(false);

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get companies
  const { data: companies, isLoading: companiesLoading } = useQuery(
    'companies',
    () => api.get(endpoints.adminCompanies).then(res => res.data),
    { enabled: !!user }
  );

  // Get PDFs for selected company
  const { data: pdfs, isLoading: pdfsLoading } = useQuery(
    ['companyPDFs', selectedCompany?.id],
    () =>
      api.get(endpoints.companyPDFs(selectedCompany.id)).then(res => res.data),
    { enabled: !!selectedCompany }
  );
  // Upload PDF mutation
  const uploadMutation = useMutation(
    async formData => {
      const response = await api.post(
        endpoints.uploadPDF(selectedCompany.id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success(t('pdf.uploadSuccess'));
        queryClient.invalidateQueries(['companyPDFs', selectedCompany?.id]);
        setUploadDialogOpen(false);
        setUploadProgress(0);
      },
      onError: error => {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
        setUploadProgress(0);
      },
    }
  );

  // Delete PDF mutation
  const deleteMutation = useMutation(
    async ({ companyId, filename }) => {
      const response = await api.delete(
        endpoints.removePDF(companyId, filename)
      );
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success(t('pdf.deleteSuccess'));
        queryClient.invalidateQueries(['companyPDFs', selectedCompany?.id]);
        setDeleteDialogOpen(false);
        setPdfToDelete(null);
      },
      onError: error => {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
      },
    }
  );

  const handleCompanySelect = company => {
    setSelectedCompany(company);
  };

  const handleUpload = files => {
    if (!selectedCompany) {
      toast.error(t('pdf.selectCompanyFirst'));
      return;
    }

    // For now, only handle single file upload to match backend expectation
    if (files.length === 0) {
      toast.error(t('pdf.noFileSelected'));
      return;
    }

    const formData = new FormData();
    formData.append('file', files[0]); // Use 'file' (singular) as backend expects

    uploadMutation.mutate(formData);
  };

  const handleDelete = pdf => {
    setPdfToDelete(pdf);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pdfToDelete) {
      deleteMutation.mutate({
        companyId: selectedCompany.id,
        filename: pdfToDelete.filename,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false, // Changed to false since backend only supports single file uploads
  });

  const companiesData = companies || [];

  const statsCards = [
    {
      title: t('pdf.totalCompanies'),
      value: companiesData.length,
      icon: <Business sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      trend: '+2',
      trendDirection: 'up',
      delay: 0,
    },
    {
      title: t('pdf.totalDocuments'),
      value: companiesData.reduce((acc, company) => acc + company.pdf_count, 0),
      icon: <Description sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      trend: '+15%',
      trendDirection: 'up',
      delay: 100,
    },
  ];

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
            {t('pdf.title')}
          </Typography>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {t('pdf.subtitle')}
          </Typography>
          <Divider sx={{ opacity: 0.3 }} />
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
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
                    {card.value.toLocaleString()}
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

      {/* Company Selection */}
      <Slide direction='up' in={animateCards} timeout={1000}>
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
                {t('pdf.selectCompany')}
              </Typography>
            </Box>

            {companiesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : companiesData.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel id='company-select-label'>
                  {t('common.select')} {t('common.company')}
                </InputLabel>
                <Select
                  labelId='company-select-label'
                  value={selectedCompany?.id || ''}
                  label={`${t('common.select')} ${t('common.company')}`}
                  onChange={e => {
                    const company = companiesData.find(
                      c => c.id === e.target.value
                    );
                    handleCompanySelect(company);
                  }}
                >
                  {companiesData.map(company => (
                    <MenuItem key={company.id} value={company.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Business sx={{ mr: 1, color: 'primary.main' }} />
                        {company.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Business
                  sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant='body1' color='textSecondary'>
                  {t('pdf.noCompanies')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Slide>

      {/* Documents Section */}
      {selectedCompany && (
        <Slide direction='up' in={animateCards} timeout={1200}>
          <Card
            sx={{
              mt: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Description
                    sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }}
                  />
                  <Typography
                    variant='h5'
                    component='h2'
                    sx={{ fontWeight: 700 }}
                  >
                    {t('pdf.documentsFor', {
                      companyName: selectedCompany.name,
                    })}
                  </Typography>
                </Box>
                <Button
                  variant='contained'
                  startIcon={<Upload />}
                  onClick={() => setUploadDialogOpen(true)}
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
                  {t('pdf.uploadDocuments')}
                </Button>
              </Box>

              {pdfsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : pdfs?.pdf_files?.length > 0 ? (
                <List>
                  {pdfs?.pdf_files.map(pdf => (
                    <ListItem
                      key={pdf.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.default,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          background: theme.palette.action.hover,
                          transform: 'scale(1.02)',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: theme.palette.secondary.main,
                          }}
                        >
                          <Description />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant='subtitle1'
                            sx={{ fontWeight: 600 }}
                          >
                            {pdf.filename}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='body2'
                              color='textSecondary'
                              sx={{ mb: 1 }}
                            >
                              {t('pdf.fileSize')}: {pdf.file_size} •{' '}
                              {t('pdf.uploadDate')}:{' '}
                              {formatDate(pdf.upload_timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={t('pdf.delete')}>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDelete(pdf)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Description
                    sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                  />
                  <Typography
                    variant='body1'
                    color='textSecondary'
                    sx={{ mb: 2 }}
                  >
                    {t('pdf.noDocuments')}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {t('pdf.startUpload')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Slide>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>{t('pdf.uploadTitle')}</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                background: theme.palette.action.hover,
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant='h6' sx={{ mb: 1 }}>
              {isDragActive ? t('pdf.dropHere') : t('pdf.dragDrop')}
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              {t('pdf.selectFile')}
            </Typography>
          </Box>

          {uploadProgress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body2' sx={{ mb: 1 }}>
                {t('pdf.uploading')} {uploadProgress}%
              </Typography>
              <LinearProgress variant='determinate' value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>{t('pdf.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('pdf.deleteConfirm', { filename: pdfToDelete?.filename })}
          </Typography>
          <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
            {t('pdf.deleteWarning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={confirmDelete}
            color='error'
            variant='contained'
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? t('pdf.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFManagement;
