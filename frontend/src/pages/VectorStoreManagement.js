import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Storage,
  Build,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const VectorStoreManagement = () => {
  const [rebuildDialogOpen, setRebuildDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Fetch companies for vector store status
  const { data: companies, isLoading: companiesLoading } = useQuery(
    'companies',
    () => api.get(endpoints.adminCompanies).then(res => res.data)
  );

  // Rebuild vector store mutation
  const rebuildMutation = useMutation(
    companyId => api.post(endpoints.rebuildVectorStore(companyId)),
    {
      onSuccess: () => {
        toast.success(t('vectorStore.rebuildSuccess'));
        queryClient.invalidateQueries('companies');
        setRebuildDialogOpen(false);
        setSelectedCompany(null);
      },
      onError: error => {
        toast.error(
          error.response?.data?.detail || t('vectorStore.rebuildFailed')
        );
      },
    }
  );

  const handleRebuild = company => {
    setSelectedCompany(company);
    setRebuildDialogOpen(true);
  };

  const confirmRebuild = () => {
    if (selectedCompany) {
      rebuildMutation.mutate(selectedCompany.id);
    }
  };

  const getVectorStoreStatus = company => {
    if (company.pdf_count === 0) {
      return {
        status: 'no-documents',
        color: 'default',
        label: t('company.noDocuments'),
      };
    }

    // This would typically come from a vector store status API
    // For now, we'll assume it's healthy if there are documents
    return { status: 'healthy', color: 'success', label: t('common.healthy') };
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'healthy':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'no-documents':
        return <Info />;
      default:
        return <Storage />;
    }
  };

  if (companiesLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant='h4'
        component='h1'
        sx={{ mb: 4, fontWeight: 'bold' }}
      >
        {t('vectorStore.title')}
      </Typography>

      {/* Vector Store Statistics */}
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
                    {t('vectorStore.totalCompanies')}
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {companies?.length || 0}
                  </Typography>
                </Box>
                <Storage sx={{ fontSize: 32, color: 'primary.main' }} />
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
                    {t('vectorStore.activeVectorStores')}
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {companies?.filter(c => c.pdf_count > 0).length || 0}
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
                    {t('vectorStore.totalDocuments')}
                  </Typography>
                  <Typography
                    variant='h4'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    {companies?.reduce(
                      (acc, company) => acc + (company.pdf_count || 0),
                      0
                    ) || 0}
                  </Typography>
                </Box>
                <Storage sx={{ fontSize: 32, color: 'info.main' }} />
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
                    {t('vectorStore.storageType')}
                  </Typography>
                  <Typography
                    variant='h6'
                    component='div'
                    sx={{ fontWeight: 'bold' }}
                  >
                    FAISS
                  </Typography>
                </Box>
                <Storage sx={{ fontSize: 32, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vector Store Status Table */}
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            {t('vectorStore.vectorStoreStatus')}
          </Typography>

          {companies?.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('vectorStore.company')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell>{t('company.documents')}</TableCell>
                    <TableCell>{t('vectorStore.vectorStoreSize')}</TableCell>
                    <TableCell>{t('vectorStore.lastUpdated')}</TableCell>
                    <TableCell>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map(company => {
                    const status = getVectorStoreStatus(company);
                    return (
                      <TableRow key={company.id}>
                        <TableCell>
                          <Box display='flex' alignItems='center'>
                            <Storage sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography
                              variant='body1'
                              sx={{ fontWeight: 'medium' }}
                            >
                              {company.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(status.status)}
                            label={status.label}
                            color={status.color}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {company.pdf_count || 0} PDFs
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {company.pdf_count > 0
                              ? t('common.active')
                              : t('vectorStore.notCreated')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {company.updated_at
                              ? new Date(
                                  company.updated_at
                                ).toLocaleDateString()
                              : t('vectorStore.never')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<Build />}
                            onClick={() => handleRebuild(company)}
                            disabled={
                              rebuildMutation.isLoading ||
                              company.pdf_count === 0
                            }
                          >
                            {t('vectorStore.rebuild')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Storage sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant='h6' color='textSecondary' gutterBottom>
                {t('vectorStore.noCompanies')}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {t('vectorStore.companiesInfo')}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            {t('vectorStore.systemInfo')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('vectorStore.storageEngine')}:</strong> FAISS
                (Facebook AI Similarity Search)
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('vectorStore.embeddingModel')}:</strong> OpenAI
                text-embedding-ada-002
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('vectorStore.indexType')}:</strong> HNSW
                (Hierarchical Navigable Small World)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('vectorStore.autoRebuild')}:</strong> On document
                changes
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('vectorStore.chunkSize')}:</strong> 1000 characters
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                <strong>{t('vectorStore.overlap')}:</strong> 200 characters
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rebuild Confirmation Dialog */}
      <Dialog
        open={rebuildDialogOpen}
        onClose={() => setRebuildDialogOpen(false)}
      >
        <DialogTitle>{t('vectorStore.rebuildTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('vectorStore.rebuildConfirm', {
              companyName: selectedCompany?.name,
            })}
          </Typography>
          <Alert severity='warning' sx={{ mt: 2 }}>
            {t('vectorStore.rebuildWarning')}
            <ul>
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
            color='primary'
            variant='contained'
            disabled={rebuildMutation.isLoading}
            startIcon={<Build />}
          >
            {rebuildMutation.isLoading
              ? t('vectorStore.rebuilding')
              : t('vectorStore.rebuildVectorStore')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VectorStoreManagement;
