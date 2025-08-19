import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CompanyManagement from './pages/CompanyManagement';
import UserManagement from './pages/UserManagement';
import PDFManagement from './pages/PDFManagement';
import AgentManagement from './pages/AgentManagement';
import VectorStoreManagement from './pages/VectorStoreManagement';
import SystemHealth from './pages/SystemHealth';
import { getUserInfo } from './store/slices/authSlice';

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

  // Initialize authentication on app startup
  useEffect(() => {
    if (token && !user && !isAuthenticated) {
      // We have a token but no user data, try to get user info
      dispatch(getUserInfo());
    }
  }, [token, user, isAuthenticated, dispatch]);

  if (!isAuthenticated || !user) {
    return (
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='*' element={<Navigate to='/login' replace />} />
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
          <ProtectedRoute>
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
        path='/vectorstore'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VectorStoreManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path='/health'
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SystemHealth />
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
