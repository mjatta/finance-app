import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useBranches } from '../../hooks/useBranches';
import useJournalEnquiryUsers from './JournalReport/hooks/useJournalEnquiryUsers';
import { useAuthStore } from '../../store/authStore';
import buildJournalReportPrintHtml from './JournalReport/printSetup';
import useCreditUnionLookup from '../../hooks/useCreditUnionLookup';

const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''));

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function JournalReport() {
  const { branches, loading: branchesLoading } = useBranches();
  const { users, loading: usersLoading } = useJournalEnquiryUsers();
  const authUser = useAuthStore((s) => s.user);
  const { data: creditUnion, loading: creditUnionLoading } = useCreditUnionLookup(authUser?.CompId || 30);
  const [company, setCompany] = useState('');
  const [branch, setBranch] = useState('');
  const [user, setUser] = useState('');
  const [tranFrom, setTranFrom] = useState(() => dayjs('1990-01-01'));
  const [tranTo, setTranTo] = useState(() => dayjs('2089-01-01'));
  const [isPrinting, setIsPrinting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');

  // users are loaded by useJournalEnquiryUsers hook

  const branchOptions = useMemo(() => (Array.isArray(branches) ? branches : []), [branches]);

  const buildPayload = () => ({
    company: company || '',
    branch: branch || '',
    user: user || '',
    tranFrom: formatDate(tranFrom),
    tranTo: formatDate(tranTo),
  });

  const fetchData = async () => {
    // Keep existing local endpoint but also useful for internal fetches
    const url = '/api/journalreport/get';
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
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
      // Call the remote journal enquiry report API (returns array of { Fields: { ... } })
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const compId = authUser?.CompId || userObj.CompId || userObj.compid || userObj.Compid || userObj.compId || userObj?.compid || '';
      const params = new URLSearchParams({ companyId: String(compId || ''), branchId: String(branch || ''), userId: String(user || ''), fromDate: formatDate(tranFrom), toDate: formatDate(tranTo) });
      const endpoint = `/api/journalenquiry/report?${params.toString()}`;
      const resp = await fetch(endpoint);
      if (!resp.ok) throw new Error(`Report API ${resp.status}`);
      const payload = await resp.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || payload?.rows || []);
      const headers = ['Date', 'Account', 'Description', 'Debit', 'Credit', 'User', 'Branch'];
      const csvRows = rows.map((r) => {
        const f = r.Fields || r;
        return [f.dtrandate || '', f.cacctnumb || '', (f.ctrandesc || '').trim(), f.ndebit ?? f.ntranamnt ?? '', f.ncredit ?? '', f.cuserid || '', f.br_name || ''];
      });
      const csv = [headers, ...csvRows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadFile(csv, `journal-report-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
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
    // generate CSV and save as xlsx file extension for compatibility
    await handleExportCSV();
  };

  const handleExportPDF = async () => {
    setIsPrinting(true);
    try {
      // Call remote report API and build print view
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const compId = authUser?.CompId || userObj.CompId || userObj.compid || userObj.Compid || userObj.compId || '';
      const params = new URLSearchParams({ companyId: String(compId || ''), branchId: String(branch || ''), userId: String(user || ''), fromDate: formatDate(tranFrom), toDate: formatDate(tranTo) });
      const endpoint = `/api/journalenquiry/report?${params.toString()}`;
      const resp = await fetch(endpoint);
      if (!resp.ok) throw new Error(`Report API ${resp.status}`);
      const payload = await resp.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || payload?.rows || []);
      const headerMeta = {
        companyName: creditUnion?.com_name || creditUnion?.com_name?.trim?.() || creditUnion?.comName || '',
        address: creditUnion?.caddress || creditUnion?.address || '',
        telephone: creditUnion?.tel || creditUnion?.telephone || '',
        email: creditUnion?.email || creditUnion?.Email || '',
        fromDate: formatDate(tranFrom),
        toDate: formatDate(tranTo),
      }
      const html = buildJournalReportPrintHtml(rows, 'Journal Report', headerMeta);
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Journal Report</Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>Generate journal report by company, branch, user and date range.</Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField label="Company" size="small" value={company} onChange={(e) => setCompany(e.target.value)} fullWidth sx={{ display: 'none' }} />
            <TextField select label="Branch" size="small" value={branch} onChange={(e) => setBranch(e.target.value)} fullWidth disabled={branchesLoading}>
              <MenuItem value="">All Branches</MenuItem>
              {branchOptions.map((b) => (<MenuItem key={b.br_id || b.id || b.branchid || b.br_id} value={b.br_id || b.id || b.branchid || b.br_id}>{b.branchName || b.br_name || b.branch || b.name}</MenuItem>))}
            </TextField>
            <TextField select label="User" size="small" value={user} onChange={(e) => setUser(e.target.value)} fullWidth disabled={usersLoading}>
              <MenuItem value="">All Users</MenuItem>
              {Array.isArray(users) && users.map((u) => {
                const idVal = (u.UserID || u.UserId || u.userId || u.id || u.UserID)?.toString().trim();
                const label = (u.username || u.oprcode || u.UserID || u.UserId || idVal || '').toString().trim();
                return (<MenuItem key={idVal || label} value={idVal || label}>{label}</MenuItem>)
              })}
            </TextField>
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
