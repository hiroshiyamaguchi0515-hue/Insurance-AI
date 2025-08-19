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
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Send, Chat, Upload, Description } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CustomerDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [question, setQuestion] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [askType, setAskType] = useState('simple'); // 'simple' or 'agent'
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Get companies (assuming customer can see companies they have access to)
  const { data: companies } = useQuery(
    'customerCompanies',
    () => api.get('/companies').then(res => res.data),
    { enabled: !!user }
  );

  // Get PDFs for selected company
  const { data: pdfs, isLoading: pdfsLoading } = useQuery(
    ['companyPDFs', selectedCompany?.id],
    () =>
      api.get(endpoints.companyPDFs(selectedCompany.id)).then(res => res.data),
    { enabled: !!selectedCompany }
  );

  // Ask question mutation
  const askQuestionMutation = useMutation(
    data => {
      const endpoint =
        askType === 'simple'
          ? endpoints.askQuestion(selectedCompany.id)
          : endpoints.askAgent(selectedCompany.id);
      return api.post(endpoint, data);
    },
    {
      onSuccess: data => {
        console.log('data', data);
        toast.success('Question answered successfully!');
        queryClient.invalidateQueries(['companyPDFs', selectedCompany?.id]);
        setAskDialogOpen(false);
        setQuestion('');
      },
      onError: error => {
        toast.error(error.response?.data?.detail || 'Failed to get answer');
      },
    }
  );

  const handleAskQuestion = () => {
    if (!question.trim() || !selectedCompany) return;

    askQuestionMutation.mutate({
      question: question.trim(),
    });
  };

  const handleCompanySelect = company => {
    setSelectedCompany(company);
  };

  const openAskDialog = type => {
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    setAskType(type);
    setAskDialogOpen(true);
  };

  return (
    <Box>
      <Typography
        variant='h4'
        component='h1'
        sx={{ mb: 4, fontWeight: 'bold' }}
      >
        Welcome, {user?.username}!
      </Typography>

      {/* Company Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Select Company
          </Typography>
          <Grid container spacing={2}>
            {companies?.map(company => (
              <Grid item key={company.id}>
                <Button
                  variant={
                    selectedCompany?.id === company.id
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() => handleCompanySelect(company)}
                  startIcon={<Description />}
                >
                  {company.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {selectedCompany && (
        <>
          {/* Quick Actions */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{ height: '100%', cursor: 'pointer' }}
                onClick={() => openAskDialog('simple')}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Chat sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant='h6' gutterBottom>
                    Ask Question
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Get quick answers from your documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{ height: '100%', cursor: 'pointer' }}
                onClick={() => openAskDialog('agent')}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Chat sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant='h6' gutterBottom>
                    AI Agent Chat
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Interactive conversation with AI agent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Upload sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                  <Typography variant='h6' gutterBottom>
                    Upload Documents
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Add new PDFs to your company
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Company Documents */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                mb={2}
              >
                <Typography variant='h6'>
                  Documents for {selectedCompany.name}
                </Typography>
                <IconButton size='small'>{/* <Refresh /> */}</IconButton>
              </Box>

              {pdfsLoading ? (
                <Typography>Loading documents...</Typography>
              ) : pdfs?.pdf_files?.length > 0 ? (
                <List>
                  {pdfs.pdf_files.map((pdf, index) => (
                    <React.Fragment key={pdf.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Description color='primary' />
                        </ListItemIcon>
                        <ListItemText
                          primary={pdf.filename}
                          secondary={`Uploaded ${new Date(pdf.upload_timestamp).toLocaleDateString()} • ${(pdf.file_size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <Chip label='Available' color='success' size='small' />
                      </ListItem>
                      {index < pdfs.pdf_files.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography
                  color='textSecondary'
                  sx={{ textAlign: 'center', py: 3 }}
                >
                  No documents uploaded yet
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Your recent questions and interactions will appear here
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {/* Ask Question Dialog */}
      <Dialog
        open={askDialogOpen}
        onClose={() => setAskDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {askType === 'simple' ? 'Ask Question' : 'AI Agent Chat'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin='dense'
            label={t('qa.questionLabel') || 'Your question'}
            fullWidth
            multiline
            rows={4}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={
              t('qa.questionPlaceholder') ||
              'Ask anything about your documents...'
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAskDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAskQuestion}
            variant='contained'
            disabled={!question.trim() || askQuestionMutation.isLoading}
            startIcon={<Send />}
          >
            {askQuestionMutation.isLoading ? 'Processing...' : 'Ask Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboard;
