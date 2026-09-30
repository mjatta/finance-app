import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
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
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useTransferChainedAPIs, isLoanAccount } from './hooks/useTransferChainedAPIs';
import { useAuthStore } from '../../../store/authStore';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useSearchMembers } from '../../../hooks/useSearchMembers';

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
  const { searchMembers, loading: searchLoading } = useSearchMembers();
  const { searchMembers: searchToMembers, loading: searchToLoading } = useSearchMembers();

  const [transactionType, setTransactionType] = useState('account');

  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [memberAccounts, setMemberAccounts] = useState([]);
  const [memberSearchOptions, setMemberSearchOptions] = useState([]);
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const memberSearchDebounceRef = useRef(null);

  const [toCustomerCode, setToCustomerCode] = useState('');
  const [toCustomerName, setToCustomerName] = useState('');
  const [toMemberAccounts, setToMemberAccounts] = useState([]);
  const [toMemberSearchOptions, setToMemberSearchOptions] = useState([]);
  const [toMemberSearchInput, setToMemberSearchInput] = useState('');
  const toMemberSearchDebounceRef = useRef(null);

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

  const handleMemberSearchInputChange = useCallback(
    (e, value) => {
      setMemberSearchInput(value);

      if (memberSearchDebounceRef.current) {
        clearTimeout(memberSearchDebounceRef.current);
      }

      // Don't search if value is empty or if it looks like a formatted option (contains " - Code:")
      if (!value || value.trim().length < 1 || value.includes(' - Code:')) {
        setMemberSearchOptions([]);
        return;
      }

      memberSearchDebounceRef.current = setTimeout(async () => {
        const result = await searchMembers(value);
        if (result.success && result.data) {
          setMemberSearchOptions(result.data);
        } else {
          setMemberSearchOptions([]);
        }
      }, 400);
    },
    [searchMembers]
  );

  const handleMemberSelect = useCallback(
    async (member) => {
      if (!member || !member.ccustcode) return;

      const customerCodeValue = member.ccustcode.trim();
      setCustomerCode(customerCodeValue);
      setMemberSearchInput('');
      setMemberSearchOptions([]);
      setStatusMessage('');
      setStatusError(false);

      try {
        const details = await fetchMemberDetails(customerCodeValue);

        if (details) {
          const name = extractMemberName(details);
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
    },
    [fetchMemberDetails, memberError]
  );

  const handleToMemberSearchInputChange = useCallback(
    (e, value) => {
      setToMemberSearchInput(value);

      if (toMemberSearchDebounceRef.current) {
        clearTimeout(toMemberSearchDebounceRef.current);
      }

      // Don't search if value is empty or if it looks like a formatted option (contains " - Code:")
      if (!value || value.trim().length < 1 || value.includes(' - Code:')) {
        setToMemberSearchOptions([]);
        return;
      }

      toMemberSearchDebounceRef.current = setTimeout(async () => {
        const result = await searchToMembers(value);
        if (result.success && result.data) {
          setToMemberSearchOptions(result.data);
        } else {
          setToMemberSearchOptions([]);
        }
      }, 400);
    },
    [searchToMembers]
  );

  const handleToMemberSelect = useCallback(
    async (member) => {
      if (!member || !member.ccustcode) return;

      const toCustomerCodeValue = member.ccustcode.trim();
      setToCustomerCode(toCustomerCodeValue);
      setToMemberSearchInput('');
      setToMemberSearchOptions([]);
      setStatusMessage('');
      setStatusError(false);

      try {
        const details = await fetchToMemberDetails(toCustomerCodeValue);

        if (details) {
          const name = extractMemberName(details);
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
    },
    [fetchToMemberDetails, toMemberError]
  );

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
    setToMemberSearchInput('');
    setToMemberSearchOptions([]);
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
    setMemberSearchInput('');
    setMemberSearchOptions([]);
    setToCustomerCode('');
    setToCustomerName('');
    setToMemberAccounts([]);
    setToMemberSearchInput('');
    setToMemberSearchOptions([]);
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
              <Autocomplete
                options={memberSearchOptions}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  const name = (option.ccustname || '').trim();
                  const code = (option.ccustcode || '').trim();
                  const street = (option.cstreet || '').trim();
                  const phone = (option.ctel || '').trim();
                  return `${name} - Code: ${code}${street ? ' - ' + street : ''}${phone ? ' - Phone: ' + phone : ''}`;
                }}
                isOptionEqualToValue={(option, value) => option.ccustcode === value.ccustcode}
                inputValue={memberSearchInput}
                onInputChange={handleMemberSearchInputChange}
                onChange={(e, value) => handleMemberSelect(value)}
                loading={searchLoading}
                noOptionsText="No members found"
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Find Customer"
                    placeholder="Search by name or code"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1 }}>
                            <PersonIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                    helperText="Enter customer name or code to search"
                  />
                )}
                renderOption={(props, option) => {
                  if (!option) return null;
                  const name = String(option.ccustname || '').trim();
                  const code = String(option.ccustcode || '').trim();
                  const street = String(option.cstreet || '').trim();
                  const phone = String(option.ctel || '').trim();
                  return (
                    <li {...props} key={`member-${code}`} style={{ padding: 0, width: '100%', display: 'block' }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderBottom: '1px solid #e8e8e8',
                          '&:hover': { backgroundColor: '#e3f2fd' },
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1.5,
                          width: '100%',
                          overflow: 'hidden',
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1, minWidth: 0 }}>
                          <PersonIcon sx={{ color: '#1976d2', fontSize: '1.2rem', flexShrink: 0 }} />
                          <Box sx={{ flex: 1, display: 'flex', gap: 1.2, alignItems: 'center', minWidth: 0 }}>
                            <Box sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1976d2', minWidth: '140px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </Box>
                            <Box sx={{ fontSize: '0.85rem', color: '#555', display: 'flex', gap: 0.5, minWidth: '90px', flexShrink: 0 }}>
                              <span style={{ color: '#999', fontWeight: 500 }}>Code:</span>
                              <strong>{code}</strong>
                            </Box>
                            <Box sx={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: 0.75, alignItems: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ flexShrink: 0 }}>{street || '—'}</span>
                              <span style={{ color: '#999', fontWeight: 500, flexShrink: 0 }}>|</span>
                              <span style={{ color: '#999', fontWeight: 500, flexShrink: 0 }}>Phone:</span>
                              <span style={{ flexShrink: 0 }}>{phone || '—'}</span>
                            </Box>
                          </Box>
                        </Box>
                        <ChevronRightIcon sx={{ color: '#1976d2', fontSize: '1.4rem', flexShrink: 0 }} />
                      </Box>
                    </li>
                  );
                }}
              />

              {customerName && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, whiteSpace: 'nowrap', backgroundColor: '#f5f9ff', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Customer Name
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                    {customerName}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
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
                <Autocomplete
                  options={toMemberSearchOptions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    const name = (option.ccustname || '').trim();
                    const code = (option.ccustcode || '').trim();
                    const street = (option.cstreet || '').trim();
                    const phone = (option.ctel || '').trim();
                    return `${name} - Code: ${code}${street ? ' - ' + street : ''}${phone ? ' - Phone: ' + phone : ''}`;
                  }}
                  isOptionEqualToValue={(option, value) => option.ccustcode === value.ccustcode}
                  inputValue={toMemberSearchInput}
                  onInputChange={handleToMemberSearchInputChange}
                  onChange={(e, value) => handleToMemberSelect(value)}
                  loading={searchToLoading}
                  noOptionsText="No members found"
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Find Recipient"
                      placeholder="Search by name or code"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start" sx={{ mr: 1 }}>
                              <PersonIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {searchToLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                      helperText="Enter recipient name or code to search"
                    />
                  )}
                  renderOption={(props, option) => {
                    if (!option) return null;
                    const name = String(option.ccustname || '').trim();
                    const code = String(option.ccustcode || '').trim();
                    const street = String(option.cstreet || '').trim();
                    const phone = String(option.ctel || '').trim();
                    return (
                      <li {...props} key={`member-${code}`} style={{ padding: 0, width: '100%', display: 'block' }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderBottom: '1px solid #e8e8e8',
                            '&:hover': { backgroundColor: '#e3f2fd' },
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1.5,
                            width: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <PersonIcon sx={{ color: '#1976d2', fontSize: '1.2rem', flexShrink: 0 }} />
                            <Box sx={{ flex: 1, display: 'flex', gap: 1.2, alignItems: 'center', minWidth: 0 }}>
                              <Box sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1976d2', minWidth: '140px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {name}
                              </Box>
                              <Box sx={{ fontSize: '0.85rem', color: '#555', display: 'flex', gap: 0.5, minWidth: '90px', flexShrink: 0 }}>
                                <span style={{ color: '#999', fontWeight: 500 }}>Code:</span>
                                <strong>{code}</strong>
                              </Box>
                              <Box sx={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: 0.75, alignItems: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span style={{ flexShrink: 0 }}>{street || '—'}</span>
                                <span style={{ color: '#999', fontWeight: 500, flexShrink: 0 }}>|</span>
                                <span style={{ color: '#999', fontWeight: 500, flexShrink: 0 }}>Phone:</span>
                                <span style={{ flexShrink: 0 }}>{phone || '—'}</span>
                              </Box>
                            </Box>
                          </Box>
                          <ChevronRightIcon sx={{ color: '#1976d2', fontSize: '1.4rem', flexShrink: 0 }} />
                        </Box>
                      </li>
                    );
                  }}
                />

                {toCustomerName && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, whiteSpace: 'nowrap', backgroundColor: '#f5f9ff', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Recipient Name
                    </Typography>
                    <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                      {toCustomerName}
                    </Typography>
                  </Box>
                )}
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

