import React, { useState, useEffect } from 'react';
import { Box, Fab, Zoom, useTheme } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

const ScrollButtons = () => {
  const theme = useTheme();
  const [showTopButton, setShowTopButton] = useState(false);
  const [showBottomButton, setShowBottomButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollBottom = documentHeight - windowHeight - scrollTop;

      setShowTopButton(scrollTop > 100);
      setShowBottomButton(scrollBottom > 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Scroll to Top Button */}
      <Zoom in={showTopButton}>
        <Fab
          color='primary'
          size='medium'
          onClick={scrollToTop}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            boxShadow: theme.shadows[8],
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[12],
            },
            transition: 'all 0.3s ease-in-out',
          }}
          aria-label='Scroll to top'
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>

      {/* Scroll to Bottom Button */}
      <Zoom in={showBottomButton}>
        <Fab
          color='secondary'
          size='medium'
          onClick={scrollToBottom}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
            boxShadow: theme.shadows[8],
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[12],
            },
            transition: 'all 0.3s ease-in-out',
          }}
          aria-label='Scroll to bottom'
        >
          <KeyboardArrowDown />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default ScrollButtons;
