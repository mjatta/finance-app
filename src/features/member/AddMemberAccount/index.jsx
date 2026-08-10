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
import { useGetBranches } from './hooks/useGetBranches';
import { useCheckGlDuplicate } from './hooks/useCheckGlDuplicate';
import { useSaveAccount } from './hooks/useSaveAccount';
import { useAuthStore } from '../../../store/authStore';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function AddMemberAccount() {
  const { loading: memberLoading, error: memberError, fetchMemberDetails } = useGetMemberAccountDetails();
  const { products, loading: productsLoading } = useGetMemberAccountProducts();
  const { branches, loading: branchesLoading } = useGetBranches();
  const { checkGlDuplicate, loading: glLoading } = useCheckGlDuplicate();
  const { saveAccount } = useSaveAccount();
  const user = useAuthStore((state) => state.user);
  
  const [customerCode, setCustomerCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    accountType: '',
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
        // Extract membname from the API response - this is the primary field name from the backend
        let customerName = '';
        
        // Check for membname first (as provided in the API response)
        if (details.membname && typeof details.membname === 'string' && details.membname.trim()) {
          customerName = details.membname.trim();
        } 
        // Fallback to other possible field names
        else if (details.customerName && typeof details.customerName === 'string' && details.customerName.trim()) {
          customerName = details.customerName.trim();
        } 
        else if (details.CustomerName && typeof details.CustomerName === 'string' && details.CustomerName.trim()) {
          customerName = details.CustomerName.trim();
        }
        else if (details.name && typeof details.name === 'string' && details.name.trim()) {
          customerName = details.name.trim();
        }
        else if (details.Name && typeof details.Name === 'string' && details.Name.trim()) {
          customerName = details.Name.trim();
        }
        
        setFormData({
          customerName: customerName,
          accountType: '',
          product: '',
          branch: '',
          itemNumber: String(customerCode.trim()).padStart(6, '0'),
          accountNumber: '',
          accountName: customerName,
        });
        setStatusMessage('Customer details loaded successfully');
        setStatusError(false);
      } else if (memberError) {
        setStatusMessage(`Error: ${memberError}`);
        setStatusError(true);
        setFormData({
          customerName: '',
          accountType: '',
          product: '',
          branch: '',
          itemNumber: '',
          accountNumber: '',
          accountName: '',
        });
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
      setFormData({
        customerName: '',
        product: '',
        branch: '',
        itemNumber: '',
        accountNumber: '',
        accountName: '',
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

  const handleAccountTypeBlur = async () => {
    if (!formData.accountType || !customerCode.trim()) {
      return;
    }

    const paddedCode = String(customerCode.trim()).padStart(6, '0');
    const result = await checkGlDuplicate(paddedCode, formData.accountType);
    if (result.success && result.accountNo) {
      setFormData({
        ...formData,
        accountNumber: result.accountNo,
      });
      setStatusMessage('Account number loaded successfully');
      setStatusError(false);
    } else {
      setStatusMessage('Failed to load account number');
      setStatusError(true);
    }
  };

  const handleClear = () => {
    setCustomerCode('');
    setFormData({
      customerName: '',
      accountType: '',
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
    if (!customerCode.trim() || !formData.customerName.trim() || !formData.accountType.trim() || !formData.product || 
        !formData.branch || !formData.itemNumber.trim() || 
        !formData.accountNumber.trim() || !formData.accountName.trim()) {
      setStatusMessage('Please fill in all fields before saving');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      // Map account type to product type code
      const productTypeMap = {
        'saving': '250',
        'shares': '270',
      };
      const productType = productTypeMap[formData.accountType] || formData.accountType;

      // Build the payload according to API specification
      const payload = {
        membCode: formData.itemNumber, // Already padded to 6 digits
        accountNumber: formData.accountNumber.trim(),
        accountName: formData.accountName.trim(),
        accountItem: formData.itemNumber, // Already padded to 6 digits
        branchId: parseInt(formData.branch) || 16,
        currencyCode: 1,
        productType: productType,
        productId: parseInt(formData.product) || 0,
        companyId: 30,
        userId: user?.username || 'SYSTEM',
        enableSMS: false,
        smsAccountNumber: '',
      };

      const result = await saveAccount(payload);

      if (result.success) {
        setStatusMessage('Member account saved successfully');
        setStatusError(false);
        notifySaveSuccess({
          page: 'Customer Administration / Add Member Account',
          action: 'Save Member Account',
          message: 'Member account saved successfully',
        });
        // Clear the form after successful save
        handleClear();
      } else {
        setStatusMessage(result.error || 'Failed to save member account');
        setStatusError(true);
        notifySaveError({
          page: 'Customer Administration / Add Member Account',
          action: 'Save Member Account',
          message: result.error || 'Failed to save member account',
        });
      }
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
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: '1.2rem' }}>
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
              type="number"
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
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Member Account Details
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Customer Name
                </Typography>
                <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {formData.customerName || '—'}
                </Typography>
              </Box>
              <TextField
                select
                label={<span>Account Type <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                onBlur={handleAccountTypeBlur}
                size="small"
                fullWidth
                disabled={glLoading}
                displayEmpty
                InputProps={{
                  placeholder: 'Select account type',
                }}
                renderValue={(value) => {
                  if (value === '') return <span style={{ color: '#999' }}>Select account type</span>;
                  return value === 'saving' ? 'Saving Account' : value === 'shares' ? 'Shares Account' : value;
                }}
              >
                <MenuItem value="" disabled>
                  Select account type
                </MenuItem>
                <MenuItem value="saving">Saving Account</MenuItem>
                <MenuItem value="shares">Shares Account</MenuItem>
              </TextField>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account Number
                </Typography>
                <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {formData.accountNumber || '—'}
                </Typography>
              </Box>
              <TextField
                select
                label={<span>Product <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                size="small"
                fullWidth
                disabled={productsLoading}
                displayEmpty
                InputProps={{
                  placeholder: 'Select a product',
                }}
                renderValue={(value) => {
                  if (value === '') return <span style={{ color: '#999' }}>Select a product</span>;
                  const selected = products.find(p => p.prd_id === value);
                  return selected ? selected.prd_name : value;
                }}
              >
                <MenuItem value="" disabled>
                  Select a product
                </MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.prd_id || product.id} value={product.prd_id || product.id}>
                    {product.prd_name || product.name || product.productName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={<span>Branch <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                size="small"
                fullWidth
                disabled={branchesLoading}
                displayEmpty
                InputProps={{
                  placeholder: 'Select a branch',
                }}
                renderValue={(value) => {
                  if (value === '') return <span style={{ color: '#999' }}>Select a branch</span>;
                  const selected = branches.find(b => b.branchid === value);
                  return selected ? selected.br_name : value;
                }}
              >
                <MenuItem value="" disabled>
                  Select a branch
                </MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.branchid || branch.id} value={branch.branchid || branch.id}>
                    {branch.br_name || branch.name || branch.branchName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Item Number"
                name="itemNumber"
                value={formData.itemNumber}
                onChange={handleInputChange}
                placeholder="Enter item number"
                size="small"
                fullWidth
                inputProps={{ readOnly: true }}
              />
              <TextField
                label={<span>Account Name <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
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
    </Box>
  );
}
