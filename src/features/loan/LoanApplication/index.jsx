import React from 'react';
import { Box, Typography } from '@mui/material';

export default function LoanApplication() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Loan Application
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is ready for loan application features.
      </Typography>
    </Box>
  );
}
