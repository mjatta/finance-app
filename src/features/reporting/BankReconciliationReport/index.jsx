import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, TextField, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataGrid } from '@mui/x-data-grid';
import useBankAccounts from './hooks/useBankAccounts';
import buildBankReconciliationPrintHtml from './printSetup';
import useCreditUnionLookup from '../../../hooks/useCreditUnionLookup';

export default function BankReconciliationReport() {
  const { accounts, loading: accountsLoading } = useBankAccounts();
  const [selected, setSelected] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''));
  const { data: creditUnion } = useCreditUnionLookup();

  useEffect(() => {
    if (!selected) return;
    // default dates could be set here if desired
  }, [selected]);

  const handleExport = async (type) => {
    if (!selected) return alert('Please select an account');
    const acct = selected.AccountNumber || selected.AccountNo || '';
    if (!acct) return alert('Selected account missing account number');
    setTimeout(() => {}, 0)
    try {
      const params = new URLSearchParams({ accountNo: String(acct), fromDate: formatDate(fromDate), toDate: formatDate(toDate) });
      const endpoint = `/api/bankreconciliationreport/report?${params.toString()}`;
      const resp = await fetch(endpoint);
      if (!resp.ok) throw new Error(`Report API ${resp.status}`);
      const payload = await resp.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || payload?.rows || []);

      if (type === 'csv' || type === 'excel') {
        const headers = ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'];
        const csvRows = rows.map((r) => {
          const f = r.Fields || r || {};
          return [f.dtrandate || f.trandate || f.date || '', f.cbankref || f.creference || f.reference || '', (f.cdesc || f.description || f.ctrandesc || '').trim(), f.ndebit ?? '', f.ncredit ?? '', f.nbal ?? f.nbalance ?? ''];
        });
        const csv = [headers, ...csvRows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""') }"`).join(',')).join('\n');
        const name = `bank-reconciliation-${new Date().toISOString().slice(0,10)}.${type === 'excel' ? 'xlsx' : 'csv'}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }

      // PDF / print
      const headerMeta = {
        companyName: creditUnion?.com_name || creditUnion?.CompanyName || '',
        address: creditUnion?.caddress || creditUnion?.address || '',
        telephone: creditUnion?.tel || creditUnion?.telephone || '',
        email: creditUnion?.email || creditUnion?.Email || '',
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
      };
      const html = buildBankReconciliationPrintHtml(rows, 'Bank Reconciliation Report', headerMeta);
      const w = window.open('', '_blank', 'width=1000,height=800');
      if (!w) throw new Error('Popup blocked');
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (err) {
      console.error(err);
      alert('Failed to export report');
    }
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

              <DatePicker
                label="Transaction Date From"
                value={fromDate}
                onChange={(v) => setFromDate(v)}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <DatePicker
                label="Transaction Date To"
                value={toDate}
                onChange={(v) => setToDate(v)}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

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
