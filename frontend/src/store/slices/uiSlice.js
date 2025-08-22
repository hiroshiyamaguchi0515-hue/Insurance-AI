import { createSlice } from '@reduxjs/toolkit';

// Load language from localStorage or default to 'en'
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('i18nextLng');
    return savedLanguage || 'en';
  } catch (error) {
    console.warn('Could not load language from localStorage:', error);
    return 'en';
  }
};

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  language: getInitialLanguage(),
  notifications: [],
  loadingStates: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      const newLanguage = action.payload;
      state.language = newLanguage;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('i18nextLng', newLanguage);
      } catch (error) {
        console.warn('Could not save language to localStorage:', error);
      }
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: state => {
      state.notifications = [];
    },
    setLoadingState: (state, action) => {
      const { key, loading } = action.payload;
      state.loadingStates[key] = loading;
    },
    clearLoadingStates: state => {
      state.loadingStates = {};
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLanguage,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoadingState,
  clearLoadingStates,
} = uiSlice.actions;

export default uiSlice.reducer;
