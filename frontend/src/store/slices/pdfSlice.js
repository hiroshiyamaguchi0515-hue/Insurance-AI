import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../services/api';

// Async thunks
export const fetchCompanyPDFs = createAsyncThunk(
  'pdf/fetchCompanyPDFs',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.companyPDFs(companyId));
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch PDFs');
    }
  }
);

export const uploadPDF = createAsyncThunk(
  'pdf/uploadPDF',
  async ({ companyId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        endpoints.uploadPDF(companyId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to upload PDF');
    }
  }
);

export const removePDF = createAsyncThunk(
  'pdf/removePDF',
  async ({ companyId, filename }, { rejectWithValue }) => {
    try {
      await api.delete(endpoints.removePDF(companyId, filename));
      return filename;
    } catch (error) {
      return rejectWithValue('Failed to remove PDF');
    }
  }
);

const initialState = {
  pdfs: {},
  loading: false,
  error: null,
  uploadLoading: false,
  deleteLoading: false,
  uploadProgress: 0,
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    clearPDFs: state => {
      state.pdfs = {};
    },
  },
  extraReducers: builder => {
    builder
      // Fetch PDFs
      .addCase(fetchCompanyPDFs.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyPDFs.fulfilled, (state, action) => {
        state.loading = false;
        // Store PDFs by company ID
        const companyId = action.meta.arg;
        state.pdfs[companyId] = action.payload;
      })
      .addCase(fetchCompanyPDFs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload PDF
      .addCase(uploadPDF.pending, state => {
        state.uploadLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadPDF.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.uploadProgress = 100;
        // Refresh PDFs for the company
        const companyId = action.meta.arg.companyId;
        if (state.pdfs[companyId]) {
          // Trigger a refetch of PDFs
          state.pdfs[companyId] = { ...state.pdfs[companyId] };
        }
      })
      .addCase(uploadPDF.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      })
      // Delete PDF
      .addCase(removePDF.pending, state => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(removePDF.fulfilled, state => {
        state.deleteLoading = false;
        if (state.error && state.error.includes('Failed to remove PDF')) {
          state.error = null;
        }
      })
      .addCase(removePDF.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setUploadProgress, clearError, clearPDFs } = pdfSlice.actions;
export default pdfSlice.reducer;
