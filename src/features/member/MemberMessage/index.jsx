import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useMemberMessage } from './hooks/useMemberMessage';

export default function MemberMessage() {
  const [customerCode, setCustomerCode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const { fetchMemberMessage, updateMemberMessage, loading, updating, error, updateError, data } = useMemberMessage();

  const handleSearch = async () => {
    if (!customerCode || customerCode.trim() === '') {
      setStatusMessage('Please enter a customer code.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    await fetchMemberMessage(customerCode);
    setHasSearched(true);
  };

  const handleClear = () => {
    setCustomerCode('');
    setHasSearched(false);
    setStatusMessage('');
    setStatusError(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUpdate = async () => {
    const result = await updateMemberMessage(data?.memberCode, data?.memberMessage);
    if (result) {
      setStatusMessage('Member message updated successfully!');
      setStatusError(false);
    } else {
      setStatusMessage(updateError || 'Failed to update member message');
      setStatusError(true);
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, minHeight: '100vh', bgcolor: '#f8f9fb' }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Member Message
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Search and manage member messages
        </Typography>
      </Box>

      {/* Compact Search Card */}
      <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'flex-end' }}>
            <TextField
              label="Customer Code"
              type="number"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g. 3 or 000003"
              variant="outlined"
              size="small"
              disabled={loading}
              sx={{
                minWidth: 150,
                '& .MuiInputLabel-root': { fontWeight: 600 },
              }}
            />

            <Button
              variant="contained"
              startIcon={<SearchRoundedIcon />}
              onClick={handleSearch}
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
              disabled={loading}
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
          </Stack>

          {statusMessage && (
            <Alert severity={statusError ? 'error' : 'success'} sx={{ mt: 2 }}>
              {statusMessage}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && hasSearched && !loading && (
        <Card sx={{ mb: 3, p: 2, backgroundColor: '#fee', borderLeft: '4px solid #ef4444' }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Card>
      )}

      {/* Message Display */}
      {data && !loading && hasSearched && (
        <>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Customer Code */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f0f4ff',
                    borderRadius: 1.5,
                    borderLeft: '4px solid #667eea',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Customer Code
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea', mt: 0.5 }}>
                    {data.memberCode}
                  </Typography>
                </Box>

                {/* Member Name */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f9f5ff',
                    borderRadius: 1.5,
                    borderLeft: '4px solid #8b5cf6',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Member Name
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {data.memberName || 'N/A'}
                  </Typography>
                </Box>

                {/* Member Message - BOLD */}
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: '#fef3c7',
                    borderRadius: 1.5,
                    borderLeft: '4px solid #f59e0b',
                    border: '1px solid #fcd34d',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 1 }}>
                    <MessageRoundedIcon sx={{ color: '#f59e0b', mt: 0.5, fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      Member Message
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: '#7c2d12',
                      fontSize: '1.1rem',
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      minHeight: 50,
                      mt: 1,
                    }}
                  >
                    {data.memberMessage || 'No message'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Update Button Below Card */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={handleUpdate}
              disabled={updating}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              {updating ? 'Updating...' : 'Update'}
            </Button>
          </Box>
        </>
      )}

      {/* Empty State */}
      {hasSearched && !loading && !data && !error && (
        <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fb' }}>
          <MessageRoundedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">
            No member message found for customer code: {customerCode}
          </Typography>
        </Card>
      )}
    </Box>
  );
}
