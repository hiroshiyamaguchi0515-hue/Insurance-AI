import React, { useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CompanyManagement from './pages/CompanyManagement';
import UserManagement from './pages/UserManagement';
import PDFManagement from './pages/PDFManagement';
import AgentManagement from './pages/AgentManagement';
import VectorStoreManagement from './pages/VectorStoreManagement';
import QALogs from './pages/QALogs';
import ChatComponent from './pages/ChatComponent';
import { getUserInfo } from './store/slices/authSlice';
import { useLanguagePersistence } from './hooks/useLanguagePersistence';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to='/login' replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to='/' replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { user, isAuthenticated, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Initialize language persistence
  useLanguagePersistence();

  // Stabilize the getUserInfo dispatch to prevent unnecessary re-runs
  const handleGetUserInfo = useCallback(() => {
    dispatch(getUserInfo());
  }, [dispatch]);

  // Initialize authentication on app startup
  useEffect(() => {
    console.log('🔍 App useEffect triggered:', {
      token: !!token,
      user: !!user,
      isAuthenticated,
      timestamp: Date.now(),
    });
    // If we have a token but no user data, try to get user info
    if (token && !user) {
      console.log('🚀 Fetching user info');
      handleGetUserInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, handleGetUserInfo]); // Removed isAuthenticated from dependencies

  if (!isAuthenticated || !user) {
    return (
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path='/'
        element={
          <ProtectedRoute>
            {user.role === 'admin' ? <AdminDashboard /> : <CustomerDashboard />}
          </ProtectedRoute>
        }
      />
      <Route
        path='/companies'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CompanyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path='/users'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path='/documents'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PDFManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path='/agents'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path='/qa-logs'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <QALogs />
          </ProtectedRoute>
        }
      />
      <Route
        path='/vectorstore'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VectorStoreManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path='/chat'
        element={
          <ProtectedRoute>
            <ChatComponent />
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
};

function App() {
  return <AppRoutes />;
}

export default App;
