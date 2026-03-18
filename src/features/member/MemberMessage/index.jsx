import React from 'react';
import { Box, Typography } from '@mui/material';

export default function MemberMessage() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Member Message
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is ready for member messaging features.
      </Typography>
    </Box>
  );
}
