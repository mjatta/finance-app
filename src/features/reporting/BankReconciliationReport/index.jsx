import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, TextField, Button, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import useBankAccounts from './hooks/useBankAccounts';
import buildBankReconciliationPrintHtml from './printSetup';
import useCreditUnionLookup from '../../../hooks/useCreditUnionLookup';

export default function BankReconciliationReport() {
  const { accounts, loading: accountsLoading } = useBankAccounts();
  const [selected, setSelected] = useState(null);
  const [fromDate, setFromDate] = useState(() => dayjs('1980-01-01'));
  const [toDate, setToDate] = useState(() => dayjs());
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');
  const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''));
  const { data: creditUnion } = useCreditUnionLookup();

  useEffect(() => {
    if (!selected) return;
    // default dates could be set here if desired
  }, [selected]);

  const handleExport = async (type) => {
    if (!selected) {
      setAlertMessage('Please select an account');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }
    const acct = selected.AccountNumber || selected.AccountNo || '';
    if (!acct) {
      setAlertMessage('Selected account missing account number');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }
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
      setAlertMessage('Failed to export report');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {alertOpen && (
        <Alert severity={alertSeverity} onClose={() => setAlertOpen(false)} sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Bank Reconciliation Report
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Run bank reconciliation reports and export results.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Bank Account"
              value={selected?.AccountNumber || selected?.AccountNo || ''}
              onChange={(e) => {
                const a = accounts.find((x) => (x.AccountNumber || x.AccountNo || '') === e.target.value);
                setSelected(a || null);
              }}
              size="small"
              fullWidth
              disabled={accountsLoading}
            >
              <MenuItem value="">-- select account --</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.AccountNumber || a.AccountNo} value={a.AccountNumber || a.AccountNo}>
                  {a.AccountNumber || a.AccountNo} - {String(a.AccountName || '').trim()}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Account Name:</Typography>
              <Typography variant="body2">{selected?.AccountName ? String(selected.AccountName).trim() : 'N/A'}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <DatePicker
              label="Transaction Date From"
              value={fromDate}
              onChange={(v) => setFromDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Transaction Date To"
              value={toDate}
              onChange={(v) => setToDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleExport('pdf')}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              onClick={() => handleExport('excel')}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleExport('csv')}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              CSV
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
