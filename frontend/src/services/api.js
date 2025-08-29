import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 0, // No timeout (unlimited)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          api.defaults.headers.common['Authorization'] =
            `Bearer ${access_token}`;

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  refresh: '/auth/refresh',

  // Users
  userMe: '/users/me',
  adminUsers: '/admin/users',
  adminUser: userId => `/admin/users/${userId}`,

  // Companies
  company: id => `/admin/companies/${id}`,
  companies: '/companies',
  adminCompanies: '/admin/companies',
  adminCompany: companyId => `/admin/companies/${companyId}`,

  // PDFs
  companyPDFs: companyId => `/companies/${companyId}/pdfs`,
  uploadPDF: companyId => `/companies/${companyId}/pdfs`,
  removePDF: (companyId, filename) =>
    `/companies/${companyId}/pdfs/${filename}`,

  // Q&A
  askQuestion: companyId => `/companies/${companyId}/ask`,
  askAgent: companyId => `/companies/${companyId}/agent/ask`,
  companyQALogs: companyId => `/companies/${companyId}/qa/logs`,

  // Agents
  agentReset: companyId => `/companies/${companyId}/agent/reset`,
  agentLogs: companyId => `/companies/${companyId}/agent/logs`,
  clearAgentLogs: companyId => `/companies/${companyId}/agent/logs`,

  // Vector Store
  vectorStoreStatus: companyId => `/companies/${companyId}/vector-store-status`,
  rebuildVectorStore: companyId =>
    `/companies/${companyId}/rebuild-vector-store`,

  // Admin
  openaiModels: '/admin/openai/models',
  agentsStatus: '/admin/agents/status',
  agentInfo: companyId => `/admin/agents/${companyId}/info`,
  forceRemoveAgent: companyId => `/admin/agents/${companyId}/force-remove`,

  // System
  health: '/health',
  systemStatus: '/admin/system/status',

  // Chat
  chatAsk: '/chat/ask',
  chatConversation: conversationId => `/chat/conversations/${conversationId}`,
  chatConversations: '/chat/conversations',
};

export default api;
