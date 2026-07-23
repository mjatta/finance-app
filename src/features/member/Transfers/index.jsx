import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Transfers() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: '1.2rem' }}>
        Transfers
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is ready for transfer listing features.
      </Typography>
    </Box>
  );
}
