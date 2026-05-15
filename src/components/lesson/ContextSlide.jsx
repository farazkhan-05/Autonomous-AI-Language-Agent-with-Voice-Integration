import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const ContextSlide = ({ data, onNext }) => {
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 1.5, md: 2 } }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          color: 'text.primary', 
          lineHeight: 1.6, 
          fontSize: { xs: '1rem', md: '1.15rem' }, 
          fontWeight: 700 
        }}
      >
        {data.text}
      </Typography>

      {data.image && (
        <Box
          component="img"
          src={data.image}
          alt="Context"
          sx={{
            maxWidth: '100%',
            borderRadius: '12px',
            mb: 3,
            maxHeight: 250,
            border: '3px solid',
            borderColor: 'divider',
            boxShadow: (theme) => `4px 4px 0px ${theme.palette.divider}`,
          }}
        />
      )}

      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        fullWidth
        sx={{
          py: 1.5,
          fontSize: '0.95rem',
          fontWeight: 800,
          borderRadius: '12px',
          background: '#FFE66D',
          color: '#1A1A1A',
          border: '3px solid',
          borderColor: 'divider',
          boxShadow: (theme) => `4px 4px 0px ${theme.palette.divider}`,
          textTransform: 'uppercase',
          '&:hover': { background: '#FFD93D' },
        }}
      >
        Got it
      </Button>
    </Box>
  );
};

export default ContextSlide;