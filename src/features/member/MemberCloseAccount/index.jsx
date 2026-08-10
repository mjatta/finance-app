import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BalanceIcon from '@mui/icons-material/Balance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BadgeIcon from '@mui/icons-material/Badge';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useMemberCloseAccount } from './hooks/useMemberCloseAccount';

export default function MemberCloseAccount() {
  const { fetchMemberDetails, closeMemberAccount, loading, closing, error, closeError } = useMemberCloseAccount();
  const [memberId, setMemberId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [balanceWarning, setBalanceWarning] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    savingBalance: '',
    shareBalance: '',
    loanBalance: '',
  });

  const handleSearchMember = async () => {
    if (!memberId.trim()) {
      setStatusMessage('Please enter a member ID.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    setHasSearched(true);
    setBalanceWarning('');

    const result = await fetchMemberDetails(memberId.trim());
    if (result) {
      // Handle if result is an array (take first item)
      const data = Array.isArray(result) ? result[0] : result;
      
      // Check if individual name fields are empty/whitespace
      const fname = (data.ccustfname || '').trim();
      const mname = (data.ccustmname || '').trim();
      const lname = (data.ccustlname || '').trim();
      
      let firstName, middleName, lastName;
      
      // If individual fields are empty, parse ccustname
      if (!fname && !mname && !lname) {
        const fullName = (data.ccustname || '').trim();
        const nameParts = fullName.split(' ').filter(part => part);
        firstName = nameParts[0] || 'Member';
        middleName = nameParts[1] || '';
        lastName = nameParts[2] || '';
      } else {
        // Use individual fields
        firstName = fname || 'Member';
        middleName = mname || '';
        lastName = lname || '';
      }
      
      const saveBal = parseFloat(data.nsaveBal || 0);
      const shareBal = parseFloat(data.nshareBal || 0);
      const loanBal = parseFloat(data.nloanBal || 0);
      
      // Check if any balance is greater than 1
      if (saveBal > 1 || shareBal > 1 || loanBal > 1) {
        const balances = [];
        if (saveBal > 1) balances.push(`Savings: ${saveBal.toLocaleString()}`);
        if (shareBal > 1) balances.push(`Shares: ${shareBal.toLocaleString()}`);
        if (loanBal > 1) balances.push(`Loans: ${loanBal.toLocaleString()}`);
        setBalanceWarning(`Cannot close account with outstanding balance. ${balances.join(', ')}`);
      }
      
      setFormData({
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        savingBalance: saveBal.toString(),
        shareBalance: shareBal.toString(),
        loanBalance: loanBal.toString(),
      });
      
      setStatusMessage('Member details loaded successfully.');
      setStatusError(false);
    } else {
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        savingBalance: '',
        shareBalance: '',
        loanBalance: '',
      });
      setBalanceWarning('');
      setStatusMessage(error || 'Member ID not found.');
      setStatusError(true);
    }
  };

  const handleClear = () => {
    setMemberId('');
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      savingBalance: '',
      shareBalance: '',
      loanBalance: '',
    });
    setStatusMessage('');
    setStatusError(false);
    setHasSearched(false);
    setBalanceWarning('');
  };


  const handleSave = async () => {
    if (!memberId.trim() || !formData.firstName.trim()) {
      setStatusMessage('Please search and select a member first.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);

    const success = await closeMemberAccount(memberId.trim());

    if (success) {
      setStatusMessage(`Member ${memberId} account closed successfully.`);
      setStatusError(false);
      notifySaveSuccess({
        page: 'Member / Member Close Account',
        action: 'Member Close Account',
        message: `Member ${memberId} account closed successfully.`,
      });

      setTimeout(() => {
        handleClear();
      }, 2000);
    } else {
      setStatusMessage(closeError || 'Failed to close member account.');
      setStatusError(true);
      notifySaveError({
        page: 'Member / Member Close Account',
        action: 'Member Close Account',
        message: closeError || 'Failed to close member account.',
        error: new Error(closeError),
      });
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
          Member Close Account
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Close member accounts in the system
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
              <TextField
                label="Member ID"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchMember()}
                disabled={loading}
                placeholder="e.g., 000003"
                type="number"
                fullWidth
                size="small"
                helperText="Enter the customer code to search"
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleSearchMember}
                  disabled={loading || !memberId.trim()}
                  sx={{
                    backgroundColor: '#667eea',
                    '&:hover': { backgroundColor: '#5568d3' },
                    fontWeight: 600,
                    flex: 1,
                    textTransform: 'none',
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  disabled={loading}
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

            {loading ? (
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: '1fr' }}>
                <Skeleton variant="rounded" width="100%" height={70} />
                <Skeleton variant="rounded" width="100%" height={70} />
                <Skeleton variant="rounded" width="100%" height={70} />
              </Box>
            ) : formData.firstName && hasSearched ? (
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
                      {formData.firstName} {formData.middleName} {formData.lastName}
                    </Typography>
                  </Box>
                </Box>

                {/* Customer Code */}
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
                      Customer Code
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mt: 0.5 }}>
                      {memberId || 'n/a'}
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
                      {(parseFloat(formData.savingBalance) || 0).toLocaleString()}
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
                      {(parseFloat(formData.shareBalance) || 0).toLocaleString()}
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
                      {(parseFloat(formData.loanBalance) || 0).toLocaleString()}
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
                      {(parseFloat(formData.savingBalance || 0) + parseFloat(formData.shareBalance || 0) + parseFloat(formData.loanBalance || 0)).toLocaleString()}
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

      {/* Balance Warning */}
      {balanceWarning && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="warning" onClose={() => setBalanceWarning('')}>
            {balanceWarning}
          </Alert>
        </Box>
      )}

      {/* Close Account Button */}
      <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={closing || !formData.firstName || !!balanceWarning}
          sx={{
            backgroundColor: '#667eea',
            '&:hover': { backgroundColor: '#5568d3' },
            '&:disabled': { backgroundColor: '#ccc', cursor: 'not-allowed' },
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 'none',
            textTransform: 'none',
          }}
        >
          {closing ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Closing...
            </>
          ) : (
            '✓ Close Account'
          )}
        </Button>
      </Box>
    </Box>
  );
}
