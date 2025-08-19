import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { Language } from '@mui/icons-material';
import { setLanguage } from '../store/slices/uiSlice';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const currentLanguage = useSelector(state => state.ui.language);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = language => {
    i18n.changeLanguage(language);
    dispatch(setLanguage(language));
    handleClose();
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  const currentLang =
    languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<Language />}
        sx={{ color: 'inherit', textTransform: 'none' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{currentLang.flag}</span>
          <Typography variant='body2'>{currentLang.name}</Typography>
        </Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map(language => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={currentLanguage === language.code}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 120,
            }}
          >
            <span style={{ fontSize: '1.2em' }}>{language.flag}</span>
            <Typography>{language.name}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
