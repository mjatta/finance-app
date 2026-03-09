import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export default function AccessDenied() {
  const location = useLocation();
  const navigate = useNavigate();
  const requiredFeature = location.state?.requiredFeature;
  const fromPath = location.state?.fromPath;

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          maxWidth: 560,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          You do not have permission to view this page.
        </Typography>

        {(requiredFeature || fromPath) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {requiredFeature ? `Required feature: ${requiredFeature}. ` : ''}
            {fromPath ? `Requested route: ${fromPath}` : ''}
          </Typography>
        )}

        <Button variant="contained" onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
}
