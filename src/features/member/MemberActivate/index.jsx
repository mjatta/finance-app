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

export default function MemberActivate() {
  const [accountNumber, setAccountNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { accountData, isLoading, error: fetchError, fetchAccountDetails } = useAccountDetails();

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

  // Show error when fetch fails
  React.useEffect(() => {
    if (fetchError && hasSearched) {
      setStatusMessage(fetchError);
      setStatusError(true);
    }
  }, [fetchError, hasSearched]);

  const handleClear = () => {
    setAccountNumber('');
    setStatusMessage('');
    setStatusError(false);
    setHasSearched(false);
  };

  const handleSave = async () => {
    if (!accountNumber.trim() || !accountData?.accountName) {
      setStatusMessage('Please search and select an account first.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const successMsg = `Account ${accountNumber} activated successfully.`;
      setStatusMessage(successMsg);
      setStatusError(false);
      notifySaveSuccess({
        page: 'Member / Member Activate',
        action: 'Member Activate',
        message: successMsg,
      });

      // Clear form after successful save
      setTimeout(() => {
        handleClear();
      }, 2000);
    } catch (error) {
      setStatusMessage('Failed to activate member.');
      setStatusError(true);
      notifySaveError({
        page: 'Member / Member Activate',
        action: 'Member Activate',
        message: 'Failed to activate member.',
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

            <Box sx={{ display: 'grid', gap: 2 }}>
              {/* Account Name */}
              {isLoading ? (
                <Skeleton variant="rectangular" height={40} />
              ) : (
                <TextField
                  label="Account Name"
                  value={accountData?.accountName || ''}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      fontWeight: 600,
                      color: '#2c3e50',
                    },
                  }}
                />
              )}

              {/* Account Balance */}
              {isLoading ? (
                <Skeleton variant="rectangular" height={40} />
              ) : (
                <TextField
                  label="Account Balance"
                  value={accountData?.accountBalance || ''}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      fontWeight: 600,
                      color: '#2c3e50',
                    },
                  }}
                />
              )}

              {/* Customer Code */}
              {isLoading ? (
                <Skeleton variant="rectangular" height={40} />
              ) : (
                accountData?.custCode && (
                  <TextField
                    label="Customer Code"
                    value={accountData.custCode}
                    InputProps={{ readOnly: true }}
                    disabled
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        fontWeight: 600,
                        color: '#2c3e50',
                      },
                    }}
                  />
                )
              )}
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
            disabled={isSaving || !accountData?.accountName}
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
              '✓ Member Activate'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}
