import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { Language } from '@mui/icons-material';
import { useLanguagePersistence } from '../hooks/useLanguagePersistence';

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const currentLanguage = useSelector(state => state.ui.language);
  const { changeLanguage } = useLanguagePersistence();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = language => {
    changeLanguage(language);
    handleClose();
  };

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      flagUrl: 'https://flagcdn.com/w20/us.png',
    },
    {
      code: 'ja',
      name: '日本語',
      flag: '🇯🇵',
      flagUrl: 'https://flagcdn.com/w20/jp.png',
    },
  ];

  const currentLang =
    languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<Language />}
        sx={{ color: 'inherit', textTransform: 'none' }}
        aria-label={t('common.language')}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img
            src={currentLang.flagUrl}
            alt={currentLang.name}
            style={{
              width: '20px',
              height: '15px',
              borderRadius: '2px',
              objectFit: 'cover',
            }}
          />
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
            <img
              src={language.flagUrl}
              alt={language.name}
              style={{
                width: '20px',
                height: '15px',
                borderRadius: '2px',
                objectFit: 'cover',
              }}
            />
            <Typography>{language.name}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
