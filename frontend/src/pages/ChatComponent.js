import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
  useTheme,
  Fade,
  Slide,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();

  // Get company from URL params
  const searchParams = new URLSearchParams(location.search);
  const companyId = searchParams.get('company');
  const chatType = searchParams.get('type') || 'simple';

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
    ['chatConversations', selectedCompany?.id],
    () =>
      api
        .get(
          `/chat/conversations${selectedCompany?.id ? `?company_id=${selectedCompany.id}` : ''}`
        )
        .then(res => res.data),
    { enabled: !!selectedCompany }
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
    setSelectedCompany(null);
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
              {t('chat.title')}
            </Typography>
            <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
              {t('chat.selectCompanyDescription')}
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
              <Chat sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant='h6' color='textSecondary' gutterBottom>
                {t('chat.selectCompany')}
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                {t('chat.selectCompanyDescription')}
              </Typography>

              <Grid container spacing={2} justifyContent='center'>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id='company-select-label'>
                      {t('common.select')} {t('common.company')}
                    </InputLabel>
                    <Select
                      labelId='company-select-label'
                      value={selectedCompany?.id || ''}
                      label={`${t('common.select')} ${t('common.company')}`}
                      onChange={e => {
                        const company = companies?.find(
                          c => c.id === e.target.value
                        );
                        if (company) {
                          setSelectedCompany(company);
                          setSelectedConversation(null);
                        }
                      }}
                    >
                      {companies?.map(company => (
                        <MenuItem key={company.id} value={company.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Business sx={{ mr: 1, color: 'primary.main' }} />
                            {company.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton
              onClick={goBack}
              sx={{
                mr: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateX(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant='h3'
              component='h1'
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {selectedCompany.name} - {t('chat.title')}
            </Typography>
          </Box>
          <Typography variant='h6' color='textSecondary' sx={{ mb: 3 }}>
            {chatType === 'simple'
              ? t('chat.documentQA')
              : t('chat.aiAgentChat')}
          </Typography>
        </Box>
      </Fade>
      {/* Chat Interface */}
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
          <Box sx={{ height: 'calc(100vh - 400px)', display: 'flex' }}>
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
                    <Typography variant='h6' sx={{ fontWeight: 700 }}>
                      {selectedCompany.name}
                    </Typography>
                  </Box>
                  <Tooltip title={t('common.refresh')}>
                    <IconButton
                      onClick={refetchConversations}
                      size='small'
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'rotate(180deg)',
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Button
                  variant='contained'
                  fullWidth
                  startIcon={<Add />}
                  onClick={handleNewChat}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  {t('chat.newChat')}
                </Button>
              </Box>

              {/* Conversations List */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {conversationsLoading ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
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
                        <Chat sx={{ fontSize: 32, color: 'primary.main' }} />
                      </Box>
                    </Box>
                    <Typography
                      variant='h6'
                      color='textSecondary'
                      sx={{ mb: 1 }}
                    >
                      {t('common.loading')}
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Loading conversations...
                    </Typography>
                  </Box>
                ) : conversations?.length > 0 ? (
                  <List>
                    {conversations.map((conversation, index) => (
                      <React.Fragment key={conversation.id}>
                        <ListItem
                          button
                          selected={
                            selectedConversation?.id === conversation.id
                          }
                          onClick={() => handleConversationSelect(conversation)}
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateX(4px)',
                              backgroundColor: theme.palette.action.hover,
                            },
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
                                  {conversation.last_message ||
                                    t('chat.noMessages')}
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
                          <Tooltip title={t('common.delete')}>
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteConversation(conversation.id);
                              }}
                              sx={{
                                color: 'error.main',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  backgroundColor: 'error.light',
                                  color: 'error.contrastText',
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </ListItem>
                        {index < conversations.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box
                    sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}
                  >
                    <Chat sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant='h6' gutterBottom>
                      {t('chat.noConversations')}
                    </Typography>
                    <Typography variant='body2'>
                      {t('chat.startNewChat')}
                    </Typography>
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
                    <Typography variant='h6' sx={{ fontWeight: 700 }}>
                      {selectedConversation.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {selectedConversation.message_count} {t('chat.messages')}{' '}
                      • {formatTimestamp(selectedConversation.updated_at)}
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
                          message.message_type === 'user'
                            ? 'flex-end'
                            : 'flex-start'
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
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
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
                                    bgcolor: getMessageColor(
                                      message.message_type
                                    ),
                                  }}
                                >
                                  {getMessageIcon(message.message_type)}
                                </Avatar>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
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
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                boxShadow: 3,
                                transform: 'translateY(-2px)',
                              },
                            }}
                          >
                            <Typography variant='body1'>
                              {message.content}
                            </Typography>
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Button
                        variant='contained'
                        onClick={handleAskQuestion}
                        disabled={
                          !newQuestion.trim() || askQuestionMutation.isLoading
                        }
                        sx={{
                          minWidth: 100,
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4],
                          },
                        }}
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
          </Box>
        </Card>
      </Slide>

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
