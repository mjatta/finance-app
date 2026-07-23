import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';

export default function AccountOpening() {
  const [formData, setFormData] = useState({
    subHead: '',
    currency: '',
    branch: '',
    itemNumber: '',
    accountNumber: '',
    accountName: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation
    if (!formData.subHead.trim() || !formData.currency.trim() || !formData.branch.trim() || 
        !formData.itemNumber.trim() || !formData.accountNumber.trim() || !formData.accountName.trim()) {
      setStatusMessage('Please fill in all fields');
      setStatusError(true);
      return;
    }

    // TODO: Add API call here
    setStatusMessage('Account opening data submitted successfully');
    setStatusError(false);
  };

  const handleClear = () => {
    setFormData({
      subHead: '',
      currency: '',
      branch: '',
      itemNumber: '',
      accountNumber: '',
      accountName: '',
    });
    setStatusMessage('');
    setStatusError(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: '1.2rem' }}>
            Account Opening
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Create new account opening records
          </Typography>
        </CardContent>
      </Card>

      {/* Status Message */}
      {statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          onClose={() => setStatusMessage('')}
          sx={{ mb: 2 }}
        >
          {statusMessage}
        </Alert>
      )}

      {/* Form Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Account Opening Details
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2, maxWidth: 800 }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <TextField
                label="Sub Head"
                name="subHead"
                value={formData.subHead}
                onChange={handleInputChange}
                placeholder="Enter sub head"
                size="small"
                fullWidth
              />
              <TextField
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                placeholder="Enter currency"
                size="small"
                fullWidth
              />
              <TextField
                label="Branch"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                placeholder="Enter branch"
                size="small"
                fullWidth
              />
              <TextField
                label="Item Number"
                name="itemNumber"
                value={formData.itemNumber}
                onChange={handleInputChange}
                placeholder="Enter item number"
                size="small"
                fullWidth
              />
              <TextField
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                size="small"
                fullWidth
              />
              <TextField
                label="Account Name"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                placeholder="Enter account name"
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                type="submit"
                startIcon={<AddCircleRoundedIcon />}
                sx={{
                  backgroundColor: '#667eea',
                  '&:hover': { backgroundColor: '#5568d3' },
                  fontWeight: 600,
                  paddingX: 3,
                  boxShadow: 'none',
                  textTransform: 'none',
                }}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                sx={{
                  fontWeight: 600,
                  paddingX: 3,
                  boxShadow: 'none',
                  textTransform: 'none',
                  color: '#666',
                  borderColor: '#ccc',
                  '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' },
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
