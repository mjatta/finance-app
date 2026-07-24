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
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useAccountDetails } from '../MemberClose/hooks/useAccountDetails';
import { useActivateAccount } from './hooks/useActivateAccount';

export default function AccountActivate() {
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { accountData, isLoading, error: fetchError, fetchAccountDetails } = useAccountDetails();
  const { activateAccount } = useActivateAccount();

  const handleSearchAccount = async () => {
    if (!accountNumber.trim()) {
      setStatusMessage('Please enter an account number.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    setHasSearched(true);

    await fetchAccountDetails(accountNumber);
  };

  // Update accountName when accountData is fetched
  React.useEffect(() => {
    if (accountData?.accountName) {
      setAccountName(accountData.accountName);
    }
  }, [accountData]);

  // Show error when fetch fails
  React.useEffect(() => {
    if (fetchError && hasSearched) {
      setStatusMessage(fetchError);
      setStatusError(true);
    }
  }, [fetchError, hasSearched]);

  const handleClear = () => {
    setAccountNumber('');
    setAccountName('');
    setStatusMessage('');
    setStatusError(false);
    setHasSearched(false);
  };

  const handleSave = async () => {
    if (!accountNumber.trim() || !accountName.trim()) {
      setStatusMessage('Please search for an account and fill in the account name.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const result = await activateAccount(accountNumber, accountName);

      if (!result.success) {
        throw new Error(result.error || 'Failed to activate account');
      }

      const successMsg = `Account ${accountNumber} activated successfully.`;
      setStatusMessage(successMsg);
      setStatusError(false);
      notifySaveSuccess({
        page: 'Member / Account Activate',
        action: 'Account Activate',
        message: successMsg,
      });

      // Clear form after successful save
      setTimeout(() => {
        handleClear();
      }, 2000);
    } catch (error) {
      console.error('Error activating account:', error);
      setStatusMessage('Failed to activate account: ' + error.message);
      setStatusError(true);
      notifySaveError({
        page: 'Member / Account Activate',
        action: 'Account Activate',
        message: 'Failed to activate account.',
        error,
      });
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
          Account Activate
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Activate accounts in the system
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Search Card */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Search Account
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchAccount()}
                disabled={isLoading}
                placeholder="e.g., ACC001"
                fullWidth
                size="small"
                helperText="Enter the account number to search"
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleSearchAccount}
                  disabled={isLoading || !accountNumber.trim()}
                  sx={{
                    backgroundColor: '#667eea',
                    '&:hover': { backgroundColor: '#5568d3' },
                    fontWeight: 600,
                    flex: 1,
                    textTransform: 'none',
                  }}
                >
                  {isLoading ? (
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

        {/* Account Details Card - Always visible */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Account Details
            </Typography>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
              {/* Account Name - Editable */}
              <TextField
                label="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isLoading || !accountData?.accountName}
                placeholder="Edit account name"
                fullWidth
                size="small"
                helperText="You can edit the account name here"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: accountData?.accountName ? '#f8f9fa' : '#fff',
                  },
                }}
              />

              {/* Account Balance */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Account Balance:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {accountData?.accountBalance || 'n/a'}
                  </Typography>
                )}
              </Box>

              {/* Customer Code */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Customer Code:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {accountData?.custCode || 'n/a'}
                  </Typography>
                )}
              </Box>
            </Box>
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

      {/* Save Button */}
      {accountData?.accountName && (
        <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !accountName.trim()}
            sx={{
              backgroundColor: '#667eea',
              '&:hover': { backgroundColor: '#5568d3' },
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
              '✓ Account Activate'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}
