import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import { useGetMemberAccountDetails } from './hooks/useGetMemberAccountDetails';
import { useGetMemberAccountProducts } from './hooks/useGetMemberAccountProducts';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function AddMemberAccount() {
  const { memberDetails, loading: memberLoading, error: memberError, fetchMemberDetails } = useGetMemberAccountDetails();
  const { products, loading: productsLoading } = useGetMemberAccountProducts();
  
  const [customerCode, setCustomerCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    product: '',
    branch: '',
    itemNumber: '',
    accountNumber: '',
    accountName: '',
  });

  const handleCustomerCodeChange = (e) => {
    setCustomerCode(e.target.value);
  };

  const handleCustomerCodeTab = async (e) => {
    if (e.key === 'Tab' && customerCode.trim()) {
      await handleSearch();
    }
  };

  const handleSearch = async () => {
    if (!customerCode.trim()) {
      setStatusMessage('Please enter a customer code');
      setStatusError(true);
      return;
    }

    try {
      setStatusMessage('');
      setStatusError(false);
      const details = await fetchMemberDetails(customerCode.trim());

      if (details) {
        setFormData({
          ...formData,
          customerName: details.customerName || details.CustomerName || details.name || details.Name || '',
        });
        setStatusMessage('Customer details loaded successfully');
        setStatusError(false);
      } else if (memberError) {
        setStatusMessage(`Error: ${memberError}`);
        setStatusError(true);
        setFormData({
          ...formData,
          customerName: '',
        });
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
      setFormData({
        ...formData,
        customerName: '',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleClear = () => {
    setCustomerCode('');
    setFormData({
      customerName: '',
      product: '',
      branch: '',
      itemNumber: '',
      accountNumber: '',
      accountName: '',
    });
    setStatusMessage('');
    setStatusError(false);
  };

  const handleSave = async () => {
    if (!customerCode.trim() || !formData.customerName.trim() || !formData.product.trim() || 
        !formData.branch.trim() || !formData.itemNumber.trim() || 
        !formData.accountNumber.trim() || !formData.accountName.trim()) {
      setStatusMessage('Please fill in all fields before saving');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      // TODO: Add API call to save member account
      setStatusMessage('Member account saved successfully');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Customer Administration / Add Member Account',
        action: 'Save Member Account',
        message: 'Member account saved successfully',
      });
    } catch (error) {
      setStatusMessage('Failed to save member account');
      setStatusError(true);
      notifySaveError({
        page: 'Customer Administration / Add Member Account',
        action: 'Save Member Account',
        message: 'Failed to save member account',
        error,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
            Add Member Account
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Create new member account records
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

      {/* Search Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Search Customer
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, maxWidth: 500 }}>
            <TextField
              label="Customer Code"
              value={customerCode}
              onChange={handleCustomerCodeChange}
              onKeyDown={handleCustomerCodeTab}
              placeholder="Enter customer code"
              helperText="Enter customer code and press Tab or Search to load details"
              FormHelperTextProps={{
                sx: {
                  fontWeight: 600,
                  color: '#666',
                },
              }}
              size="small"
              fullWidth
              disabled={memberLoading}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={memberLoading ? <CircularProgress size={18} /> : <SearchRoundedIcon />}
                onClick={handleSearch}
                disabled={memberLoading}
                sx={{
                  backgroundColor: '#667eea',
                  '&:hover': { backgroundColor: '#5568d3' },
                  fontWeight: 600,
                  paddingX: 3,
                  boxShadow: 'none',
                  textTransform: 'none',
                }}
              >
                {memberLoading ? 'Searching...' : 'Search'}
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

      {/* Member Account Details Card */}
      {formData.customerName && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
              Member Account Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <TextField
                label="Customer Name"
                value={formData.customerName}
                size="small"
                fullWidth
                disabled
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontWeight: 900,
                    color: '#000000',
                    fontSize: '0.95rem',
                  },
                }}
              />
              <TextField
                select
                label="Product"
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                size="small"
                fullWidth
                disabled={productsLoading}
              >
                <MenuItem value="">Select product</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id || product.productCode} value={product.id || product.productCode}>
                    {product.name || product.productName || product.productCode}
                  </MenuItem>
                ))}
              </TextField>
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
                startIcon={isSaving ? <CircularProgress size={18} /> : <AddCircleRoundedIcon />}
                onClick={handleSave}
                disabled={isSaving}
                sx={{
                  backgroundColor: '#667eea',
                  '&:hover': { backgroundColor: '#5568d3' },
                  fontWeight: 600,
                  paddingX: 3,
                  boxShadow: 'none',
                  textTransform: 'none',
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
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
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
