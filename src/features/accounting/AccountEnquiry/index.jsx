import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

export default function AccountEnquiry() {
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Placeholder columns for GL account data
  const columns = [
    { field: 'accountNumber', headerName: 'Account Number', width: 180 },
    { field: 'accountName', headerName: 'Account Name', flex: 1, minWidth: 200 },
    { field: 'accountType', headerName: 'Account Type', width: 150 },
    { field: 'balance', headerName: 'Balance', width: 150, valueFormatter: (v) => v?.value ? `D ${parseFloat(v.value).toFixed(2)}` : 'D 0.00' },
    { field: 'status', headerName: 'Status', width: 120 },
  ];

  // Filtered results by date (placeholder logic)
  const filteredResults = useMemo(() => {
    if (!fromDate && !toDate) return results;
    // If results had a date field, filter here. Placeholder for now.
    // Example: return results.filter(r => ...)
    return results;
  }, [results, fromDate, toDate]);

  // Placeholder search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearched(true);
    setResults([]);
    if (!accountNumber.trim()) {
      setError('Please enter an account number');
      return;
    }
    setLoading(true);
    // TODO: Replace with API call
    setTimeout(() => {
      setResults([
        {
          id: 1,
          accountNumber: accountNumber.trim(),
          accountName: 'Sample GL Account',
          accountType: 'GL',
          balance: 100000.0,
          status: 'Active',
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleClear = () => {
    setAccountNumber('');
    setResults([]);
    setError('');
    setSearched(false);
    setFromDate('');
    setToDate('');
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 3 }}>
        GL Account Enquiry
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, maxWidth: '75%' }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
              Search GL Account
            </Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 400 }}>
              <TextField
                label="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter GL account number"
                size="medium"
                fullWidth
                disabled={loading}
              />
              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchRoundedIcon />}
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
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600,
                    paddingX: 3,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#5568d3',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Results Table */}
        {searched && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
                GL Account Results
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  type="date"
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  size="small"
                  sx={{ width: 180 }}
                />
                <TextField
                  type="date"
                  label="To Date"
                  InputLabelProps={{ shrink: true }}
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  size="small"
                  sx={{ width: 180 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleClearFilter}
                  sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                  Clear Filter
                </Button>
              </Box>
              <div style={{ height: 320, width: '100%' }}>
                <DataGrid
                  rows={filteredResults}
                  columns={columns}
                  loading={loading}
                  density="compact"
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    borderRadius: 0,
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 700,
                      borderBottom: 'none',
                    },
                    '& .MuiDataGrid-row': {
                      '&:nth-of-type(odd)': {
                        backgroundColor: '#f8f9fa',
                      },
                      '&:hover': {
                        backgroundColor: '#e9ecef',
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
