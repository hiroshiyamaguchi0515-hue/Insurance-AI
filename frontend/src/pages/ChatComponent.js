import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Chat,
  Add,
  Delete,
  ArrowBack,
  Person,
  SmartToy,
  Business,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ChatComponent = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Get company from URL params
  const searchParams = new URLSearchParams(location.search);
  const companyId = searchParams.get('company');
  const chatType = searchParams.get('type') || 'simple';

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Get companies
  const { data: companies } = useQuery(
    'customerCompanies',
    () => api.get(endpoints.companies).then(res => res.data),
    { enabled: !!user }
  );

  // Get chat conversations
  const {
    data: conversations,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useQuery(
    ['chatConversations', companyId],
    () =>
      api
        .get(
          `/chat/conversations${companyId ? `?company_id=${companyId}` : ''}`
        )
        .then(res => res.data),
    { enabled: !!user }
  );

  // Get selected conversation details
  const { data: conversationDetail, refetch: refetchConversation } = useQuery(
    ['chatConversationDetail', selectedConversation?.id],
    () =>
      api
        .get(`/chat/conversations/${selectedConversation.id}`)
        .then(res => res.data),
    { enabled: !!selectedConversation }
  );

  // Ask question mutation
  const askQuestionMutation = useMutation(
    data => api.post(endpoints.chatAsk, data),
    {
      onSuccess: () => {
        toast.success(t('chat.questionSent'));
        setNewQuestion('');
        refetchConversations();
        if (selectedConversation) {
          refetchConversation();
        }
      },
      onError: error => {
        toast.error(error.response?.data?.detail || t('chat.questionFailed'));
      },
    }
  );

  // Delete conversation mutation
  const deleteConversationMutation = useMutation(
    conversationId => api.delete(endpoints.chatConversation(conversationId)),
    {
      onSuccess: () => {
        toast.success(t('chat.conversationDeleted'));
        setSelectedConversation(null);
        refetchConversations();
      },
      onError: error => {
        toast.error(error.response?.data?.detail || t('chat.deleteFailed'));
      },
    }
  );

  // Set selected company when companyId changes
  useEffect(() => {
    if (companyId && companies) {
      const company = companies.find(c => c.id === parseInt(companyId));
      if (company) {
        setSelectedCompany(company);
      }
    }
  }, [companyId, companies]);

  const handleAskQuestion = () => {
    if (!newQuestion.trim() || !selectedCompany) return;

    askQuestionMutation.mutate({
      question: newQuestion.trim(),
      company_id: selectedCompany.id,
      chat_type: chatType,
      conversation_id: selectedConversation?.id,
    });
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    setChatDialogOpen(true);
  };

  const handleConversationSelect = conversation => {
    setSelectedConversation(conversation);
  };

  const handleDeleteConversation = conversationId => {
    if (window.confirm(t('chat.deleteConfirm'))) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return t('chat.yesterday');
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageIcon = messageType => {
    switch (messageType) {
      case 'user':
        return <Person />;
      case 'assistant':
        return <SmartToy />;
      case 'error':
        return <Chat />;
      default:
        return <Chat />;
    }
  };

  const getMessageColor = messageType => {
    switch (messageType) {
      case 'user':
        return 'primary.main';
      case 'assistant':
        return 'secondary.main';
      case 'error':
        return 'error.main';
      default:
        return 'grey.500';
    }
  };

  if (!selectedCompany) {
    return (
      <Box>
        <Box display='flex' alignItems='center' mb={3}>
          <IconButton onClick={goBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
            {t('chat.title')}
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              {t('chat.selectCompany')}
            </Typography>
            <Grid container spacing={2}>
              {companies?.map(company => (
                <Grid item key={company.id}>
                  <Button
                    variant='outlined'
                    onClick={() => setSelectedCompany(company)}
                    startIcon={<Business />}
                  >
                    {company.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex' }}>
      {/* Left Sidebar - Conversations List */}
      <Box
        sx={{
          width: 350,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            mb={2}
          >
            <Box display='flex' alignItems='center'>
              <IconButton onClick={goBack} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                {selectedCompany.name}
              </Typography>
            </Box>
            <IconButton onClick={refetchConversations} size='small'>
              <Refresh />
            </IconButton>
          </Box>

          <Typography variant='body2' color='text.secondary' mb={2}>
            {chatType === 'simple'
              ? t('chat.documentQA')
              : t('chat.aiAgentChat')}
          </Typography>

          <Button
            variant='contained'
            fullWidth
            startIcon={<Add />}
            onClick={handleNewChat}
          >
            {t('chat.newChat')}
          </Button>
        </Box>

        {/* Conversations List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {conversationsLoading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>{t('common.loading')}</Typography>
            </Box>
          ) : conversations?.length > 0 ? (
            <List>
              {conversations.map((conversation, index) => (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    button
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            conversation.chat_type === 'agent'
                              ? 'secondary.main'
                              : 'primary.main',
                        }}
                      >
                        {conversation.chat_type === 'agent' ? (
                          <SmartToy />
                        ) : (
                          <Chat />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conversation.title}
                      secondary={
                        <Box>
                          <Typography variant='caption' display='block'>
                            {conversation.last_message || t('chat.noMessages')}
                          </Typography>
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={1}
                            mt={0.5}
                          >
                            <Chip
                              label={conversation.chat_type}
                              size='small'
                              color={
                                conversation.chat_type === 'agent'
                                  ? 'secondary'
                                  : 'primary'
                              }
                            />
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {formatTimestamp(conversation.updated_at)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                  {index < conversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Chat sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant='h6' gutterBottom>
                {t('chat.noConversations')}
              </Typography>
              <Typography variant='body2'>{t('chat.startNewChat')}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Right Side - Chat Messages */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                {selectedConversation.title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selectedConversation.message_count} {t('chat.messages')} •{' '}
                {formatTimestamp(selectedConversation.updated_at)}
              </Typography>
            </Box>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                backgroundColor: 'grey.50',
              }}
            >
              {conversationDetail?.messages?.map(message => (
                <Box
                  key={message.id}
                  display='flex'
                  justifyContent={
                    message.message_type === 'user' ? 'flex-end' : 'flex-start'
                  }
                  mb={2}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems:
                        message.message_type === 'user'
                          ? 'flex-end'
                          : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        gap: 1,
                      }}
                    >
                      {message.message_type === 'user' ? (
                        <>
                          <Typography variant='caption' color='text.secondary'>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: 'primary.main',
                            }}
                          >
                            <Person fontSize='small' />
                          </Avatar>
                        </>
                      ) : (
                        <>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: getMessageColor(message.message_type),
                            }}
                          >
                            {getMessageIcon(message.message_type)}
                          </Avatar>
                          <Typography variant='caption' color='text.secondary'>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                        </>
                      )}
                    </Box>

                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor:
                          message.message_type === 'user'
                            ? 'primary.main'
                            : 'white',
                        color:
                          message.message_type === 'user'
                            ? 'primary.contrastText'
                            : 'text.primary',
                        borderRadius: 2,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant='body1'>{message.content}</Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box display='flex' gap={2}>
                <TextField
                  fullWidth
                  placeholder={t('chat.questionPlaceholder')}
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  disabled={askQuestionMutation.isLoading}
                  variant='outlined'
                />
                <Button
                  variant='contained'
                  onClick={handleAskQuestion}
                  disabled={
                    !newQuestion.trim() || askQuestionMutation.isLoading
                  }
                  sx={{ minWidth: 100 }}
                >
                  {askQuestionMutation.isLoading
                    ? t('chat.sending')
                    : t('chat.send')}
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            height='100%'
            color='text.secondary'
          >
            <Chat sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant='h6' gutterBottom>
              {t('chat.selectConversation')}
            </Typography>
            <Typography variant='body2' textAlign='center'>
              {t('chat.chooseConversation')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* New Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>{t('chat.startNewChat')}</DialogTitle>
        <DialogContent>
          <TextField
            margin='dense'
            label={t('chat.firstQuestion')}
            fullWidth
            multiline
            rows={4}
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder={t('chat.askAnything')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              handleAskQuestion();
              setChatDialogOpen(false);
            }}
            variant='contained'
            disabled={!newQuestion.trim()}
          >
            {t('chat.startChat')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatComponent;
