import React, { useState, useRef, useCallback } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BalanceIcon from '@mui/icons-material/Balance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BadgeIcon from '@mui/icons-material/Badge';
import { useMemberDetails } from './hooks/useMemberDetails';
import { useConfirmMemberActivate } from './hooks/useConfirmMemberActivate';
import { useSearchMembers } from '../../../hooks/useSearchMembers';

export default function MemberActivate() {
  const [customerCode, setCustomerCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { memberData, loading: isLoading, error: fetchError, fetchMemberDetails } = useMemberDetails();
  const { confirmActivate } = useConfirmMemberActivate();
  const { searchMembers, loading: searchLoading } = useSearchMembers();
  const [memberSearchOptions, setMemberSearchOptions] = useState([]);
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const memberSearchDebounceRef = useRef(null);

  const handleMemberSearchInputChange = useCallback(
    (e, value) => {
      setMemberSearchInput(value);

      if (memberSearchDebounceRef.current) {
        clearTimeout(memberSearchDebounceRef.current);
      }

      if (!value || value.trim().length < 1) {
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

      // Set the customer code and clear search input
      const customerCodeValue = member.ccustcode.trim();
      setCustomerCode(customerCodeValue);
      setMemberSearchInput('');
      setMemberSearchOptions([]);
      setStatusMessage('');
      setStatusError(false);
      setHasSearched(true);

      // Fetch member details
      await fetchMemberDetails(customerCodeValue);
    },
    [fetchMemberDetails]
  );

  const handleSearchMember = async () => {
    if (!customerCode.trim()) {
      setStatusMessage('Please enter a customer code.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    setHasSearched(true);

    await fetchMemberDetails(customerCode);
  };

  // Show error when fetch fails
  React.useEffect(() => {
    if (fetchError && hasSearched) {
      setStatusMessage(fetchError);
      setStatusError(true);
    }
  }, [fetchError, hasSearched]);

  const handleClear = () => {
    setCustomerCode('');
    setMemberSearchInput('');
    setMemberSearchOptions([]);
    setStatusMessage('');
    setStatusError(false);
    setHasSearched(false);
  };

  const handleConfirmActivate = async () => {
    if (!customerCode.trim() || !memberData) {
      setStatusMessage('Please search and select a member first.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const result = await confirmActivate(customerCode);

      if (!result.success) {
        throw new Error(result.error || 'Failed to activate member');
      }

      const successMsg = `Member ${customerCode} activated successfully.`;
      setStatusMessage(successMsg);
      setStatusError(false);

      // Clear form fields immediately
      setCustomerCode('');
      setHasSearched(false);

      // Clear success message after 2 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error activating member:', error);
      setStatusMessage('Failed to activate member: ' + error.message);
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={3}>
      {/* Header Banner */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Member Activate
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Activate member accounts in the system
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Search Card */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Search Member
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

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  disabled={isLoading}
                  sx={{
                    fontWeight: 600,
                    paddingX: 2,
                    textTransform: 'none',
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Member Details Card - Always visible */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DashboardIcon sx={{ fontSize: 20 }} />
              Member Details
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: '1fr' }}>
                <Skeleton variant="rounded" width="100%" height={70} />
                <Skeleton variant="rounded" width="100%" height={70} />
                <Skeleton variant="rounded" width="100%" height={70} />
              </Box>
            ) : memberData && hasSearched ? (
              <Box sx={{ display: 'grid', gap: 2.5 }}>
                {/* Member Name */}
                <Box sx={{
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: 'white',
                  border: '1px solid #e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <PersonIcon sx={{ fontSize: 28, color: '#667eea' }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Member Name
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mt: 0.5 }}>
                      {memberData?.ccustname?.trim() || memberData?.fname || memberData?.firstName || 'n/a'}
                    </Typography>
                  </Box>
                </Box>

                {/* Account Number */}
                <Box sx={{
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: 'white',
                  border: '1px solid #f3e5f5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <BadgeIcon sx={{ fontSize: 28, color: '#9c27b0' }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Account Number
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mt: 0.5 }}>
                      {memberData?.cacctnumb || 'n/a'}
                    </Typography>
                  </Box>
                </Box>

                {/* Balance Summary - Three columns */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
                  {/* Savings Balance */}
                  <Box sx={{
                    p: 2,
                    borderRadius: 1.5,
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #bbdefb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalanceWalletIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#0d47a1', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Savings
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d47a1' }}>
                      {(memberData?.nsaveBal || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Share Balance */}
                  <Box sx={{
                    p: 2,
                    borderRadius: 1.5,
                    backgroundColor: '#f3e5f5',
                    border: '1px solid #e1bee7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoneyIcon sx={{ fontSize: 20, color: '#7b1fa2' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#4a148c', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Shares
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#4a148c' }}>
                      {(memberData?.nshareBal || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Loan Balance */}
                  <Box sx={{
                    p: 2,
                    borderRadius: 1.5,
                    backgroundColor: '#fff3e0',
                    border: '1px solid #ffe0b2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BalanceIcon sx={{ fontSize: 20, color: '#f57c00' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#e65100', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Loans
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#e65100' }}>
                      {(memberData?.nloanBal || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Total Balance Highlight */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)',
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Total Balance
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mt: 0.5 }}>
                      {(memberData?.TotalBalance || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: 1.5,
                border: '1px dashed #ccc',
              }}>
                <Typography variant="body2" color="text.secondary">
                  Search for a member to display details
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Status Message */}
      {statusMessage && (
        <Box sx={{ mt: 3 }}>
          <Alert
            severity={statusError ? 'error' : 'success'}
            onClose={() => setStatusMessage('')}
          >
            {statusMessage}
          </Alert>
        </Box>
      )}

      {/* Confirm Activate Button */}
      {memberData && (
        <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleConfirmActivate}
            disabled={isSaving || !memberData}
            sx={{
              backgroundColor: '#14b8a6',
              '&:hover': { backgroundColor: '#0d9488' },
              fontWeight: 600,
              paddingX: 3,
              boxShadow: 'none',
              textTransform: 'none',
            }}
          >
            {isSaving ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Activating...
              </>
            ) : (
              '✓ Confirm Activate'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}
