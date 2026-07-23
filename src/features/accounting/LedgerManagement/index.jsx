import React from 'react';
import { Box, Typography } from '@mui/material';

export default function LedgerManagement() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: '1.2rem' }}>
        General Ledger
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is ready for general ledger features.
      </Typography>
    </Box>
  );
}
