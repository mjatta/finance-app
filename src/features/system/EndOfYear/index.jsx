import React from 'react';
import { Box, Typography } from '@mui/material';

export default function EndOfYear() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        End of Year
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is ready for end-of-year processing features.
      </Typography>
    </Box>
  );
}
