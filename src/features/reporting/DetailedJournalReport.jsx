import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
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

const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''));

export default function DetailedJournalReport() {
  const [accountNumber, setAccountNumber] = useState('');
  const [memberName, setMemberName] = useState('');
  const [tranFrom, setTranFrom] = useState(() => dayjs('1990-01-01'));
  const [tranTo, setTranTo] = useState(() => dayjs('2089-01-01'));
  const [isPrinting, setIsPrinting] = useState(false);

  const { fetchAccount } = useGlAccount();
  const { fetchStatement } = useGlStatement();

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
      alert('Failed to export CSV');
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
      // Use GL statement API for print view
      const payload = await fetchStatement(accountNumber, formatDate(tranFrom), formatDate(tranTo));
      const rows = Array.isArray(payload) ? payload : (payload?.rows || payload?.data || []);
      const title = 'Detailed Journal Report';
      const printedDate = new Date().toISOString().slice(0,19).replace('T', ' ');
      const tableRows = rows.map((r) => `
        <tr>
          <td style="padding:6px">${r.AccountNumber || r.accountNumber || ''}</td>
          <td style="padding:6px">${r.AccountName || r.accountName || ''}</td>
          <td style="padding:6px">${r.Date || r.dtrandate || ''}</td>
          <td style="padding:6px">${r.Description || r.ctrandesc || ''}</td>
          <td style="padding:6px; text-align:right">${r.Debit ?? r.debit ?? ''}</td>
          <td style="padding:6px; text-align:right">${r.Credit ?? r.credit ?? ''}</td>
        </tr>
      `).join('');

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd}</style></head><body><h2>${title}</h2><div>Printed: ${printedDate}</div><table><thead><tr><th>Account Number</th><th>Account Name</th><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
      const w = window.open('', '_blank', 'width=1000,height=800');
      if (!w) throw new Error('Popup blocked');
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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
