import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import { Description, Chat, Upload } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { api, endpoints } from '../services/api';
import { useTranslation } from 'react-i18next';

const CustomerDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch customer's companies
  const { data: companies, isLoading } = useQuery(
    'customerCompanies',
    () => api.get(endpoints.companies).then(res => res.data),
    { refetchInterval: 30000 }
  );

  const handleAskQuestion = type => {
    if (companies && companies.length > 0) {
      // Navigate to chat with first company selected
      navigate(`/chat?company=${companies[0].id}&type=${type}`);
    }
  };

  const handleCompanySelect = company => {
    // Navigate to chat with selected company
    navigate(`/chat?company=${company.id}&type=simple`);
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
                  variant='outlined'
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

      {/* Quick Actions */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{ height: '100%', cursor: 'pointer' }}
            onClick={() => handleAskQuestion('simple')}
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
            onClick={() => handleAskQuestion('agent')}
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
                Contact admin to add new PDFs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Company Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Company Information
          </Typography>
          <Grid container spacing={3}>
            {companies?.map(company => (
              <Grid item xs={12} md={6} key={company.id}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      {company.name}
                    </Typography>
                    <Box display='flex' gap={1} mb={1}>
                      <Chip
                        label={`PDFs: ${company.pdf_count || 0}`}
                        color='primary'
                        size='small'
                      />
                      <Chip
                        label={`QA Logs: ${company.qa_logs_count || 0}`}
                        color='secondary'
                        size='small'
                      />
                      <Chip
                        label={`Agent Logs: ${company.agent_logs_count || 0}`}
                        color='info'
                        size='small'
                      />
                    </Box>
                    <Typography variant='body2' color='textSecondary'>
                      Model: {company.model_name} • Temperature:{' '}
                      {company.temperature}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
    </Box>
  );
};

export default CustomerDashboard;
