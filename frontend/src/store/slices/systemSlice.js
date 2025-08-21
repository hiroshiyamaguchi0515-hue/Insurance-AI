import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../services/api';

// Async thunks
export const fetchSystemHealth = createAsyncThunk(
  'system/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.health);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch system health');
    }
  }
);

export const rebuildVectorStore = createAsyncThunk(
  'system/rebuildVectorStore',
  async (companyId, { rejectWithValue }) => {
    try {
      await api.post(endpoints.rebuildVectorStore(companyId));
      return companyId;
    } catch (error) {
      return rejectWithValue('Failed to rebuild vector store');
    }
  }
);

const initialState = {
  systemHealth: null,
  loading: false,
  error: null,
  rebuildLoading: false,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSystemHealth.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.systemHealth = action.payload;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(rebuildVectorStore.pending, state => {
        state.rebuildLoading = true;
        state.error = null;
      })
      .addCase(rebuildVectorStore.fulfilled, state => {
        state.rebuildLoading = false;
      })
      .addCase(rebuildVectorStore.rejected, (state, action) => {
        state.rebuildLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = systemSlice.actions;
export default systemSlice.reducer;
