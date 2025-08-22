import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../store/slices/uiSlice';

export const useLanguagePersistence = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const currentLanguage = useSelector(state => state.ui.language);

  const changeLanguage = useCallback(
    language => {
      dispatch(setLanguage(language));
      i18n.changeLanguage(language);
    },
    [dispatch, i18n]
  );

  useEffect(() => {
    // On mount, check if we need to sync language from localStorage
    const savedLanguage = localStorage.getItem('i18nextLng');

    if (savedLanguage && savedLanguage !== currentLanguage) {
      // Update Redux state to match localStorage
      dispatch(setLanguage(savedLanguage));
    } else if (currentLanguage && i18n.language !== currentLanguage) {
      // Update i18n to match Redux state
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, dispatch, i18n]); // Include all dependencies

  return {
    currentLanguage,
    changeLanguage,
  };
};
