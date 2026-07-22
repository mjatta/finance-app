import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, MenuItem, TextField, Grid, Paper, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import useAccounts from './hooks/useAccounts';
import { useEndOfYearData } from './hooks/useEndOfYearData';
import useProcessEndOfYear from './hooks/useProcessEndOfYear';
import { formatCurrency } from '../../../utils/currencyFormatter';

export default function EndOfYearAccounting() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { fetchData, loading: dataLoading } = useEndOfYearData();
  const { process, loading: processLoading } = useProcessEndOfYear();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [rows, setRows] = useState([]);

  const handleSelect = async (e) => {
    const accNo = e.target.value;
    setSelectedAccount(accNo);
    const found = accounts.find((a) => (a.AccountNo || a.accountNo || a.accountno || '') === accNo);
    setAccountName(found?.AccountName?.trim() || found?.accountName?.trim() || '');

    // Fetch grid data for selected account
    const data = await fetchData(accNo);
    // map to grid rows
    const mapped = (Array.isArray(data) ? data : []).map((r, idx) => ({
      id: `${r.AccountNo || r.accountNo || idx}-${idx}`,
      balanceDate: r.BalanceDate ? new Date(r.BalanceDate).toISOString().slice(0,10) : '',
      accountNo: r.AccountNo || r.accountNo || '',
      accountName: (r.AccountName || r.accountName || '').trim(),
      debit: Number(r.Debit || r.debit || 0),
      credit: Number(r.Credit || r.credit || 0),
    }));
    setRows(mapped);
  };

  // Load grid on mount (call GET /api/endofyear/data)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchData();
      if (!mounted) return;
      const mapped = (Array.isArray(data) ? data : []).map((r, idx) => ({
        id: `${r.AccountNo || r.accountNo || idx}-${idx}`,
        balanceDate: r.BalanceDate ? new Date(r.BalanceDate).toISOString().slice(0,10) : '',
        accountNo: r.AccountNo || r.accountNo || '',
        accountName: (r.AccountName || r.accountName || '').trim(),
        debit: Number(r.Debit || r.debit || 0),
        credit: Number(r.Credit || r.credit || 0),
      }));
      setRows(mapped);
    })();
    return () => { mounted = false };
  }, [fetchData]);

  const columns = [
    { field: 'balanceDate', headerName: 'Balance Date', flex: 1, minWidth: 140 },
    { field: 'accountNo', headerName: 'Account Number', flex: 1, minWidth: 160 },
    { field: 'accountName', headerName: 'Account Name', flex: 2, minWidth: 240 },
    { field: 'debit', headerName: 'Debit', flex: 1, minWidth: 120, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'credit', headerName: 'Credit', flex: 1, minWidth: 120, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            End Of Year
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Contra and end-of-year balances
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem', color: '#2c3e50' }}>
              Contra
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                select
                label="Contra (Account No)"
                value={selectedAccount}
                onChange={handleSelect}
                disabled={accountsLoading}
                size="small"
              >
                <MenuItem value="">All Accounts</MenuItem>
                {accounts.map((a) => (
                  <MenuItem key={a.AccountNo || a.accountNo || a.accountno} value={a.AccountNo || a.accountNo || a.accountno}>
                    {a.AccountNo || a.accountNo || a.accountno} - {String(a.AccountName || a.accountName || '').trim()}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>Account Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>{accountName || '-'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>End Of Year Balances</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', textTransform: 'none', fontWeight: 600 }} onClick={async () => {
                    // reload grid
                    const data = await fetchData(selectedAccount);
                    const mapped = (Array.isArray(data) ? data : []).map((r, idx) => ({
                      id: `${r.AccountNo || r.accountNo || idx}-${idx}`,
                      balanceDate: r.BalanceDate ? new Date(r.BalanceDate).toISOString().slice(0,10) : '',
                      accountNo: r.AccountNo || r.accountNo || '',
                      accountName: (r.AccountName || r.accountName || '').trim(),
                      debit: Number(r.Debit || r.debit || 0),
                      credit: Number(r.Credit || r.credit || 0),
                    }));
                    setRows(mapped);
                  }}>Refresh</Button>
                  <Button variant="outlined" sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', textTransform: 'none', fontWeight: 600 }} disabled={!rows || rows.length === 0} onClick={() => window.print()}>Print</Button>
                </Box>
              </Box>

              {/* Summary Totals */}
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr 1fr 1fr' }, fontSize: '0.85rem' }}>
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.3 }}>Total Debit</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(rows.reduce((sum, r) => sum + (r.debit || 0), 0))}</Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.3 }}>Total Credit</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(rows.reduce((sum, r) => sum + (r.credit || 0), 0))}</Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.3 }}>Surplus</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(rows.reduce((sum, r) => sum + (r.credit || 0), 0) - rows.reduce((sum, r) => sum + (r.debit || 0), 0))}</Typography>
                </Box>
              </Box>
            </Box>

            <Box>
              <div style={{ width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={dataLoading}
                  density="compact"
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                    '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                  }}
                />
              </div>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={processLoading}
                onClick={async () => {
                  try {
                    const payload = { AccountNo: selectedAccount };
                    await process(payload);
                    // reload grid after process
                    const data = await fetchData(selectedAccount);
                    const mapped = (Array.isArray(data) ? data : []).map((r, idx) => ({
                      id: `${r.AccountNo || r.accountNo || idx}-${idx}`,
                      balanceDate: r.BalanceDate || r.balanceDate || '',
                      accountNo: r.AccountNo || r.accountNo || '',
                      accountName: (r.AccountName || r.accountName || '').trim(),
                      debit: Number(r.Debit || r.debit || 0),
                      credit: Number(r.Credit || r.credit || 0),
                    }));
                    setRows(mapped);
                  } catch (err) {
                    console.error('EndOfYear process error', err);
                  }
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Calculated
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
