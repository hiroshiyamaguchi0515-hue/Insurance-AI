import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      console.log('Attempting login with:', { username, password: '***' });
      const response = await api.post(endpoints.login, { username, password });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 'Login failed';
      console.log('Returning error message:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) {
        throw new Error('No refresh token');
      }

      const response = await api.post(endpoints.refresh, { refresh_token });
      return response.data;
    } catch (error) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

export const getUserInfo = createAsyncThunk(
  'auth/getUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.userMe);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to get user info');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  // Only set isAuthenticated to true if we have both token and user data
  // This prevents the mismatch that could cause infinite loops
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    clearError: state => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      // Only set isAuthenticated to true if we have both token and user data
      // This prevents the mismatch that could cause infinite loops
      state.isAuthenticated = !!(action.payload && state.user);
    },
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log(
          '🔍 Login fulfilled - setting token but waiting for user data'
        );
        state.loading = false;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        // Don't set isAuthenticated to true yet - wait for getUserInfo to complete
        // This prevents the mismatch that causes infinite loops
        state.isAuthenticated = false;
        localStorage.setItem('access_token', action.payload.access_token);
        localStorage.setItem('refresh_token', action.payload.refresh_token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('Login rejected case triggered');
        console.log('Action payload:', action.payload);
        console.log('Action error:', action.error);
        state.loading = false;
        state.error = action.payload;
        console.log('State error set to:', state.error);
      })
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.access_token;
        localStorage.setItem('access_token', action.payload.access_token);
      })
      .addCase(refreshToken.rejected, state => {
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      // Get user info
      .addCase(getUserInfo.pending, state => {
        state.loading = true;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        console.log(
          '🔍 GetUserInfo fulfilled - setting isAuthenticated to true'
        );
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getUserInfo.rejected, state => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
