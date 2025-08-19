import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchAgentsStatus = createAsyncThunk(
  'agent/fetchAgentsStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/agents/status');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch agents status'
      );
    }
  }
);

export const resetAgent = createAsyncThunk(
  'agent/resetAgent',
  async (companyId, { rejectWithValue }) => {
    try {
      await api.post(`/companies/${companyId}/agent/reset`);
      return companyId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to reset agent'
      );
    }
  }
);

export const forceRemoveAgent = createAsyncThunk(
  'agent/forceRemoveAgent',
  async (companyId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/agents/${companyId}/force-remove`);
      return companyId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to remove agent'
      );
    }
  }
);

const initialState = {
  agentsStatus: null,
  loading: false,
  error: null,
  resetLoading: false,
  removeLoading: false,
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAgentsStatus.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgentsStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.agentsStatus = action.payload;
      })
      .addCase(fetchAgentsStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetAgent.pending, state => {
        state.resetLoading = true;
        state.error = null;
      })
      .addCase(resetAgent.fulfilled, state => {
        state.resetLoading = false;
      })
      .addCase(resetAgent.rejected, (state, action) => {
        state.resetLoading = false;
        state.error = action.payload;
      })
      .addCase(forceRemoveAgent.pending, state => {
        state.removeLoading = true;
        state.error = null;
      })
      .addCase(forceRemoveAgent.fulfilled, state => {
        state.removeLoading = false;
      })
      .addCase(forceRemoveAgent.rejected, (state, action) => {
        state.removeLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = agentSlice.actions;
export default agentSlice.reducer;
