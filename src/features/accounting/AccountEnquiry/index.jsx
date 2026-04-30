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
import { useGetGLTransactions } from './hooks/useGetGLTransactions';
import { glTransactionsTableColumns } from './hooks/glTransactionsTableColumns';

export default function AccountEnquiry() {
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { transactions, loading: transactionsLoading, error: transactionsError, fetchGLTransactions } = useGetGLTransactions();

  // Filtered results by date
  const filteredResults = useMemo(() => {
    if (!fromDate && !toDate) return transactions;
    return transactions.filter(row => {
      const postDate = row.PostDate ? new Date(row.PostDate) : null;
      if (!postDate) return false;
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      if (from && postDate < from) return false;
      if (to && postDate > to) return false;
      return true;
    });
  }, [transactions, fromDate, toDate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearched(true);
    if (!accountNumber.trim()) return;
    await fetchGLTransactions(accountNumber.trim());
  };

  const handleClear = () => {
    setAccountNumber('');
    setSearched(false);
    setFromDate('');
    setToDate('');
    fetchGLTransactions(''); // clear results
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
                GL Transactions
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
              <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={filteredResults.map((row, idx) => ({ id: idx + 1, ...row }))}
                  columns={glTransactionsTableColumns}
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
