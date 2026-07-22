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

export default function MemberCloseAccount() {
  const [memberId, setMemberId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockMembers = {
        MEM001: { firstName: 'John', middleName: 'Kwame', lastName: 'Doe', savingBalance: '5000', shareBalance: '2000', loanBalance: '0' },
        MEM002: { firstName: 'Awa', middleName: 'Binta', lastName: 'Jallow', savingBalance: '8500', shareBalance: '3500', loanBalance: '1000' },
        MEM003: { firstName: 'Lamin', middleName: 'Ousman', lastName: 'Sanyang', savingBalance: '12000', shareBalance: '5000', loanBalance: '5000' },
        MEM004: { firstName: 'Fatou', middleName: 'Mariama', lastName: 'Camara', savingBalance: '3200', shareBalance: '1500', loanBalance: '0' },
      };

      const found = mockMembers[memberId.trim().toUpperCase()];

      if (found) {
        setFormData({
          firstName: found.firstName,
          middleName: found.middleName,
          lastName: found.lastName,
          savingBalance: found.savingBalance,
          shareBalance: found.shareBalance,
          loanBalance: found.loanBalance,
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
        setStatusMessage('Member ID not found.');
        setStatusError(true);
      }
    } catch {
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        savingBalance: '',
        shareBalance: '',
        loanBalance: '',
      });
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoading(false);
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
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!memberId.trim() || !formData.firstName.trim()) {
      setStatusMessage('Please search and select a member first.');
      setStatusError(true);
      return;
    }

    if (!formData.savingBalance.trim() || !formData.shareBalance.trim() || !formData.loanBalance.trim()) {
      setStatusMessage('Please fill in all balance fields.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
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
    } catch (error) {
      setStatusMessage('Failed to close member account.');
      setStatusError(true);
      notifySaveError({
        page: 'Member / Member Close Account',
        action: 'Member Close Account',
        message: 'Failed to close member account.',
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
                disabled={isLoading}
                placeholder="e.g., MEM001"
                fullWidth
                size="small"
                helperText="Enter the member ID to search"
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleSearchMember}
                  disabled={isLoading || !memberId.trim()}
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

        {/* Member Details Card - Always visible */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              Member Details
            </Typography>

            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              {/* Personal Information Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  First Name:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {formData.firstName || 'n/a'}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Middle Name:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {formData.middleName || 'n/a'}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Last Name:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {formData.lastName || 'n/a'}
                  </Typography>
                )}
              </Box>

              {/* Divider */}
              <Box sx={{ gridColumn: '1 / -1', my: 1, borderTop: '2px solid #f0f0f0' }} />

              {/* Balance Information Section */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea', mb: 2, fontSize: '0.9rem' }}>
                  Account Balances
                </Typography>
              </Box>

              {/* Saving Balance */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Saving Balance:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <TextField
                    name="savingBalance"
                    value={formData.savingBalance}
                    onChange={handleChange}
                    disabled={isLoading || !formData.firstName}
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f9ff',
                        '&:hover': {
                          backgroundColor: '#f0f2ff',
                        },
                      },
                    }}
                  />
                )}
              </Box>

              {/* Share Balance */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Share Balance:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <TextField
                    name="shareBalance"
                    value={formData.shareBalance}
                    onChange={handleChange}
                    disabled={isLoading || !formData.firstName}
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f9ff',
                        '&:hover': {
                          backgroundColor: '#f0f2ff',
                        },
                      },
                    }}
                  />
                )}
              </Box>

              {/* Loan Balance */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', minWidth: 120 }}>
                  Loan Balance:
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="100%" />
                ) : (
                  <TextField
                    name="loanBalance"
                    value={formData.loanBalance}
                    onChange={handleChange}
                    disabled={isLoading || !formData.firstName}
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f9ff',
                        '&:hover': {
                          backgroundColor: '#f0f2ff',
                        },
                      },
                    }}
                  />
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
      {formData.firstName && (
        <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !formData.firstName}
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
                Closing...
              </>
            ) : (
              '✓ Member Close Account'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}
