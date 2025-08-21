import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../services/api';

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'company/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.companies);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch companies');
    }
  }
);

export const fetchAdminCompanies = createAsyncThunk(
  'company/fetchAdminCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.adminCompanies);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch admin companies');
    }
  }
);

export const createCompany = createAsyncThunk(
  'company/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const response = await api.post(endpoints.companies, companyData);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'company/updateCompany',
  async ({ id, companyData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(endpoints.company(id), companyData);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'company/deleteCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      await api.delete(endpoints.adminCompany(companyId));
      return companyId;
    } catch (error) {
      return rejectWithValue('Failed to delete company');
    }
  }
);

export const fetchOpenAIModels = createAsyncThunk(
  'company/fetchOpenAIModels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.openaiModels);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch OpenAI models');
    }
  }
);

const initialState = {
  companies: [],
  adminCompanies: [],
  openaiModels: [],
  selectedCompany: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  modelsLoading: false,
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    clearCompanies: state => {
      state.companies = [];
      state.adminCompanies = [];
    },
  },
  extraReducers: builder => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch admin companies
      .addCase(fetchAdminCompanies.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.adminCompanies = action.payload;
      })
      .addCase(fetchAdminCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create company
      .addCase(createCompany.pending, state => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.createLoading = false;
        state.companies.push(action.payload);
        state.adminCompanies.push(action.payload);
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Update company
      .addCase(updateCompany.pending, state => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.companies.findIndex(
          c => c.id === action.payload.id
        );
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
        const adminIndex = state.adminCompanies.findIndex(
          c => c.id === action.payload.id
        );
        if (adminIndex !== -1) {
          state.adminCompanies[adminIndex] = action.payload;
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Delete company
      .addCase(deleteCompany.pending, state => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.companies = state.companies.filter(c => c.id !== action.payload);
        state.adminCompanies = state.adminCompanies.filter(
          c => c.id !== action.payload
        );
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      // Fetch OpenAI models
      .addCase(fetchOpenAIModels.pending, state => {
        state.modelsLoading = true;
        state.error = null;
      })
      .addCase(fetchOpenAIModels.fulfilled, (state, action) => {
        state.modelsLoading = false;
        state.openaiModels = action.payload.models || [];
      })
      .addCase(fetchOpenAIModels.rejected, (state, action) => {
        state.modelsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCompany, clearError, clearCompanies } =
  companySlice.actions;
export default companySlice.reducer;
