import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function Verification() {
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    verificationCode: '',
    referencNumber: '',
    verificationStatus: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      if (!formData.verificationCode || !formData.referencNumber) {
        setStatusMessage('Verification Code and Reference Number are required');
        setIsLoading(false);
        return;
      }

      // Placeholder for API call
      console.log('Verification payload:', formData);
      
      setStatusMessage('Verification completed successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Error during verification:', error);
      setStatusMessage('Error during verification: ' + error.message);
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      verificationCode: '',
      referencNumber: '',
      verificationStatus: '',
    });
    setStatusMessage('');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <VerifiedUserIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Verification
        </Typography>
      </Box>

      {/* Status Message */}
      {statusMessage && (
        <Alert
          severity={statusMessage.includes('Error') ? 'error' : 'success'}
          sx={{ mb: 3 }}
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
      )}

      {/* Main Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              mb: 3,
              pb: 1.5,
              fontSize: '0.95rem',
              color: '#2c3e50',
              borderBottom: '2px solid',
              borderColor: '#bdbdbd',
            }}
          >
            Verification Details
          </Typography>

          <Grid container spacing={3}>
            {/* Verification Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Verification Code"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Enter verification code"
              />
            </Grid>

            {/* Reference Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Reference Number"
                name="referencNumber"
                value={formData.referencNumber}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Enter reference number"
              />
            </Grid>

            {/* Verification Status */}
            <Grid item xs={12}>
              <TextField
                label="Verification Status"
                name="verificationStatus"
                value={formData.verificationStatus}
                onChange={handleChange}
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="Status details will appear here"
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleVerify}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              sx={{ fontWeight: 600 }}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ borderRadius: 2, backgroundColor: '#f0f7ff' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Verification Information
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Use this page to verify transactions, documents, or records. Enter the verification code and reference
            number to complete the verification process.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
