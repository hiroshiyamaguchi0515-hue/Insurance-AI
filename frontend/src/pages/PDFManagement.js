import React, { useState } from 'react';
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
  Alert,
  List,
  ListItem,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Delete,
  Business,
  Description,
  Upload,
  Refresh,
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
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Get companies
  const { data: companies, isLoading: companiesLoading } = useQuery(
    'companies',
    () => api.get(endpoints.adminCompanies).then(res => res.data),
    { enabled: !!user }
  );

  // Get PDFs for selected company
  const {
    data: pdfs,
    isLoading: pdfsLoading,
    refetch: refetchPDFs,
  } = useQuery(
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
    filename => api.delete(endpoints.removePDF(selectedCompany.id, filename)),
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = file => {
    if (!selectedCompany) {
      toast.error(t('pdf.selectCompanyFirst'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    uploadMutation.mutate(formData);
  };

  const handleDelete = pdf => {
    setPdfToDelete(pdf);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pdfToDelete) {
      deleteMutation.mutate(pdfToDelete.filename);
    }
  };

  const handleCompanySelect = company => {
    setSelectedCompany(company);
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Box>
      <Typography
        variant='h4'
        component='h1'
        sx={{ mb: 4, fontWeight: 'bold' }}
      >
        {t('pdf.title')}
      </Typography>

      {/* Company Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            {t('pdf.selectCompany')}
          </Typography>

          {companiesLoading ? (
            <Box display='flex' justifyContent='center' p={3}>
              <CircularProgress />
              <Typography variant='body2' sx={{ ml: 2, alignSelf: 'center' }}>
                {t('pdf.loadingCompanies')}
              </Typography>
            </Box>
          ) : companies?.length > 0 ? (
            <Grid container spacing={2}>
              {companies.map(company => (
                <Grid item key={company.id}>
                  <Button
                    variant={
                      selectedCompany?.id === company.id
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => handleCompanySelect(company)}
                    startIcon={<Business />}
                  >
                    {company.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Business sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant='body2' color='textSecondary'>
                {t('pdf.noCompanies')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedCompany && (
        <>
          {/* Upload Section */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                mb={2}
              >
                <Typography variant='h6'>{t('pdf.uploadTitle')}</Typography>
                <Button
                  variant='contained'
                  startIcon={<Upload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  {t('pdf.uploadPDF')}
                </Button>
              </Box>

              <Typography variant='body2' color='textSecondary'>
                {t('pdf.dragDrop')}
              </Typography>

              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  mt: 2,
                  backgroundColor: isDragActive ? 'primary.light' : 'grey.50',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <input {...getInputProps()} />
                <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant='h6' gutterBottom>
                  {isDragActive ? t('pdf.dropHere') : t('pdf.dragDrop')}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {t('pdf.orClick')}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                mb={2}
              >
                <Typography variant='h6'>
                  {t('pdf.documentsFor', { companyName: selectedCompany.name })}
                </Typography>
                <IconButton size='small' onClick={() => refetchPDFs()}>
                  <Refresh />
                </IconButton>
              </Box>

              {pdfsLoading ? (
                <Box display='flex' justifyContent='center' p={3}>
                  <CircularProgress sx={{ width: '100%' }} />
                </Box>
              ) : pdfs?.pdf_files?.length > 0 ? (
                <List>
                  {pdfs.pdf_files.map(pdf => (
                    <ListItem
                      key={pdf.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Description color='primary' />
                      </ListItemIcon>
                      <ListItemText
                        primary={pdf.filename}
                        secondary={`${t('pdf.uploaded')} ${formatDate(pdf.upload_timestamp)} • ${formatFileSize(pdf.file_size)}`}
                      />
                      <Box display='flex' gap={1} alignItems='center'>
                        <Chip
                          label={t('pdf.available')}
                          color='success'
                          size='small'
                        />
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleDelete(pdf)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Description
                    sx={{ fontSize: 64, color: 'grey.400', mb: 2 }}
                  />
                  <Typography variant='h6' color='textSecondary' gutterBottom>
                    {t('pdf.noDocuments')}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {t('pdf.startUpload')}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </>
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
          <Typography variant='body2' color='textSecondary' sx={{ mb: 2 }}>
            {t('pdf.company')}: <strong>{selectedCompany?.name}</strong>
          </Typography>

          {uploadProgress > 0 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant='determinate' value={uploadProgress} />
              <Typography variant='body2' sx={{ mt: 1 }}>
                {t('pdf.uploading')} {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            }}
          >
            <input {...getInputProps()} />
            <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant='h6' gutterBottom>
              {t('pdf.dropHere')}
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              {t('pdf.selectFile')}
            </Typography>
          </Box>
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
      >
        <DialogTitle>{t('pdf.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('pdf.deleteConfirm', { filename: pdfToDelete?.filename })}
          </Typography>
          <Alert severity='warning' sx={{ mt: 2 }}>
            {t('pdf.deleteWarning')}
          </Alert>
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
