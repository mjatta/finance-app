import React, { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Backdrop, CircularProgress } from '@mui/material';
import { buildGroupReportPrintHtml } from './printSetup';
import dayjs from 'dayjs';
import useGetGroupMembers from './hooks/useGetGroupMembers';

export default function GroupReport() {
  const [groupCode, setGroupCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { fetchGroupMembers, loading } = useGetGroupMembers();
  const [rows, setRows] = useState([]);

  const zeroPad = (value) => {
    const s = String(value || '').trim();
    return s.padStart(6, '0');
  };

  const handleSearch = async () => {
    setStatusMessage('');
    const code = zeroPad(groupCode);
    try {
      const res = await fetchGroupMembers(code);
      if (!res || !Array.isArray(res) || res.length === 0) {
        setStatusMessage('No group members found.');
        setRows([]);
        return;
      }
      setRows(res);
    } catch (err) {
      setStatusMessage(err?.message || 'Failed to fetch group members');
      setRows([]);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Full Name', 'Loan Amount', 'Sector'];
    const csvRows = rows.map((r) => [`${r.FirstName || ''} ${r.LastName || ''}`.trim(), (r.LoanAmount ?? 0).toFixed(2), String(r.Sector ?? '')]);
    const content = [headers, ...csvRows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `group-members-${zeroPad(groupCode)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // reuse CSV content and XLSX mime for simplicity
    const headers = ['Full Name', 'Loan Amount', 'Sector'];
    const csvRows = rows.map((r) => [`${r.FirstName || ''} ${r.LastName || ''}`.trim(), (r.LoanAmount ?? 0).toFixed(2), String(r.Sector ?? '')]);
    const content = [headers, ...csvRows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `group-members-${zeroPad(groupCode)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview.');
      return;
    }
    const html = buildGroupReportPrintHtml(rows, dayjs().format('YYYY-MM-DD'));
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Group Report</Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>Enter group code and search group members.</Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            label="Group Member"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
            size="small"
            fullWidth
            placeholder="Enter group code"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" onClick={handleSearch} disabled={loading || !groupCode} sx={{ backgroundColor: '#667eea' }}>Search</Button>
            <Button variant="contained" onClick={handleExportPDF} disabled={rows.length === 0} sx={{ backgroundColor: '#667eea' }}>PDF</Button>
            <Button variant="contained" onClick={handleExportExcel} disabled={rows.length === 0} sx={{ backgroundColor: '#27ae60' }}>Excel</Button>
            <Button variant="contained" onClick={handleExportCSV} disabled={rows.length === 0} sx={{ backgroundColor: '#3498db' }}>CSV</Button>
          </Box>

          {statusMessage && <Typography color="warning.main" sx={{ mb: 2 }}>{statusMessage}</Typography>}

          <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        </CardContent>
      </Card>
    </Box>
  );
}
