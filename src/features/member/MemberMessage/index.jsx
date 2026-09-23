import React, { useState, useRef, useCallback } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useMemberMessage } from './hooks/useMemberMessage';
import { useSearchMembers } from '../../../hooks/useSearchMembers';

export default function MemberMessage() {
  const [customerCode, setCustomerCode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [editingMessage, setEditingMessage] = useState('');
  const { fetchMemberMessage, updateMemberMessage, loading, updating, error, updateError, data } = useMemberMessage();
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
      setCustomerCode(member.ccustcode.trim());
      setMemberSearchInput('');
      setMemberSearchOptions([]);
      setStatusMessage('');
      setStatusError(false);

      // Fetch member message
      const result = await fetchMemberMessage(member.ccustcode.trim());
      if (result) {
        setEditingMessage(result?.MemberMessage || '');
      }
      setHasSearched(true);
    },
    [fetchMemberMessage]
  );

  const handleSearch = async () => {
    if (!customerCode || customerCode.trim() === '') {
      setStatusMessage('Please enter a customer code.');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    const result = await fetchMemberMessage(customerCode);
    if (result) {
      setEditingMessage(result?.MemberMessage || '');
    }
    setHasSearched(true);
  };

  const handleClear = () => {
    setCustomerCode('');
    setMemberSearchInput('');
    setMemberSearchOptions([]);
    setHasSearched(false);
    setStatusMessage('');
    setStatusError(false);
    setEditingMessage('');
  };

  const handleUpdate = async () => {
    const result = await updateMemberMessage(data?.memberCode, editingMessage);
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

            <Box sx={{ display: 'flex', gap: 1 }}>
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
            </Box>
          </Box>

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

                {/* Member Message - EDITABLE */}
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
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                    placeholder="Enter member message here..."
                    variant="outlined"
                    size="small"
                    disabled={updating}
                    sx={{
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        fontWeight: 600,
                        color: '#7c2d12',
                      },
                      '& .MuiOutlinedInput-input': {
                        fontSize: '1rem',
                        lineHeight: 1.6,
                      },
                    }}
                  />
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
