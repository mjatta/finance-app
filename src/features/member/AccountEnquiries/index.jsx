import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import logo from '../../../assets/company-logo.jpg';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useGetTransactions } from './hooks/useGetTransactions';

const defaultProfileImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="130" viewBox="0 0 180 130"><rect width="180" height="130" fill="#f1f5f9"/><circle cx="90" cy="48" r="18" fill="#cbd5e1"/><rect x="52" y="76" width="76" height="30" rx="15" fill="#cbd5e1"/></svg>',
)}`;

const formatProfileImage = (imageData) => {
  if (!imageData) return defaultProfileImage;
  if (imageData.startsWith('data:')) return imageData;
  return `data:image/jpeg;base64,${imageData}`;
};

export default function AccountEnquiries({ user, title = 'Account Enquiries' }) {
  const [searchMemberCode, setSearchMemberCode] = useState('');
  const [memberDetails, setMemberDetails] = useState(null);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [transactionError, setTransactionError] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { fetchMemberDetails, loading } = useGetMemberDetails();
  const { fetchTransactions, loading: loadingTransactions } = useGetTransactions();

  const isReadOnly = user?.access?.readOnly || false;



  const handleRowClick = useCallback((params) => {
    // Toggle selection on row click
    console.log('Row clicked:', params.id);
    const accountId = params.id;
    
    if (selectedRows.includes(accountId)) {
      setSelectedRows([]);
    } else {
      setSelectedRows([accountId]);
    }
  }, [selectedRows]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchMemberCode.trim()) {
      setError('Please enter a member code');
      return;
    }

    setError('');
    setMemberDetails(null);
    setSelectedRows([]);
    setSelectedAccount(null);
    setTransactionData(null);

    try {
      const data = await fetchMemberDetails(searchMemberCode.trim());
      
      if (data) {
        setMemberDetails(data);
        setError('');
      } else {
        setError('Member not found');
        setMemberDetails(null);
      }
    } catch {
      setError('Failed to fetch member details');
      setMemberDetails(null);
    }
  };

  const handleClear = () => {
    setSearchMemberCode('');
    setMemberDetails(null);
    setError('');
    setSelectedRows([]);
    setSelectedAccount(null);
    setTransactionData(null);
  };

  // Effect to handle transaction fetching when a row is selected
  useEffect(() => {
    const fetchTransactionsForSelectedRow = async () => {
      console.log('Effect triggered. selectedRows:', selectedRows);
      
      if (!memberDetails || !memberDetails.Accounts || memberDetails.Accounts.length === 0) {
        console.log('No member details or accounts');
        return;
      }

      if (selectedRows.length === 0) {
        console.log('No rows selected');
        setSelectedAccount(null);
        setTransactionData(null);
        setTransactionError('');
        setFromDate('');
        setToDate('');
        return;
      }

      // Find the selected account
      const selectedRowId = selectedRows[0];
      console.log('Selected row ID:', selectedRowId);
      
      const accountIndex = parseInt(selectedRowId.split('-')[1]);
      console.log('Account index:', accountIndex);
      
      const selectedAccountData = memberDetails.Accounts[accountIndex];
      console.log('Selected account data:', selectedAccountData);

      if (selectedAccountData) {
        const accountNumber = selectedAccountData.AccountNumber;
        console.log('Fetching transactions for account:', accountNumber);
        
        setSelectedAccount(accountNumber);
        setTransactionData(null);
        setTransactionError('');

        try {
          const data = await fetchTransactions(accountNumber);
          console.log('Transaction data received:', data);
          
          if (data) {
            setTransactionData(data);
            setTransactionError('');
          } else {
            setTransactionError('No transactions found for this account');
            setTransactionData(null);
          }
        } catch (err) {
          console.error('Error fetching transactions:', err);
          setTransactionError('Failed to fetch transactions');
          setTransactionData(null);
        }
      }
    };

    fetchTransactionsForSelectedRow();
  }, [selectedRows, memberDetails, fetchTransactions]);

  const columns = useMemo(
    () => [
      {
        field: 'CustomerName',
        headerName: 'Customer Name',
        flex: 1,
        minWidth: 200,
        valueFormatter: (value) => value || '-',
      },
      {
        field: 'AccountType',
        headerName: 'Account Type',
        width: 150,
        valueFormatter: (value) => value || '-',
      },
      {
        field: 'AccountNumber',
        headerName: 'Account Number',
        width: 180,
        valueFormatter: (value) => value || '-',
      },
      {
        field: 'BookBalance',
        headerName: 'Account Balance',
        width: 150,
        valueFormatter: (value) => value ? `D ${parseFloat(value).toFixed(2)}` : 'D 0.00',
      },
      {
        field: 'ClearedBalance',
        headerName: 'Cleared Balance',
        width: 150,
        valueFormatter: (value) => value ? `D ${parseFloat(value).toFixed(2)}` : 'D 0.00',
      },
      {
        field: 'UnClearedBalance',
        headerName: 'UnCleared Balance',
        width: 150,
        valueFormatter: (value) => value ? `D ${parseFloat(value).toFixed(2)}` : 'D 0.00',
      },
    ],
    [],
  );

  const rows = useMemo(() => {
    if (!memberDetails || !memberDetails.Accounts || memberDetails.Accounts.length === 0) return [];
    
    return memberDetails.Accounts.map((account, index) => {
      const accountName = account.AccountName || '';
      const accountNumber = account.AccountNumber || '-';
      
      // Parse AccountName: "NDEY BADJIE <<Savings>> <<Regular Savings>> <<25000000101 >>"
      // Extract customer name and account type
      let customerName = '-';
      let accountType = '-';
      
      if (accountName) {
        // Extract text before first <<
        const parts = accountName.split('<<');
        customerName = parts[0].trim() || '-';
        
        // Extract first account type (between first << and >>)
        if (parts.length > 1) {
          const typeMatch = parts[1].split('>>')[0].trim();
          accountType = typeMatch || '-';
        }
      }
      
      return {
        id: `account-${index}`,
        CustomerName: customerName,
        AccountType: accountType,
        AccountNumber: accountNumber,
        BookBalance: account.BookBalance || 0,
        ClearedBalance: account.ClearedBalance || 0,
        UnClearedBalance: account.UnClearedBalance || 0,
      };
    });
  }, [memberDetails]);

  const transactionColumns = useMemo(
    () => [
      {
        field: 'PostDate',
        headerName: 'Post Date',
        width: 150,
        valueFormatter: (value) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleDateString();
        },
      },
      {
        field: 'ValueDate',
        headerName: 'Value Date',
        width: 150,
        valueFormatter: (value) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleDateString();
        },
      },
      {
        field: 'Description',
        headerName: 'Transaction Type',
        flex: 1,
        minWidth: 200,
        valueFormatter: (value) => value || '-',
      },
      {
        field: 'Debit',
        headerName: 'Debit',
        width: 130,
        valueFormatter: (value) => value ? `D ${parseFloat(value).toFixed(2)}` : 'D 0.00',
      },
      {
        field: 'Credit',
        headerName: 'Credit',
        width: 130,
        valueFormatter: (value) => value ? `D ${parseFloat(value).toFixed(2)}` : 'D 0.00',
      },
      {
        field: 'NewBalance',
        headerName: 'New Balance',
        width: 130,
        valueFormatter: (value) => value ? `D ${parseFloat(value).toFixed(2)}` : '-',
      },
      {
        field: 'UserId',
        headerName: 'User',
        width: 120,
        valueFormatter: (value) => value || '-',
      },
      {
        field: 'ChequeNo',
        headerName: 'Check/ Reference #',
        width: 150,
        valueFormatter: (value) => value || '-',
      },
    ],
    [],
  );

  const transactionRows = useMemo(() => {
    if (!transactionData) return [];
    
    // Handle if transactionData is an array of transactions
    if (Array.isArray(transactionData)) {
      return transactionData.map((transaction, index) => ({
        id: `transaction-${index}`,
        PostDate: transaction.PostDate || '-',
        ValueDate: transaction.ValueDate || '-',
        Description: transaction.Description || '-',
        Debit: transaction.Debit || 0,
        Credit: transaction.Credit || 0,
        NewBalance: transaction.NewBalance || '-',
        UserId: transaction.UserId || '-',
        ChequeNo: transaction.ChequeNo || '-',
      }));
    }
    
    // Handle if transactionData is an object with a transactions array
    if (transactionData.transactions && Array.isArray(transactionData.transactions)) {
      return transactionData.transactions.map((transaction, index) => ({
        id: `transaction-${index}`,
        PostDate: transaction.PostDate || '-',
        ValueDate: transaction.ValueDate || '-',
        Description: transaction.Description || '-',
        Debit: transaction.Debit || 0,
        Credit: transaction.Credit || 0,
        NewBalance: transaction.NewBalance || '-',
        UserId: transaction.UserId || '-',
        ChequeNo: transaction.ChequeNo || '-',
      }));
    }
    
    return [];
  }, [transactionData]);

  // Filter transactions based on date range
  const filteredTransactionRows = useMemo(() => {
    if (!transactionRows.length) return transactionRows;

    return transactionRows.filter((transaction) => {
      if (!fromDate && !toDate) return true;

      const transactionDate = new Date(transaction.PostDate);
      if (isNaN(transactionDate.getTime())) return true;

      if (fromDate) {
        const from = new Date(fromDate);
        if (transactionDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (transactionDate > to) return false;
      }

      return true;
    });
  }, [transactionRows, fromDate, toDate]);

  const handlePrintTransactions = useCallback(() => {
    if (!filteredTransactionRows || filteredTransactionRows.length === 0) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      return;
    }

    const now = new Date().toLocaleString();
    let transactionTableRows = '';
    
    filteredTransactionRows.forEach((row) => {
      transactionTableRows += `
        <tr class="main-row">
          <td>${row.PostDate || '-'}</td>
          <td>${row.ValueDate || '-'}</td>
          <td>${row.Description || '-'}</td>
          <td>${typeof row.Debit === 'number' ? row.Debit.toFixed(2) : row.Debit || '0.00'}</td>
          <td>${typeof row.Credit === 'number' ? row.Credit.toFixed(2) : row.Credit || '0.00'}</td>
          <td>${typeof row.NewBalance === 'number' ? row.NewBalance.toFixed(2) : row.NewBalance || '-'}</td>
          <td>${row.UserId || '-'}</td>
          <td>${row.ChequeNo || '-'}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <head>
          <title>Account Transactions Report</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Inter, Segoe UI, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #102a43;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-shell {
              border: 1px solid #d9e2ec;
              border-radius: 12px;
              overflow: visible;
            }
            .print-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #dbe7f3;
              padding: 14px 18px;
              background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
            }
            .brand-wrap { display: flex; align-items: center; gap: 12px; }
            .brand-logo {
              width: 56px;
              height: 56px;
              object-fit: cover;
              border-radius: 8px;
              border: 1px solid #dbe7f3;
            }
            .brand-name { font-size: 20px; font-weight: 800; color: #102a43; }
            .report-title { font-size: 18px; font-weight: 800; color: #0f4c81; }
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 18px;
              background: #f8fbff;
              border-bottom: 1px solid #e4edf5;
              font-size: 12px;
              color: #486581;
            }
            .account-info {
              padding: 10px 18px;
              background: #ffffff;
              border-bottom: 1px solid #e4edf5;
              font-size: 13px;
              color: #102a43;
            }
            .account-info strong {
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #d9e2ec;
              padding: 8px 6px;
              text-align: left;
              font-size: 12px;
              line-height: 1.25;
              white-space: normal;
              word-break: break-word;
            }
            th {
              background: #1f4f82;
              color: #ffffff;
              font-weight: 700;
              letter-spacing: 0.2px;
            }
            .main-row td {
              background: #ffffff;
            }
            .main-row:nth-of-type(odd) td {
              background: #fbfdff;
            }
            .footer {
              padding: 12px 18px;
              background: #f8fbff;
              border-top: 1px solid #e4edf5;
              text-align: center;
              font-size: 11px;
              color: #667eea;
              font-weight: 600;
            }
            .print-button-controls {
              text-align: center;
              margin-top: 20px;
              padding: 0 18px 18px 18px;
            }
            .print-button-controls button {
              padding: 10px 24px;
              margin: 0 5px;
              font-size: 14px;
              background-color: #667eea;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            }
            .print-button-controls button:hover {
              background-color: #5568d3;
            }
            .print-button-controls button.close-btn {
              background-color: #999;
            }
            .print-button-controls button.close-btn:hover {
              background-color: #777;
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            @media print {
              body { padding: 0; }
              .report-shell { border: none; border-radius: 0; }
              .print-button-controls { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-shell">
            <div class="print-header">
              <div class="brand-wrap">
                <img class="brand-logo" src="${logo}" alt="Company logo" />
                <div class="brand-name">Microfinance Management</div>
              </div>
              <div class="report-title">Account Transactions Report</div>
            </div>
            <div class="meta-row">
              <span>Generated: ${now}</span>
              <span>Total Records: ${filteredTransactionRows.length}</span>
            </div>
            <div class="account-info">
              <strong>Account Number:</strong> ${selectedAccount || '-'}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Post Date</th>
                  <th>Value Date</th>
                  <th>Transaction Type</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>New Balance</th>
                  <th>User</th>
                  <th>Check/Ref #</th>
                </tr>
              </thead>
              <tbody>
                ${transactionTableRows}
              </tbody>
            </table>
            <div class="footer">
              <p>This is an automated report. Please keep for your records.</p>
              <p>Account Transactions Report © 2024</p>
            </div>
            <div class="print-button-controls">
              <button onclick="window.print()">🖨️ Print</button>
              <button class="close-btn" onclick="window.close()">Close</button>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }, [filteredTransactionRows, selectedAccount]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Search customer accounts and review balances and transaction activity
        </Typography>
      </Box>

      {isReadOnly && (
        <Typography
          variant="body2"
          color="warning.main"
          sx={{ mb: 2, fontWeight: 700 }}
        >
          View-only mode: This page is read-only.
        </Typography>
      )}

      {/* Layout Container */}
      <Box sx={{ display: 'grid', gap: 3, maxWidth: '75%' }}>
        {/* Search + Contact Row */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {/* Search Card */}
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
                Search Account
              </Typography>

              <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 400 }}>
                <TextField
                  label="Member Code"
                  value={searchMemberCode}
                  onChange={(e) => setSearchMemberCode(e.target.value)}
                  placeholder="Enter member code"
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
                    disabled={loading || isReadOnly}
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
                    disabled={loading || isReadOnly}
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

          {/* Contact Card - Profile Picture & Signature */}
          {memberDetails && (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Contact
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center' }}>
                  {/* Profile Picture Column */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={formatProfileImage(memberDetails.Picture)}
                      alt="Member profile"
                      sx={{
                        width: 180,
                        height: 130,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        objectFit: 'cover',
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Member profile picture
                    </Typography>
                  </Box>
                  {/* Signature Column */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box
                      component="img"
                      src={formatProfileImage(memberDetails.Signature)}
                      alt="Member signature"
                      sx={{
                        width: 180,
                        height: 130,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        objectFit: 'contain',
                        backgroundColor: '#fff',
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Member Signature
                    </Typography>
                  </Box>
                </Box>
                
                {/* Phone Number Section */}
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 2, gridColumn: '1 / -1' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '120px' }}>
                      Phone:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {memberDetails.Telephone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Account Details Table - Full Width */}
        {memberDetails && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Customer Account Details
                </Typography>
              </Box>
              <DataGrid
                rows={rows}
                columns={columns}
                density="compact"
                pageSizeOptions={[10, 25, 50]}
                onRowClick={handleRowClick}
                getRowClassName={(params) => {
                  if (selectedRows.includes(params.id)) {
                    return 'selected-row';
                  }
                  return '';
                }}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                sx={{
                  '& .MuiDataGrid-root': {
                    border: 'none',
                    borderRadius: 0,
                  },
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
                    cursor: 'pointer',
                    '&.selected-row': {
                      backgroundColor: '#bbdefb',
                      fontWeight: 500,
                    },
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover': {
                      backgroundColor: '#e9ecef',
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Transactions Table - Full Width */}
      {selectedAccount && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  Account Transactions - {selectedAccount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TextField
                  type="date"
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  sx={{
                    width: 180,
                    '& .MuiOutlinedInput-root': {
                      color: 'primary.contrastText',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
                    },
                    '& .MuiOutlinedInput-input': { color: 'primary.contrastText' },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.7)', opacity: 1 },
                    '& label': { color: 'rgba(255, 255, 255, 0.7)' },
                  }}
                  size="small"
                />
                <TextField
                  type="date"
                  label="To Date"
                  InputLabelProps={{ shrink: true }}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  sx={{
                    width: 180,
                    '& .MuiOutlinedInput-root': {
                      color: 'primary.contrastText',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
                    },
                    '& .MuiOutlinedInput-input': { color: 'primary.contrastText' },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.7)', opacity: 1 },
                    '& label': { color: 'rgba(255, 255, 255, 0.7)' },
                  }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
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
                🖨️ Print
              </Button>
            </Box>
            {transactionError && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                  {transactionError}
                </Typography>
              </Box>
            )}
            {loadingTransactions && (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Loading transactions...</Typography>
              </Box>
            )}
            {transactionRows.length > 0 && (
              <DataGrid
                rows={filteredTransactionRows}
                columns={transactionColumns}
                density="compact"
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'PostDate', sort: 'desc' }] },
                }}
                sx={{
                  '& .MuiDataGrid-root': {
                    border: 'none',
                    borderRadius: 0,
                  },
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
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
