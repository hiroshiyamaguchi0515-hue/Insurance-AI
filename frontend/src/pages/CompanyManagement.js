import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  FormControl,
  FormHelperText,
  MenuItem,
  Paper,
  InputLabel,
  Select,
} from '@mui/material';
import { Add, Edit, Delete, Business, Warning } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';
import { parseApiError } from '../utils/errorHandler';
import { useTranslation } from 'react-i18next';

const CompanyManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model_name: '',
    temperature: 0.1,
    max_tokens: 1000,
  });
  const [formErrors, setFormErrors] = useState({});
  const [openaiModels, setOpenaiModels] = useState([]);

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Helper function to safely get count values
  const getSafeCount = (value, defaultValue = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // Fetch companies
  const { data: companies, isLoading } = useQuery('companies', () =>
    api.get(endpoints.adminCompanies).then(res => {
      console.log('Companies API response:', res.data);
      return res.data;
    })
  );

  // Fetch OpenAI models
  const { isLoading: modelsLoading } = useQuery(
    'openaiModels',
    () => api.get(endpoints.openaiModels).then(res => res.data),
    {
      onSuccess: data => {
        setOpenaiModels(data.models || []);
      },
      onError: error => {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
      },
    }
  );

  // Create/Update company mutation
  const companyMutation = useMutation(
    data => {
      if (editingCompany) {
        return api.patch(`/companies/${editingCompany.id}`, data);
      } else {
        return api.post(endpoints.adminCompanies, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          editingCompany
            ? 'Company updated successfully!'
            : 'Company created successfully!'
        );
        queryClient.invalidateQueries('companies');
        handleCloseDialog();
      },
      onError: error => {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
      },
    }
  );

  // Delete company mutation
  const deleteMutation = useMutation(
    companyId => api.delete(`${endpoints.adminCompanies}/${companyId}`),
    {
      onSuccess: () => {
        toast.success('Company deleted successfully!');
        queryClient.invalidateQueries('companies');
      },
      onError: error => {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
      },
    }
  );

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }

    if (!formData.model_name) {
      errors.model_name = 'Please select an AI model';
    }

    if (formData.temperature < 0 || formData.temperature > 2) {
      errors.temperature = 'Temperature must be between 0 and 2';
    }

    if (formData.max_tokens < 1 || formData.max_tokens > 4000) {
      errors.max_tokens = 'Max tokens must be between 1 and 4000';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        model_name: company.model_name,
        temperature: company.temperature,
        max_tokens: company.max_tokens,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        model_name: '',
        temperature: 0.1,
        max_tokens: 1000,
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    setFormData({
      name: '',
      model_name: '',
      temperature: 0.1,
      max_tokens: 1000,
    });
    setFormErrors({});
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    companyMutation.mutate(formData);
  };

  const handleDelete = companyId => {
    if (
      window.confirm(
        'Are you sure you want to delete this company? This action cannot be undone.'
      )
    ) {
      deleteMutation.mutate(companyId);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing/selecting
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
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
        <Typography>Loading companies...</Typography>
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
          Company Management
        </Typography>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Company
        </Button>
      </Box>

      {/* Companies Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>AI Model</TableCell>
              <TableCell>Temperature</TableCell>
              <TableCell>Max Tokens</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Activity Logs</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies?.map(company => (
              <TableRow key={company.id}>
                <TableCell>
                  <Box display='flex' alignItems='center'>
                    <Business sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                      {company.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={company.model_name}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                </TableCell>
                <TableCell>{company.temperature}</TableCell>
                <TableCell>{company.max_tokens}</TableCell>
                <TableCell>
                  <Typography variant='body2' color='text.secondary'>
                    {company.created_at
                      ? new Date(company.created_at).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2' color='text.secondary'>
                    {company.updated_at
                      ? new Date(company.updated_at).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center'>
                    {/* Description icon removed as per edit hint */}
                    {getSafeCount(company.pdf_count)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' flexDirection='column' gap={0.5}>
                    <Typography variant='caption' color='text.secondary'>
                      QA: {getSafeCount(company.qa_logs_count)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Agent: {getSafeCount(company.agent_logs_count)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      getSafeCount(company.pdf_count) > 0
                        ? 'Active'
                        : 'No Documents'
                    }
                    color={
                      getSafeCount(company.pdf_count) > 0
                        ? 'success'
                        : 'default'
                    }
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Box display='flex' gap={1}>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => handleOpenDialog(company)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(company.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Company Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingCompany ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {/* Model Loading Warning */}
            {modelsLoading && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                <Warning sx={{ mr: 1 }} />
                Loading available AI models...
              </Alert>
            )}

            {/* Model Loading Error */}
            {!modelsLoading && openaiModels.length === 0 && (
              <Alert severity='error' sx={{ mb: 2 }}>
                Failed to load AI models. Please refresh the page and try again.
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Company Name'
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  required
                  disabled={!!editingCompany} // Can't change name after creation
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.model_name}>
                  <InputLabel>AI Model *</InputLabel>
                  <Select
                    value={formData.model_name}
                    onChange={e =>
                      handleInputChange('model_name', e.target.value)
                    }
                    label='AI Model *'
                    disabled={modelsLoading || openaiModels.length === 0}
                  >
                    {openaiModels.map(model => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box
                          display='flex'
                          alignItems='center'
                          justifyContent='space-between'
                          width='100%'
                        >
                          <span>{model.id}</span>
                          {model.recommended && (
                            <Chip
                              label='Recommended'
                              size='small'
                              color='success'
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.model_name && (
                    <FormHelperText error>
                      {formErrors.model_name}
                    </FormHelperText>
                  )}
                  <FormHelperText>
                    {t('company.modelHelp') ||
                      'Select the OpenAI model for this company&apos;s AI operations'}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Temperature'
                  type='number'
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                  value={formData.temperature}
                  onChange={e =>
                    handleInputChange('temperature', parseFloat(e.target.value))
                  }
                  required
                  error={!!formErrors.temperature}
                  helperText={
                    formErrors.temperature || '0.0 = focused, 2.0 = creative'
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Max Tokens'
                  type='number'
                  inputProps={{ min: 1, max: 4000 }}
                  value={formData.max_tokens}
                  onChange={e =>
                    handleInputChange('max_tokens', parseInt(e.target.value))
                  }
                  required
                  error={!!formErrors.max_tokens}
                  helperText={formErrors.max_tokens || 'Response length limit'}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={
                companyMutation.isLoading ||
                modelsLoading ||
                openaiModels.length === 0
              }
            >
              {companyMutation.isLoading
                ? 'Saving...'
                : editingCompany
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CompanyManagement;
