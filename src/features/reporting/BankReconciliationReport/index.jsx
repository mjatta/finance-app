import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, TextField, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import useBankAccounts from './hooks/useBankAccounts';
import dayjs from 'dayjs';
import { formatCurrency } from '../../../utils/currencyFormatter';

export default function BankReconciliationReport() {
  const { accounts, loading: accountsLoading } = useBankAccounts();
  const [selected, setSelected] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (!selected) return;
    // default dates could be set here if desired
  }, [selected]);

  const handleExport = (type) => {
    // Placeholder: integrate with backend export endpoints when available
    console.debug('export', type, { account: selected, fromDate, toDate });
    // For now, print (PDF) or log
    if (type === 'pdf') window.print();
    if (type === 'csv') alert('CSV export not yet implemented');
    if (type === 'excel') alert('Excel export not yet implemented');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Bank Reconciliation Report</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Run bank reconciliation reports and export</Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 3 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Bank Account</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                select
                label="Bank Account"
                value={selected?.AccountNumber || selected?.AccountNo || ''}
                onChange={(e) => {
                  const a = accounts.find((x) => (x.AccountNumber || x.AccountNo || '') === e.target.value);
                  setSelected(a || null);
                }}
                size="small"
                sx={{ minWidth: 360 }}
                disabled={accountsLoading}
              >
                <MenuItem value="">-- select account --</MenuItem>
                {accounts.map((a) => (
                  <MenuItem key={a.AccountNumber || a.AccountNo} value={a.AccountNumber || a.AccountNo}>
                    {a.AccountNumber || a.AccountNo} - {String(a.AccountName || '').trim()}
                  </MenuItem>
                ))}
              </TextField>

              <TextField label="Account Name" value={selected?.AccountName ? String(selected.AccountName).trim() : ''} size="small" InputProps={{ readOnly: true }} sx={{ minWidth: 360 }} />

              <TextField label="Transaction Date From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Transaction Date To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="primary" sx={{ textTransform: 'none' }} onClick={() => handleExport('pdf')}>PDF</Button>
                <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => handleExport('excel')}>Excel</Button>
                <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => handleExport('csv')}>CSV</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
