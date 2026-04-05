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
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useGetTransactions } from './hooks/useGetTransactions';

export default function AccountEnquiries({ user }) {
  const [searchMemberCode, setSearchMemberCode] = useState('');
  const [memberDetails, setMemberDetails] = useState(null);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [transactionError, setTransactionError] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
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
        valueFormatter: (value) => value ? parseFloat(value).toFixed(2) : '0.00',
      },
      {
        field: 'Credit',
        headerName: 'Credit',
        width: 130,
        valueFormatter: (value) => value ? parseFloat(value).toFixed(2) : '0.00',
      },
      {
        field: 'NewBalance',
        headerName: 'New Balance',
        width: 130,
        valueFormatter: (value) => value ? parseFloat(value).toFixed(2) : '-',
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
      }));
    }
    
    return [];
  }, [transactionData]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 3 }}>
        Account Enquiries
      </Typography>

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

              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SearchRoundedIcon />}
                onClick={handleSearch}
                disabled={loading || isReadOnly}
                sx={{ alignSelf: 'flex-start' }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Account Details Table - Full Width */}
        {memberDetails && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Member Account Details
                </Typography>
              </Box>
              <DataGrid
                rows={rows}
                columns={columns}
                checkboxSelection
                disableMultipleRowSelection
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
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Account Transactions - {selectedAccount}
              </Typography>
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
                rows={transactionRows}
                columns={transactionColumns}
                density="compact"
                pageSizeOptions={[10, 25, 50]}
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
