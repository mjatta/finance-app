import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import dayjs from 'dayjs';
import { useGetAccountDetails } from './hooks/useGetAccountDetails';
import { useSaveAccountDetails } from './hooks/useSaveAccountDetails';

export default function AccountEdit() {
  const { accountDetails, loading, error, fetchAccountDetails } = useGetAccountDetails();
  const { loading: savingLoading, error: saveError, saveAccountDetails } = useSaveAccountDetails();
  const [accountNumber, setAccountNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    balance: 0.00,
    openDate: '',
  });

  const handleAccountNumberChange = (e) => {
    setAccountNumber(e.target.value);
  };

  const handleAccountNumberTab = async (e) => {
    if (e.key === 'Tab' && accountNumber.trim()) {
      try {
        setStatusMessage('');
        setStatusError(false);
        const details = await fetchAccountDetails(accountNumber.trim());
        
        if (details) {
          // Map API response to form fields - extract Balance and format OpenDate
          const balance = details.balance !== undefined ? details.balance : (details.Balance !== undefined ? details.Balance : (details.nbalance || 0.00));
          let openDate = details.openDate || details.OpenDate || details.opendate || '';
          if (openDate && openDate.trim()) {
            openDate = dayjs(openDate).format('YYYY-MM-DD');
          }
          
          setFormData({
            accountName: details.accountName || details.AccountName || details.cacctname || '',
            balance: balance,
            openDate: openDate,
          });
          setStatusMessage('Account details loaded successfully');
          setStatusError(false);
        } else if (error) {
          setStatusMessage(`Error: ${error}`);
          setStatusError(true);
          setFormData({
            accountName: '',
            balance: 0.00,
            openDate: '',
          });
        }
      } catch (err) {
        setStatusMessage(`Error: ${err.message}`);
        setStatusError(true);
        setFormData({
          accountName: '',
          balance: 0.00,
          openDate: '',
        });
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setStatusMessage('Please enter an account number');
      setStatusError(true);
      return;
    }

    try {
      setStatusMessage('');
      setStatusError(false);
      const details = await fetchAccountDetails(accountNumber.trim());
      
      if (details) {
        // Map API response to form fields - extract Balance and format OpenDate
        const balance = details.balance !== undefined ? details.balance : (details.Balance !== undefined ? details.Balance : (details.nbalance || 0.00));
        let openDate = details.openDate || details.OpenDate || details.opendate || '';
        if (openDate && openDate.trim()) {
          openDate = dayjs(openDate).format('YYYY-MM-DD');
        }
        
        setFormData({
          accountName: details.accountName || details.AccountName || details.cacctname || '',
          balance: balance,
          openDate: openDate,
        });
        setStatusMessage('Account details loaded successfully');
        setStatusError(false);
      } else if (error) {
        setStatusMessage(`Error: ${error}`);
        setStatusError(true);
        setFormData({
          accountName: '',
          balance: 0.00,
          openDate: '',
        });
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
      setFormData({
        accountName: '',
        balance: 0.00,
        openDate: '',
      });
    }
  };

  const handleClear = () => {
    setAccountNumber('');
    setFormData({
      accountName: '',
      balance: 0.00,
      openDate: '',
    });
    setStatusMessage('');
    setStatusError(false);
  };

  const handleSave = async () => {
    if (!accountNumber.trim()) {
      setStatusMessage('Please enter an account number');
      setStatusError(true);
      return;
    }

    if (!formData.accountName.trim()) {
      setStatusMessage('Please enter an account name');
      setStatusError(true);
      return;
    }

    try {
      setStatusMessage('');
      setStatusError(false);
      const result = await saveAccountDetails(accountNumber.trim(), formData.accountName.trim());

      if (result) {
        setStatusMessage('Account details saved successfully');
        setStatusError(false);
      } else if (saveError) {
        setStatusMessage(`Error: ${saveError}`);
        setStatusError(true);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: '1.2rem' }}>
            Account Edit
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Search and edit account details
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
            Search Account
          </Typography>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 500 }}>
            <TextField
              label="Account Number"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              onKeyDown={handleAccountNumberTab}
              placeholder="Enter account number"
              helperText="Enter account number and press Tab or Search to load details"
              FormHelperTextProps={{
                sx: {
                  fontWeight: 600,
                  color: '#666',
                },
              }}
              size="small"
              fullWidth
              disabled={loading}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                type="submit"
                startIcon={loading ? <CircularProgress size={18} /> : <SearchRoundedIcon />}
                disabled={loading}
                sx={{
                  backgroundColor: '#667eea',
                  '&:hover': { backgroundColor: '#5568d3' },
                  fontWeight: 600,
                  paddingX: 3,
                  boxShadow: 'none',
                  textTransform: 'none',
                }}
              >
                {loading ? 'Searching...' : 'Search'}
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

      {/* Account Details Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Account Details
          </Typography>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {/* Account Name - Read-only Text Display */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#fff3cd',
                borderLeft: '4px solid #ffc107',
                p: 1.5,
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#666', mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Account Name
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '1rem' }}>
                {formData.accountName || '—'}
              </Typography>
            </Paper>

            {/* Balance - Read-only Text Display */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#f0f4ff',
                borderLeft: '4px solid #667eea',
                p: 1.5,
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#666', mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Balance
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                {typeof formData.balance === 'number' ? formData.balance.toFixed(2) : formData.balance}
              </Typography>
            </Paper>

            {/* Open Date - Read-only Text Display */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#f0fff4',
                borderLeft: '4px solid #28a745',
                p: 1.5,
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#666', mb: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Open Date
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '1rem' }}>
                {formData.openDate || '—'}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={savingLoading ? <CircularProgress size={18} /> : <SaveRoundedIcon />}
              onClick={handleSave}
              disabled={savingLoading}
              sx={{
                backgroundColor: '#28a745',
                '&:hover': { backgroundColor: '#218838' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              {savingLoading ? 'Saving...' : 'Save'}
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
