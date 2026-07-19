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

const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''));

export default function DetailedJournalReport() {
  const [accountNumber, setAccountNumber] = useState('');
  const [memberName, setMemberName] = useState('');
  const [tranFrom, setTranFrom] = useState(() => dayjs('1990-01-01'));
  const [tranTo, setTranTo] = useState(() => dayjs('2089-01-01'));
  const [isPrinting, setIsPrinting] = useState(false);

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
      const rows = await fetchData();
      const headers = ['Account Number', 'Member Name', 'Date', 'Description', 'Debit', 'Credit'];
      const csvRows = rows.map((r) => [r.cacctnumb || '', r.ccustname || '', r.dtrandate || '', r.ctrandesc || '', r.debit ?? '', r.credit ?? '']);
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
      const rows = await fetchData();
      const title = 'Detailed Journal Report';
      const printedDate = new Date().toISOString().slice(0,19).replace('T', ' ');
      const tableRows = rows.map((r) => `
        <tr>
          <td style="padding:6px">${r.cacctnumb || ''}</td>
          <td style="padding:6px">${r.ccustname || ''}</td>
          <td style="padding:6px">${r.dtrandate || ''}</td>
          <td style="padding:6px">${r.ctrandesc || ''}</td>
          <td style="padding:6px; text-align:right">${r.debit ?? ''}</td>
          <td style="padding:6px; text-align:right">${r.credit ?? ''}</td>
        </tr>
      `).join('');

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd}</style></head><body><h2>${title}</h2><div>Printed: ${printedDate}</div><table><thead><tr><th>Account Number</th><th>Member Name</th><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
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

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>Filters</Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, mb: 2 }}>
            <TextField label="Account Number" size="small" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} fullWidth />
            <TextField label="Member Name" size="small" value={memberName} onChange={(e) => setMemberName(e.target.value)} fullWidth />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
            <DatePicker label="Transaction Date From" value={tranFrom} onChange={(v) => setTranFrom(v)} slotProps={{ textField: { size: 'small' } }} />
            <DatePicker label="Transaction Date To" value={tranTo} onChange={(v) => setTranTo(v)} slotProps={{ textField: { size: 'small' } }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button variant="contained" color="primary" onClick={handleExportPDF} disabled={isPrinting}>{isPrinting ? <CircularProgress size={18} color="inherit" /> : 'PDF'}</Button>
            <Button variant="outlined" color="primary" onClick={handleExportExcel} disabled={isPrinting}>{isPrinting ? 'Working...' : 'Excel'}</Button>
            <Button variant="outlined" color="primary" onClick={handleExportCSV} disabled={isPrinting}>{isPrinting ? 'Working...' : 'CSV'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
