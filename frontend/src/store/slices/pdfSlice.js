import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks
export const fetchCompanyPDFs = createAsyncThunk(
  'pdf/fetchCompanyPDFs',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/companies/${companyId}/pdfs`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch PDFs'
      );
    }
  }
);

export const uploadPDF = createAsyncThunk(
  'pdf/uploadPDF',
  async ({ companyId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/companies/${companyId}/pdfs`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to upload PDF'
      );
    }
  }
);

export const deletePDF = createAsyncThunk(
  'pdf/deletePDF',
  async ({ companyId, filename }, { rejectWithValue }) => {
    try {
      await api.delete(`/companies/${companyId}/pdfs/${filename}`);
      return { companyId, filename };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to delete PDF'
      );
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
      .addCase(deletePDF.pending, state => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deletePDF.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const { companyId, filename } = action.payload;
        if (state.pdfs[companyId] && state.pdfs[companyId].pdf_files) {
          state.pdfs[companyId].pdf_files = state.pdfs[
            companyId
          ].pdf_files.filter(pdf => pdf.filename !== filename);
        }
      })
      .addCase(deletePDF.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setUploadProgress, clearError, clearPDFs } = pdfSlice.actions;
export default pdfSlice.reducer;
