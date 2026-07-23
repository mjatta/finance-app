import React from 'react';
import { Box, Typography } from '@mui/material';

export default function MemberMessage() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: '1.2rem' }}>
        Member Message
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is ready for member messaging features.
      </Typography>
    </Box>
  );
}
