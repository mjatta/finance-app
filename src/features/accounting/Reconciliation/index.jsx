import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, TextField, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import useBankAccounts from './hooks/useBankAccounts';
import { useReconcileTransactions } from './hooks/useReconcileTransactions';
import { formatCurrency } from '../../../utils/currencyFormatter';
import dayjs from 'dayjs';

export default function AccountReconciliation() {
  const { accounts, loading: accountsLoading } = useBankAccounts();
  const { fetchTransactions, loading: txLoading } = useReconcileTransactions();
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);

  const loadForAccount = async (acc) => {
    if (!acc) return setRows([]);
    const data = await fetchTransactions(acc.AccountNumber || acc.AccountNo || acc.AccountNumber);
    const mapped = (Array.isArray(data) ? data : []).map((r, idx) => ({
      id: `${r.Id || r.id || idx}-${idx}`,
      transactionDate: r.TransactionDate || r.Date || r.BalanceDate || r.TransactionDate || '',
      accountNumber: r.AccountNumber || r.AccountNo || acc.AccountNumber || acc.AccountNo || '',
      narration: r.Narration || r.Description || r.Particulars || '',
      debit: Number(r.Debit || r.debit || r.Dr || 0),
      credit: Number(r.Credit || r.credit || r.Cr || 0),
    }));
    setRows(mapped);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      if (selected) await loadForAccount(selected);
    })();
    return () => { mounted = false };
  }, [selected]);

  const columns = [
    { field: 'transactionDate', headerName: 'Date', flex: 1, minWidth: 140, align: 'center', headerAlign: 'center', valueFormatter: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '' },
    { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'narration', headerName: 'Narration', flex: 2, minWidth: 240, align: 'center', headerAlign: 'center' },
    { field: 'debit', headerName: 'Debit', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'credit', headerName: 'Credit', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Account Reconciliation</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Bank account reconciliation and transaction lookup</Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>Bank Account</Typography>
            <Box sx={{ display: 'grid', gap: 2, maxWidth: 900 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  select
                  fullWidth
                  label="Bank Account"
                  value={selected?.AccountNumber || selected?.AccountNo || ''}
                  onChange={(e) => {
                    const acc = accounts.find((a) => (a.AccountNumber || a.AccountNo || '') === e.target.value);
                    setSelected(acc || null);
                  }}
                  disabled={accountsLoading}
                  size="medium"
                >
                  <MenuItem value="">All Accounts</MenuItem>
                  {accounts.map((a) => (
                    <MenuItem key={a.AccountNumber || a.AccountNo} value={a.AccountNumber || a.AccountNo}>
                      {a.AccountNumber || a.AccountNo} - {String(a.AccountName || '').trim()}
                    </MenuItem>
                  ))}
                </TextField>

                <Button variant="outlined" onClick={async () => { if (selected) await loadForAccount(selected); }} sx={{ whiteSpace: 'nowrap' }}>Load</Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Account Number" value={selected?.AccountNumber || selected?.AccountNo || ''} size="small" InputProps={{ readOnly: true }} sx={{ minWidth: 300 }} />
                <TextField label="Last Reconciliation Date" value={selected?.LastReconDate ? dayjs(selected.LastReconDate).format('YYYY-MM-DD') : ''} size="small" InputProps={{ readOnly: true }} sx={{ minWidth: 300 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Reconciliation Transactions</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', textTransform: 'none', fontWeight: 600 }} onClick={async () => { if (selected) await loadForAccount(selected); }}>Refresh</Button>
                <Button variant="outlined" sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', textTransform: 'none', fontWeight: 600 }} disabled={!rows || rows.length === 0} onClick={() => window.print()}>Print</Button>
              </Box>
            </Box>

            <Box>
              <div style={{ width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={txLoading}
                  density="compact"
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                    '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                  }}
                />
              </div>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
