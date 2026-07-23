import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { downloadFile } from '../../utils/downloadFile';
import useGlAccount from './DetailedJournalReport/hooks/useGlAccount';
import useGlStatement from './DetailedJournalReport/hooks/useGlStatement';
import useCreditUnionLookup from '../../hooks/useCreditUnionLookup';

const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''));

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatAmount = (value) => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function DetailedJournalReport() {
  const [accountNumber, setAccountNumber] = useState('');
  const [memberName, setMemberName] = useState('');
  const [tranFrom, setTranFrom] = useState(() => dayjs('1990-01-01'));
  const [tranTo, setTranTo] = useState(() => dayjs('2089-01-01'));
  const [isPrinting, setIsPrinting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');

  const { fetchAccount } = useGlAccount();
  const { fetchStatement } = useGlStatement();
  const { data: creditUnion } = useCreditUnionLookup(30);

  const buildPayload = () => ({
    accountNumber: accountNumber || '',
    memberName: memberName || '',
    tranFrom: formatDate(tranFrom),
    tranTo: formatDate(tranTo),
  });

  const fetchData = async () => {
    const resp = await fetch('/api/detailedjournal/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return Array.isArray(data) ? data : (data?.rows || data?.data || []);
  };

  const handleExportCSV = async () => {
    setIsPrinting(true);
    try {
      // Use GL statement API for exports when accountNumber provided
      const payload = await fetchStatement(accountNumber, formatDate(tranFrom), formatDate(tranTo));
      const rows = Array.isArray(payload) ? payload : (payload?.rows || payload?.data || []);
      const headers = ['Account Number', 'Account Name', 'Date', 'Description', 'Debit', 'Credit'];
      const csvRows = rows.map((r) => [r.AccountNumber || r.accountNumber || '', r.AccountName || r.accountName || '', r.Date || r.TransactionDate || r.dtrandate || '', r.Description || r.ctrandesc || '', r.Debit ?? r.debit ?? '', r.Credit ?? r.credit ?? '']);
      const csv = [headers, ...csvRows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadFile(csv, `detailed-journal-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
    } catch (err) {
      console.error(err);
      setAlertMessage('Failed to export CSV');
      setAlertSeverity('error');
      setAlertOpen(true);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportExcel = async () => {
    await handleExportCSV();
  };

  const handleExportPDF = async () => {
    setIsPrinting(true);
    try {
      const payload = await fetchStatement(accountNumber, formatDate(tranFrom), formatDate(tranTo));
      const rows = Array.isArray(payload) ? payload : (payload?.rows || payload?.data || []);
      const title = 'Detailed Journal Report';
      const printedDate = new Date().toISOString().slice(0,19).replace('T', ' ');
      const companyName = creditUnion?.com_name || creditUnion?.CompanyName || 'Company';
      const address = creditUnion?.caddress || creditUnion?.address || '';
      const telephone = creditUnion?.tel || creditUnion?.telephone || '';
      const email = creditUnion?.email || creditUnion?.Email || '';
      const fromLabel = formatDate(tranFrom);
      const toLabel = formatDate(tranTo);

      const tableRows = rows.map((r) => `
        <tr>
          <td>${escapeHtml(r.AccountNumber || r.accountNumber || '')}</td>
          <td>${escapeHtml(r.AccountName || r.accountName || '')}</td>
          <td>${escapeHtml(r.Date || r.dtrandate || '')}</td>
          <td>${escapeHtml(r.Description || r.ctrandesc || '')}</td>
          <td style="text-align:right">${formatAmount(r.Debit ?? r.debit ?? '')}</td>
          <td style="text-align:right">${formatAmount(r.Credit ?? r.credit ?? '')}</td>
        </tr>
      `).join('');

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    :root{--text:#0f172a;--muted:#475569;--line:#e6eef8;--header-bg:#f1f5f9}
    body{font-family:Segoe UI,Roboto,Arial,sans-serif;color:var(--text);margin:0;padding:20px;background:#fff}
    .report{max-width:1050px;margin:0 auto}
    .header{text-align:center;margin-bottom:12px}
    .meta-right{position:absolute;right:20px;top:20px;font-size:12px;color:var(--muted)}
    .company{font-size:20px;font-weight:800}
    .line{font-size:13px;color:var(--muted);margin:2px 0}
    .title{margin-top:8px;font-size:16px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
    thead th{background:var(--header-bg);border:1px solid var(--line);padding:8px;text-align:left;font-weight:700}
    tbody td{border:1px solid var(--line);padding:7px;vertical-align:top}
    tbody tr:nth-child(even){background:#fbfdff}
    .amt{text-align:right;font-variant-numeric:tabular-nums}
    @media print{body{padding:8mm}}
  </style></head><body><div class="report"><div class="header"><div class="meta-right">Printed: ${escapeHtml(printedDate)}</div><div class="company">${escapeHtml(companyName)}</div>${address?`<div class="line">${escapeHtml(address)}</div>`:''}${telephone?`<div class="line">Tel: ${escapeHtml(telephone)}</div>`:''}${email?`<div class="line">Email: ${escapeHtml(email)}</div>`:''}<div class="title">${escapeHtml(title)}</div><div class="line">Period: ${escapeHtml(fromLabel)} to ${escapeHtml(toLabel)}</div></div><table><thead><tr><th>Account Number</th><th>Account Name</th><th>Date</th><th>Description</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th></tr></thead><tbody>${tableRows}</tbody></table></div></body></html>`;
      const w = window.open('', '_blank', 'width=1000,height=800');
      if (!w) throw new Error('Popup blocked');
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (err) {
      console.error(err);
      setAlertMessage('Failed to export PDF');
      setAlertSeverity('error');
      setAlertOpen(true);
    } finally {
      setIsPrinting(false);
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Detailed Journal Report</Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>Detailed journal entries by account and member.</Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              label="Account Number"
              size="small"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              onBlur={async (e) => {
                const acc = String(e.target.value || '').trim()
                if (!acc) return
                const data = await fetchAccount(acc)
                if (data && data.AccountName) {
                  setMemberName(String(data.AccountName).trim())
                }
              }}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Member Name:</Typography>
              <Typography variant="body2">{memberName ? String(memberName).trim() : 'N/A'}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <DatePicker label="Transaction Date From" value={tranFrom} onChange={(v) => setTranFrom(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Transaction Date To" value={tranTo} onChange={(v) => setTranTo(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleExportPDF}
              disabled={isPrinting}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              {isPrinting ? <CircularProgress size={18} color="inherit" /> : 'PDF'}
            </Button>
            <Button
              variant="contained"
              onClick={handleExportExcel}
              disabled={isPrinting}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              {isPrinting ? 'Working...' : 'Excel'}
            </Button>
            <Button
              variant="contained"
              onClick={handleExportCSV}
              disabled={isPrinting}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              {isPrinting ? 'Working...' : 'CSV'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
