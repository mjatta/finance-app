import React, { useMemo, useState } from 'react';
import { Box, Card, CardContent, MenuItem, TextField, Typography, Alert, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useGetMemberTransactions } from './hooks/useGetMemberTransactions';
import { useSaveTransaction } from './hooks/useSaveTransaction';
import { useMemberDetails } from '../../../hooks/useMemberDetails';

const TRANSACTION_TYPES = [
  { value: 'reversal', label: 'Transaction Reversal' },
  { value: 'adjustment', label: 'Transaction Adjustment' },
];

const ADJUST_BY_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'voucher', label: 'Voucher' },
];

const trimStr = (v) => (typeof v === 'string' ? v.trim() : v);
const formatDate = (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '');
const formatAmount = (v) => (typeof v === 'number' ? v.toFixed(2) : v);

export default function TransactionReversalAdjustment() {
  const [transactionType, setTransactionType] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => dayjs());
  const [adjustBy, setAdjustBy] = useState('customer');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [selectionModel, setSelectionModel] = useState({ type: 'include', ids: new Set() });
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [displayTransactions, setDisplayTransactions] = useState([]);

  const { transactions, loading, error, fetchMemberTransactions } = useGetMemberTransactions();
  const { saveTransaction, loading: savingTransaction, error: saveError } = useSaveTransaction();
  const { fetchMemberDetails } = useMemberDetails();

  // Update display transactions when hook transactions change
  React.useEffect(() => {
    if (transactions && transactions.length > 0) {
      setDisplayTransactions(transactions);
    }
  }, [transactions]);

  const handleCustomerCodeTab = async (e) => {
    if (e.key === 'Tab' && customerCode.trim()) {
      const paddedCode = String(customerCode.trim()).padStart(6, '0');
      
      // Fetch customer name
      const result = await fetchMemberDetails(paddedCode);
      if (result?.success && result?.data) {
        const name = result.data.membname || result.data.customerName || result.data.name || '';
        setCustomerName(name);
      }

      // Fetch transactions if transaction type is selected
      if (transactionType) {
        setStatusMessage('');
        setStatusError(false);
        setSelectionModel({ type: 'include', ids: new Set() });
        const isReversal = transactionType === 'reversal';
        const txnResult = await fetchMemberTransactions(paddedCode, isReversal);
        if (txnResult && txnResult.length > 0) {
          setDisplayTransactions(txnResult);
        } else {
          setStatusMessage('No transactions found for this customer');
          setStatusError(true);
          setDisplayTransactions([]);
        }
      }
    }
  };

  const handleTransactionTypeBlur = async () => {
    if (transactionType && customerCode.trim()) {
      setStatusMessage('');
      setStatusError(false);
      setSelectionModel({ type: 'include', ids: new Set() });
      const paddedCode = String(customerCode.trim()).padStart(6, '0');
      const isReversal = transactionType === 'reversal';
      const result = await fetchMemberTransactions(paddedCode, isReversal);
      if (result && result.length > 0) {
        setDisplayTransactions(result);
      } else {
        setStatusMessage('No transactions found for this customer');
        setStatusError(true);
        setDisplayTransactions([]);
      }
    }
  };

  const handleSaveTransaction = async () => {
    if (!transactionType) {
      setStatusMessage('Please select a transaction type');
      setStatusError(true);
      return;
    }

    if (!customerCode.trim()) {
      setStatusMessage('Please enter a customer code');
      setStatusError(true);
      return;
    }

    if (selectionModel.ids.size === 0) {
      setStatusMessage('Please select at least one transaction');
      setStatusError(true);
      return;
    }

    // Get selected rows from displayTransactions
    const selectedRows = displayTransactions.filter((row) => selectionModel.ids.has(row.itemid));

    setStatusMessage('');
    setStatusError(false);

    const result = await saveTransaction({
      transactionType,
      customerCode: String(customerCode).padStart(6, '0'),
      transactionDate,
      selectedTransactions: selectedRows,
    });

    if (result) {
      setStatusMessage(`${transactionType === 'reversal' ? 'Reversal' : 'Adjustment'} saved successfully!`);
      setStatusError(false);
      // Reset form after successful save
      setSelectionModel({ type: 'include', ids: new Set() });
    } else {
      setStatusMessage(saveError || `Failed to save ${transactionType}`);
      setStatusError(true);
    }
  };

  const columns = useMemo(() => ([
    { field: 'cacctnumb', headerName: 'Account Number', width: 160, valueGetter: (value) => trimStr(value) },
    { field: 'ccustcode', headerName: 'Customer Code', width: 140, valueGetter: (value) => trimStr(value) },
    { field: 'dtrandate', headerName: 'Transaction Date', width: 160, valueGetter: (value) => formatDate(value) },
    { field: 'ctrandesc', headerName: 'Description', width: 220, valueGetter: (value) => trimStr(value) },
    { field: 'ndebit', headerName: 'Debit', width: 130, type: 'number', valueGetter: (value) => formatAmount(value) },
    { field: 'ncredit', headerName: 'Credit', width: 130, type: 'number', valueGetter: (value) => formatAmount(value) },
    { field: 'cuserid', headerName: 'User ID', width: 120, valueGetter: (value) => trimStr(value) },
    { field: 'dpostdate', headerName: 'Post Date', width: 140, valueGetter: (value) => formatDate(value) },
    { field: 'dvaluedate', headerName: 'Value Date', width: 140, valueGetter: (value) => formatDate(value) },
  ]), []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Transaction Reversal / Adjustment
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Reverse or adjust transactions by customer or voucher.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Adjust By"
              value={adjustBy}
              onChange={(e) => setAdjustBy(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">-- select --</MenuItem>
              {ADJUST_BY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Box>

          {adjustBy === 'customer' && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
              <TextField
                label="Customer Code"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                onKeyDown={handleCustomerCodeTab}
                size="small"
                fullWidth
                placeholder="Enter or search customer code"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Customer Name:
                </Typography>
                <Typography variant="body2">{customerName ? String(customerName).trim() : 'N/A'}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Transaction Type"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              onBlur={handleTransactionTypeBlur}
              size="small"
              fullWidth
            >
              <MenuItem value="">-- select --</MenuItem>
              {TRANSACTION_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Transaction Date"
              value={transactionDate}
              onChange={(v) => setTransactionDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>

          {adjustBy === 'voucher' && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
              <TextField
                label="Voucher Number"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                size="small"
                fullWidth
                placeholder="Enter voucher number"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          onClose={() => setStatusMessage('')}
          sx={{ mb: 2, maxWidth: 900, mx: 'auto' }}
        >
          {statusMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 900, mx: 'auto' }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Member Transactions {selectionModel.ids.size > 0 ? `(${selectionModel.ids.size} selected)` : ''}
          </Typography>
          {loading && <Typography sx={{ mb: 2, color: 'info.main' }}>Loading transactions...</Typography>}
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={displayTransactions}
              columns={columns}
              getRowId={(row) => row.itemid}
              checkboxSelection
              disableSelectionOnClick
              density="compact"
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                  borderRadius: 2,
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
            </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={savingTransaction || !transactionType || !customerCode.trim() || selectionModel.ids.size === 0}
              onClick={handleSaveTransaction}
            >
              {savingTransaction ? 'Saving...' : 'Save Transaction'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

