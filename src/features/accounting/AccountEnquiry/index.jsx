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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useGetGLTransactions } from './hooks/useGetGLTransactions';

export default function AccountEnquiry() {
  const [accountNumber, setAccountNumber] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { transactions, loading, error, fetchGLTransactions } = useGetGLTransactions();

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
    if (!accountNumber.trim()) return;
    await fetchGLTransactions(accountNumber.trim());
  };

  const handleClear = () => {
    setAccountNumber('');
    setFromDate('');
    setToDate('');
    fetchGLTransactions(''); // clear results
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const handlePrintTransactions = () => {
    const rows = Array.isArray(filteredResults) ? filteredResults : [];
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;

    const tableRows = rows.map((row) => `
      <tr>
        <td>${row.PostDate ? dayjs(row.PostDate).format('DD-MM-YYYY') : ''}</td>
        <td>${row.ValueDate ? dayjs(row.ValueDate).format('DD-MM-YYYY') : ''}</td>
        <td>${row.Debit ?? ''}</td>
        <td>${row.Credit ?? ''}</td>
        <td>${row.NewBalance ?? ''}</td>
        <td>${row.Description ?? ''}</td>
        <td>${row.ChequeNo ?? ''}</td>
        <td>${row.UserId ?? ''}</td>
        <td>${row.VoucherNo ?? ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>GL Transactions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            p { margin: 0 0 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; }
            .meta { margin-top: 8px; color: #475569; }
          </style>
        </head>
        <body>
          <h1>GL Transactions Report</h1>
          <p class="meta">Account Number: ${accountNumber || '-'}</p>
          <p class="meta">From: ${fromDate || '-'} | To: ${toDate || '-'}</p>
          <p class="meta">Generated: ${dayjs().format('DD-MM-YYYY HH:mm:ss')}</p>
          <table>
            <thead>
              <tr>
                <th>Post Date</th>
                <th>Value Date</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>New Balance</th>
                <th>Description</th>
                <th>Cheque No</th>
                <th>User ID</th>
                <th>Voucher No</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="9">No transactions found.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            GL Account Enquiry
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Search and review general ledger transactions
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>
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
                type="number"
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

        {/* Results Table - always show for better UX and debugging */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  GL Transactions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <DatePicker
                label="From Date"
                value={fromDate ? dayjs(fromDate) : null}
                onChange={date => setFromDate(date ? date.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        color: 'primary.contrastText',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
                      },
                      '& .MuiOutlinedInput-input': { color: 'primary.contrastText' },
                      '& label': { color: 'rgba(255, 255, 255, 0.8)' },
                      '& .MuiSvgIcon-root': { color: 'primary.contrastText' },
                    },
                  },
                }}
              />
              <DatePicker
                label="To Date"
                value={toDate ? dayjs(toDate) : null}
                onChange={date => setToDate(date ? date.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        color: 'primary.contrastText',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
                      },
                      '& .MuiOutlinedInput-input': { color: 'primary.contrastText' },
                      '& label': { color: 'rgba(255, 255, 255, 0.8)' },
                      '& .MuiSvgIcon-root': { color: 'primary.contrastText' },
                    },
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={handleClearFilter}
                sx={{
                  color: 'primary.contrastText',
                  borderColor: 'primary.contrastText',
                  '&:hover': {
                    borderColor: 'primary.contrastText',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Clear Filter
              </Button>
              </Box>
              <Button
                variant="outlined"
                onClick={handlePrintTransactions}
                disabled={!Array.isArray(filteredResults) || filteredResults.length === 0}
                sx={{
                  color: 'primary.contrastText',
                  borderColor: 'primary.contrastText',
                  '&:hover': {
                    borderColor: 'primary.contrastText',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Print
              </Button>
            </Box>
            <Box>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={Array.isArray(filteredResults)
                  ? filteredResults.map((row, idx) => ({ id: idx + 1, ...row }))
                  : []}
                columns={debugColumns}
                loading={loading}
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                pageSize={10}
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
                getRowId={(row) => row.id}
              />
            </div>
            {Array.isArray(filteredResults) && filteredResults.length === 0 && !loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, px: 2, pb: 2 }}>
                No results found.
              </Typography>
            )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

// DEBUG: Show all fields as columns for troubleshooting
const debugColumns = [
  { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 50 },
  {
    field: 'PostDate',
    headerName: 'Post Date',
    flex: 0.9,
    minWidth: 120,
    valueGetter: (value) => (value ? dayjs(value).format('DD-MM-YYYY') : ''),
  },
  {
    field: 'ValueDate',
    headerName: 'Value Date',
    flex: 0.9,
    minWidth: 120,
    valueGetter: (value) => (value ? dayjs(value).format('DD-MM-YYYY') : ''),
  },
  { field: 'Debit', headerName: 'Debit', flex: 0.8, minWidth: 100 },
  { field: 'Credit', headerName: 'Credit', flex: 0.8, minWidth: 100 },
  { field: 'NewBalance', headerName: 'New Balance', flex: 0.9, minWidth: 120 },
  { field: 'Description', headerName: 'Description', flex: 1.4, minWidth: 200 },
  { field: 'ChequeNo', headerName: 'Cheque No', flex: 0.9, minWidth: 120 },
  { field: 'UserId', headerName: 'User ID', flex: 0.8, minWidth: 100 },
  { field: 'VoucherNo', headerName: 'Voucher No', flex: 1, minWidth: 140 },
];
