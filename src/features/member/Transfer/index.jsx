import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useTransferChainedAPIs, isLoanAccount } from './hooks/useTransferChainedAPIs';
import { useAuthStore } from '../../../store/authStore';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

const extractMemberName = (details) => {
  if (details.membname && typeof details.membname === 'string' && details.membname.trim()) {
    return details.membname.trim();
  }
  if (details.customerName && typeof details.customerName === 'string' && details.customerName.trim()) {
    return details.customerName.trim();
  }
  if (details.CustomerName && typeof details.CustomerName === 'string' && details.CustomerName.trim()) {
    return details.CustomerName.trim();
  }
  if (details.name && typeof details.name === 'string' && details.name.trim()) {
    return details.name.trim();
  }
  if (details.Name && typeof details.Name === 'string' && details.Name.trim()) {
    return details.Name.trim();
  }
  return '';
};

export default function Transfer() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { loading: memberLoading, error: memberError, fetchMemberDetails } = useGetMemberDetails();
  const { loading: toMemberLoading, error: toMemberError, fetchMemberDetails: fetchToMemberDetails } = useGetMemberDetails();
  const { executeAccountTransfer, loading: transferLoading } = useTransferChainedAPIs();

  const [transactionType, setTransactionType] = useState('account');

  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [memberAccounts, setMemberAccounts] = useState([]);

  const [toCustomerCode, setToCustomerCode] = useState('');
  const [toCustomerName, setToCustomerName] = useState('');
  const [toMemberAccounts, setToMemberAccounts] = useState([]);

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

  const isMemberTransfer = transactionType === 'member';
  const toAccountsSource = isMemberTransfer ? toMemberAccounts : memberAccounts;

  const handleTransactionTypeChange = (e) => {
    const value = e.target.value;
    setTransactionType(value);
    // Reset recipient/destination fields when switching type
    setToCustomerCode('');
    setToCustomerName('');
    setToMemberAccounts([]);
    setToPostingAccount('');
    setToAccountNumber('');
    setToAccountBalance('');
  };

  const handleCustomerCodeChange = (e) => {
    setCustomerCode(e.target.value);
  };

  const handleCustomerCodeTab = async (e) => {
    if (e.key === 'Tab' && customerCode.trim()) {
      await handleSearch();
    }
  };

  const handleToCustomerCodeChange = (e) => {
    setToCustomerCode(e.target.value);
  };

  const handleToCustomerCodeTab = async (e) => {
    if (e.key === 'Tab' && toCustomerCode.trim()) {
      await handleSearchTo();
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
        const name = extractMemberName(details);

        // Extract member accounts from API response
        const accounts = Array.isArray(details.Accounts) ? details.Accounts : [];
        setMemberAccounts(accounts);
        setCustomerName(name);
        setStatusMessage('Customer details loaded successfully');
        setStatusError(false);
      } else if (memberError) {
        setStatusMessage(`Error: ${memberError}`);
        setStatusError(true);
        setCustomerName('');
        setMemberAccounts([]);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
      setCustomerName('');
      setMemberAccounts([]);
    }
  };

  const handleSearchTo = async () => {
    if (!toCustomerCode.trim()) {
      setStatusMessage('Please enter a recipient member code');
      setStatusError(true);
      return;
    }

    try {
      setStatusMessage('');
      setStatusError(false);
      const details = await fetchToMemberDetails(toCustomerCode.trim());

      if (details) {
        const name = extractMemberName(details);

        // Extract member accounts from API response
        const accounts = Array.isArray(details.Accounts) ? details.Accounts : [];
        setToMemberAccounts(accounts);
        setToCustomerName(name);
        setStatusMessage('Recipient member details loaded successfully');
        setStatusError(false);
      } else if (toMemberError) {
        setStatusMessage(`Error: ${toMemberError}`);
        setStatusError(true);
        setToCustomerName('');
        setToMemberAccounts([]);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusError(true);
      setToCustomerName('');
      setToMemberAccounts([]);
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
    if (isMemberTransfer && !toCustomerCode.trim()) {
      setStatusMessage('Please search for a recipient member.');
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
      if (transactionType === 'account') {
        // Account Transfer: Use chained API workflow
        // Get the selected From and To accounts
        const fromAccount = memberAccounts.find(acc => acc.AccountNumber === fromPostingAccount);
        const toAccount = toAccountsSource.find(acc => acc.AccountNumber === toPostingAccount);

        if (!fromAccount || !toAccount) {
          throw new Error('Invalid account selection');
        }

        // Build form data for withdrawal (from account)
        const withdrawalFormData = {
          accountNumber: fromAccountNumber,
          contraAccount: fromAccountNumber,
          controlAccount: '',
          withdrawalAmount: amount,
          transactionDate: transferDate ? transferDate.format('YYYY-MM-DD') : new Date().toISOString(),
          checkNumber: '',
          productId: fromAccount.ProductId || 5,
          selectedRegionId: '',
        };

        // Build form data for deposit/repayment (to account)
        const depositFormData = {
          accountNumber: toAccountNumber,
          contraAccount: toAccountNumber,
          controlAccount: '',
          depositAmount: amount,
          repaymentAmount: amount,
          transactionDate: transferDate ? transferDate.format('YYYY-MM-DD') : new Date().toISOString(),
          checkNumber: '',
          productId: toAccount.ProductId || 5,
          selectedRegionId: '',
          totalAccruedInterest: 0,
          paymentOption: 2, // cash
        };

        const result = await executeAccountTransfer({
          fromFormData: withdrawalFormData,
          toFormData: depositFormData,
          toAccountName: toAccount.AccountName,
          userId: user?.username || '',
          compId: user?.CompId || 30,
          branchId: user?.BranchId || 1,
        });

        if (!result || !result.success) {
          throw new Error(result?.message || 'Transfer failed');
        }

        setStatusMessage('Account transfer processed successfully.');
        setStatusError(false);
        notifySaveSuccess({
          page: 'Customer Administration / Transfer',
          action: 'Process Account Transfer',
          message: 'Account transfer processed successfully.',
        });

        // Clear form
        handleClear();
      } else {
        // Member Transfer: Use chained API workflow
        // Get the selected From and To accounts
        const fromAccount = memberAccounts.find(acc => acc.AccountNumber === fromPostingAccount);
        const toAccount = toMemberAccounts.find(acc => acc.AccountNumber === toPostingAccount);

        if (!fromAccount || !toAccount) {
          throw new Error('Invalid account selection');
        }

        // Build form data for withdrawal (from account)
        const withdrawalFormData = {
          accountNumber: fromAccountNumber,
          contraAccount: fromAccountNumber,
          controlAccount: '',
          withdrawalAmount: amount,
          transactionDate: transferDate ? transferDate.format('YYYY-MM-DD') : new Date().toISOString(),
          checkNumber: '',
          productId: fromAccount.ProductId || 5,
          selectedRegionId: '',
        };

        // Build form data for deposit/repayment (to account)
        const depositFormData = {
          accountNumber: toAccountNumber,
          contraAccount: toAccountNumber,
          controlAccount: '',
          depositAmount: amount,
          repaymentAmount: amount,
          transactionDate: transferDate ? transferDate.format('YYYY-MM-DD') : new Date().toISOString(),
          checkNumber: '',
          productId: toAccount.ProductId || 5,
          selectedRegionId: '',
          totalAccruedInterest: 0,
          paymentOption: 2, // cash
        };

        const result = await executeAccountTransfer({
          fromFormData: withdrawalFormData,
          toFormData: depositFormData,
          toAccountName: toAccount.AccountName,
          userId: user?.username || '',
          compId: user?.CompId || 30,
          branchId: user?.BranchId || 1,
        });

        if (!result || !result.success) {
          throw new Error(result?.message || 'Transfer failed');
        }

        setStatusMessage('Member transfer processed successfully.');
        setStatusError(false);
        notifySaveSuccess({
          page: 'Customer Administration / Transfer',
          action: 'Process Member Transfer',
          message: 'Member transfer processed successfully.',
        });

        // Clear form
        handleClear();
      }
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

  const handleFromAccountChange = (e) => {
    const accountNumber = e.target.value;
    setFromPostingAccount(accountNumber);
    // Find the selected account and auto-populate account number
    const selectedAccount = memberAccounts.find(acc => acc.AccountNumber === accountNumber);
    if (selectedAccount) {
      setFromAccountNumber(accountNumber);
    }
  };

  const handleToAccountChange = (e) => {
    const accountNumber = e.target.value;
    setToPostingAccount(accountNumber);
    // Find the selected account and auto-populate account number
    const selectedAccount = toAccountsSource.find(acc => acc.AccountNumber === accountNumber);
    if (selectedAccount) {
      setToAccountNumber(accountNumber);
    }
  };

  const handleClear = () => {
    setCustomerCode('');
    setCustomerName('');
    setMemberAccounts([]);
    setToCustomerCode('');
    setToCustomerName('');
    setToMemberAccounts([]);
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
            {isMemberTransfer
              ? 'Transfer funds from one member to another member'
              : 'Transfer funds between a member\'s own accounts'}
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

      {/* Transaction Type Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Transaction Type
          </Typography>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 0.5 }}>Select Transfer Type</FormLabel>
            <RadioGroup
              row
              value={transactionType}
              onChange={handleTransactionTypeChange}
            >
              <FormControlLabel value="account" control={<Radio size="small" />} label="Account Transfer" />
              <FormControlLabel value="member" control={<Radio size="small" />} label="Member Transfer" />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Search Cards Container */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mb: 3 }}>
        {/* Search Customer Card */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
              {isMemberTransfer ? 'Search Sender (From Member)' : 'Search Customer'}
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

        {/* Search Recipient Member Card (Member Transfer only) */}
        {isMemberTransfer && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Search Recipient (To Member)
              </Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Customer Code"
                    value={toCustomerCode}
                    onChange={handleToCustomerCodeChange}
                    onKeyDown={handleToCustomerCodeTab}
                    placeholder="Enter recipient customer code"
                    type="number"
                    helperText="Enter recipient customer code and press Tab or Search to load details"
                    FormHelperTextProps={{
                      sx: {
                        fontWeight: 600,
                        color: '#666',
                      },
                    }}
                    size="small"
                    sx={{ flex: 1 }}
                    disabled={toMemberLoading}
                  />
                  {toCustomerName && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, whiteSpace: 'nowrap', flex: 3 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Customer Name
                      </Typography>
                      <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                        {toCustomerName}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={toMemberLoading ? <CircularProgress size={18} /> : <SearchRoundedIcon />}
                    onClick={handleSearchTo}
                    disabled={toMemberLoading}
                    sx={{
                      backgroundColor: '#667eea',
                      '&:hover': { backgroundColor: '#5568d3' },
                      fontWeight: 600,
                      paddingX: 3,
                      boxShadow: 'none',
                      textTransform: 'none',
                    }}
                  >
                    {toMemberLoading ? 'Searching...' : 'Search'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

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
                    onChange={handleFromAccountChange}
                    disabled={isSaving || memberAccounts.length === 0}
                    size="small"
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {memberAccounts.map((account) => (
                      <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                        {account.AccountName} ({account.AccountNumber})
                      </MenuItem>
                    ))}
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
                    onChange={handleToAccountChange}
                    disabled={isSaving || toAccountsSource.length === 0}
                    size="small"
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {toAccountsSource.map((account) => (
                      <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                        {account.AccountName} ({account.AccountNumber})
                      </MenuItem>
                    ))}
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
          disabled={isSaving || transferLoading}
          startIcon={isSaving || transferLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SwapHorizRoundedIcon />}
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
        <Button
          variant="outlined"
          onClick={() => navigate('/member/account-enquiries')}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 'none',
            textTransform: 'none',
            color: '#667eea',
            borderColor: '#667eea',
            '&:hover': { borderColor: '#5568d3', backgroundColor: '#f0f3ff' },
          }}
        >
          Account Enquiries
        </Button>
      </Box>
    </Box>
  );
}

