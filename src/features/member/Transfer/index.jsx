import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function Transfer() {
  const { loading: memberLoading, error: memberError, fetchMemberDetails } = useGetMemberDetails();
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [fromPostingAccount, setFromPostingAccount] = useState('');
  const [fromAccountNumber, setFromAccountNumber] = useState('');
  const [fromAccountBalance, setFromAccountBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState(dayjs());
  const [toPostingAccount, setToPostingAccount] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [toAccountBalance, setToAccountBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

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
        let name = '';
        if (details.membname && typeof details.membname === 'string' && details.membname.trim()) {
          name = details.membname.trim();
        } else if (details.customerName && typeof details.customerName === 'string' && details.customerName.trim()) {
          name = details.customerName.trim();
        } else if (details.CustomerName && typeof details.CustomerName === 'string' && details.CustomerName.trim()) {
          name = details.CustomerName.trim();
        } else if (details.name && typeof details.name === 'string' && details.name.trim()) {
          name = details.name.trim();
        } else if (details.Name && typeof details.Name === 'string' && details.Name.trim()) {
          name = details.Name.trim();
        }

        setCustomerName(name);
        setStatusMessage('Customer details loaded successfully');
        setStatusError(false);
      } else if (memberError) {
        setStatusMessage(`Error: ${memberError}`);
        setStatusError(true);
        setCustomerName('');
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
      setCustomerName('');
    }
  };

  const handleTransfer = async () => {
    if (!fromAccountNumber.trim()) {
      setStatusMessage('Please enter a source account number.');
      setStatusError(true);
      return;
    }
    if (!toAccountNumber.trim()) {
      setStatusMessage('Please enter a target account number.');
      setStatusError(true);
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatusMessage('Please enter a valid amount.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromPostingAccount,
          sourceAccount: fromAccountNumber.trim(),
          targetAccount: toAccountNumber.trim(),
          toPostingAccount,
          amount: Number(amount),
          transferDate: transferDate ? transferDate.format('YYYY-MM-DD') : '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process transfer.');
      }

      setStatusMessage('Transfer processed successfully.');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Customer Administration / Transfer',
        action: 'Process Transfer',
        message: 'Transfer processed successfully.',
      });

      // Clear form
      handleClear();
    } catch (error) {
      setStatusMessage(error.message || 'Unable to process transfer.');
      setStatusError(true);
      notifySaveError({
        page: 'Customer Administration / Transfer',
        action: 'Process Transfer',
        message: 'Unable to process transfer.',
        error,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setCustomerCode('');
    setCustomerName('');
    setFromPostingAccount('');
    setFromAccountNumber('');
    setFromAccountBalance('');
    setAmount('');
    setTransferDate(dayjs());
    setToPostingAccount('');
    setToAccountNumber('');
    setToAccountBalance('');
    setStatusMessage('');
    setStatusError(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: '1.2rem' }}>
            Member Transfer
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Transfer funds between member accounts
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

      {/* Search Customer Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Search Customer
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
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
                sx={{ flex: 1 }}
                disabled={memberLoading}
              />
              {customerName && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, whiteSpace: 'nowrap', flex: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Customer Name
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                    {customerName}
                  </Typography>
                </Box>
              )}
            </Box>
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

      {/* Transfer From / Transfer To Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Transfer From
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    select
                    fullWidth
                    label={<span>Posting Account <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    value={fromPostingAccount}
                    onChange={(e) => setFromPostingAccount(e.target.value)}
                    disabled={isSaving}
                    size="small"
                  >
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="shares">Shares</MenuItem>
                    <MenuItem value="deposits">Deposits</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    label={<span>Account Number <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    value={fromAccountNumber}
                    onChange={(e) => setFromAccountNumber(e.target.value)}
                    placeholder="Enter source account number"
                    disabled={isSaving}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Account Balance"
                    value={fromAccountBalance}
                    onChange={(e) => setFromAccountBalance(e.target.value)}
                    placeholder="Account balance"
                    disabled={isSaving}
                    size="small"
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    fullWidth
                    label={<span>Amount <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to transfer"
                    disabled={isSaving}
                    size="small"
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                  <DatePicker
                    label="Date"
                    value={transferDate}
                    onChange={(newValue) => setTransferDate(newValue)}
                    disabled={isSaving}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Transfer To
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    select
                    fullWidth
                    label={<span>Posting Account <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    value={toPostingAccount}
                    onChange={(e) => setToPostingAccount(e.target.value)}
                    disabled={isSaving}
                    size="small"
                  >
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="shares">Shares</MenuItem>
                    <MenuItem value="deposits">Deposits</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    label={<span>Account Number <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    value={toAccountNumber}
                    onChange={(e) => setToAccountNumber(e.target.value)}
                    placeholder="Enter target account number"
                    disabled={isSaving}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Account Balance"
                    value={toAccountBalance}
                    onChange={(e) => setToAccountBalance(e.target.value)}
                    placeholder="Account balance"
                    disabled={isSaving}
                    size="small"
                    InputProps={{ readOnly: true }}
                  />
                </Box>
              </Box>
            </Box>
          </LocalizationProvider>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleTransfer}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SwapHorizRoundedIcon />}
          sx={{
            backgroundColor: '#667eea',
            '&:hover': { backgroundColor: '#5568d3' },
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 'none',
            textTransform: 'none',
            color: 'white',
          }}
        >
          {isSaving ? 'Processing...' : 'Process Transfer'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={isSaving}
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
  );
}
