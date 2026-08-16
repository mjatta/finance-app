import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, TextField, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import useBankAccounts from './hooks/useBankAccounts';
import { useReconcileTransactions } from './hooks/useReconcileTransactions';
import { useReconcileSelect } from './hooks/useReconcileSelect';
import { useReconcileSave } from './hooks/useReconcileSave';
import { formatCurrency } from '../../../utils/currencyFormatter';
import dayjs from 'dayjs';

export default function AccountReconciliation() {
  const { accounts, loading: accountsLoading } = useBankAccounts();
  const { fetchTransactions, loading: txLoading } = useReconcileTransactions();
  const { selectTransaction, loading: selectLoading } = useReconcileSelect();
  const { saveReconcile, loading: saveLoading } = useReconcileSave();
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [endBalance, setEndBalance] = useState('');

  const loadForAccount = async (acc) => {
    if (!acc) return setRows([]);
    const data = await fetchTransactions(acc.AccountNumber || acc.AccountNo || acc.AccountNumber);
    const mapped = (Array.isArray(data) ? data : []).map((r, idx) => ({
      id: r.TranID ?? `${r.Id || r.id || idx}-${idx}`,
      tranId: r.TranID,
      transactionDate: r.TransactionDate || r.Date || r.BalanceDate || r.TransactionDate || '',
      accountNumber: r.AccountNumber || r.AccountNo || acc.AccountNumber || acc.AccountNo || '',
      narration: r.Narration || r.Description || r.Particulars || '',
      debit: Number(r.Debit || r.debit || r.Dr || 0),
      credit: Number(r.Credit || r.credit || r.Cr || 0),
      reconciled: Boolean(r.Selected),
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

  const totals = useMemo(() => {
    const reconciledRows = rows.filter((r) => r.reconciled);
    const totalDebit = reconciledRows.reduce((sum, r) => sum + (r.debit || 0), 0);
    const totalCredit = reconciledRows.reduce((sum, r) => sum + (r.credit || 0), 0);
    const balance = totalDebit - totalCredit;
    const difference = Math.abs(balance);
    return { totalDebit, totalCredit, balance, difference };
  }, [rows]);

  const handleUpdateReconcile = async () => {
    if (!selectedRowId) return;
    const row = rows.find((r) => r.id === selectedRowId);
    if (!row || row.tranId == null) return;

    const newSelected = !row.reconciled;
    const success = await selectTransaction(row.tranId, newSelected);
    if (success) {
      setRows((prev) => prev.map((r) => (r.id === selectedRowId ? { ...r, reconciled: newSelected } : r)));
    }
  };

  const allReconciled = rows.length > 0 && rows.every((r) => r.reconciled);
  const endBalanceMatches = endBalance !== '' && Math.abs(Number(endBalance) - totals.balance) < 0.01;
  const canConfirmAllReconcile = allReconciled && endBalanceMatches;

  const handleConfirmAllReconcile = async () => {
    if (!canConfirmAllReconcile) return;
    const transactionIds = rows.map((r) => r.tranId).filter((id) => id != null);
    if (transactionIds.length === 0) return;
    const success = await saveReconcile(transactionIds);
    if (success && selected) {
      await loadForAccount(selected);
      setEndBalance('');
    }
  };

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
                <TextField
                  label="End Balance"
                  type="number"
                  value={endBalance}
                  onChange={(e) => setEndBalance(e.target.value)}
                  size="small"
                  helperText="End balance should be equal to Reconciled Balance before you can Save and Reconcile all transactions"
                  sx={{
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: endBalance === '' ? undefined : (endBalanceMatches ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 235, 59, 0.25)'),
                      '& fieldset': {
                        borderColor: endBalance === '' ? undefined : (endBalanceMatches ? '#2e7d32' : '#f9a825'),
                      },
                      '&:hover fieldset': {
                        borderColor: endBalance === '' ? undefined : (endBalanceMatches ? '#2e7d32' : '#f9a825'),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: endBalance === '' ? undefined : (endBalanceMatches ? '#2e7d32' : '#f9a825'),
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Reconciliation Transactions</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', textTransform: 'none', fontWeight: 600 }} onClick={async () => { if (selected) await loadForAccount(selected); }}>Refresh</Button>
                  <Button variant="outlined" sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', textTransform: 'none', fontWeight: 600 }} disabled={!rows || rows.length === 0} onClick={() => window.print()}>Print</Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Debit Reconciled: D ${totals.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
                />
                <Chip
                  label={`Credit Reconciled: D ${totals.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
                />
                <Chip
                  label={`Reconciled Balance: D ${totals.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
                />
                <Chip
                  label={`Reconciled Difference: D ${totals.difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
                />
              </Box>
            </Box>

            <Box>
              <div style={{ width: '100%', position: 'relative' }}>
                {(selectLoading || saveLoading) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      borderRadius: '4px',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, color: '#333' }}>
                      {selectLoading ? 'Updating...' : 'Confirming...'}
                    </Typography>
                  </Box>
                )}
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={txLoading}
                  density="compact"
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                  rowSelectionModel={{ type: 'include', ids: selectedRowId ? new Set([selectedRowId]) : new Set() }}
                  onRowSelectionModelChange={(newSelection) => {
                    const ids = Array.from(newSelection.ids || []);
                    setSelectedRowId(ids.length > 0 ? ids[ids.length - 1] : null);
                  }}
                  checkboxSelection
                  disableMultipleRowSelection
                  disableRowSelectionOnClick={false}
                  getRowClassName={(params) => (params.row.reconciled ? 'reconciled-row' : '')}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                    '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                    '& .reconciled-row': {
                      backgroundColor: 'rgba(76, 175, 80, 0.25) !important',
                      '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.35) !important' },
                    },
                  }}
                />
              </div>

              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button variant="contained" sx={{ color: 'white', backgroundColor: '#2e7d32', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#1b5e20' } }} disabled={!selectedRowId || selectLoading} onClick={handleUpdateReconcile}>
                  {selectLoading ? 'Updating...' : 'Update Reconcile'}
                </Button>
                <Button variant="contained" sx={{ color: 'white', backgroundColor: '#1565c0', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#0d47a1' } }} disabled={!canConfirmAllReconcile || saveLoading} onClick={handleConfirmAllReconcile}>
                  {saveLoading ? 'Confirming...' : 'Confirm All Reconcile'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
