import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useLoanReportProducts } from './hooks/useLoanReportProducts';
import { useLoanReportBranches } from './hooks/useLoanReportBranches';
import { useLoanReportLoanReasons } from './hooks/useLoanReportLoanReasons';
import { useLoanReportUsers } from './hooks/useLoanReportUsers';
import { useLoanReportCurrencies } from './hooks/useLoanReportCurrencies';
import { useLoanReportPrintView } from './hooks/useLoanReportPrintView';
import { buildLoanReportPrintHtml } from './printSetup';
import useCreditUnionLookup from '../../../hooks/useCreditUnionLookup';

const ALL_BRANCHES_VALUE = 'ALL';
const ALL_USERS_VALUE = 'ALL';
const ALL_PRODUCTS_VALUE = 'ALL';
const ALL_REASONS_VALUE = 'ALL';

const CHECKS = [
  { name: 'loanApplication', label: 'Loan Application' },
  { name: 'loanApproval', label: 'Loan Approval' },
  { name: 'loanIssued', label: 'Loan Issued' },
  { name: 'loanRejected', label: 'Loan Rejected' },
  { name: 'loanChargeOff', label: 'Loan ChargeOff' },
  { name: 'loanWriteOff', label: 'Loan Write Off' },
];

const initChecks = () => CHECKS.reduce((acc, c) => ({ ...acc, [c.name]: false }), {});

export default function LoanReports() {
  const { branches, fetchBranches } = useLoanReportBranches();
  const { users, fetchUsers } = useLoanReportUsers();
  const { loanReasons, fetchLoanReasons } = useLoanReportLoanReasons();
  const { products, fetchProducts } = useLoanReportProducts();
  const { fetchCurrencies } = useLoanReportCurrencies();
  const { data: creditUnion } = useCreditUnionLookup(30);

  const [product, setProduct] = useState(ALL_PRODUCTS_VALUE);
  const [branch, setBranch] = useState(ALL_BRANCHES_VALUE);
  const [loanReason, setLoanReason] = useState(ALL_REASONS_VALUE);
  const [user, setUser] = useState(ALL_USERS_VALUE);
  const [currency, setCurrency] = useState('GMD');
  const [checks, setChecks] = useState(initChecks());
  const [tranFrom, setTranFrom] = useState(() => dayjs('1980-01-01'));
  const [tranTo, setTranTo] = useState(() => dayjs());
  const [statusMessage, setStatusMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  

  const { generateReport } = useLoanReportPrintView();

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLoanReasons(); }, [fetchLoanReasons]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  const branchOptions = useMemo(() => (Array.isArray(branches) ? branches : []).map((b) => ({ id: b.id, name: b.name })), [branches]);

  const productOptions = useMemo(() => (Array.isArray(products) ? products : []).map((p) => ({ id: p.id, name: p.name })), [products]);

  const loanReasonOptions = useMemo(() => (Array.isArray(loanReasons) ? loanReasons : []).map((r) => ({ id: r.id, name: r.name })), [loanReasons]);

  const userOptions = useMemo(() => (Array.isArray(users) ? users : []).map((u) => ({ id: u.id, name: u.name })), [users]);

  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setChecks((prev) => ({ ...prev, [name]: checked }));
  };

  const handleClear = () => {
    setProduct(ALL_PRODUCTS_VALUE);
    setBranch(ALL_BRANCHES_VALUE);
    setLoanReason(ALL_REASONS_VALUE);
    setUser(ALL_USERS_VALUE);
    setCurrency('GMD');
    setChecks(initChecks());
    setTranFrom(dayjs('1980-01-01'));
    setTranTo(dayjs());
    setStatusMessage('');
  };

  const buildPayload = (format) => ({
    Product: product === ALL_PRODUCTS_VALUE ? '' : product || '',
    Branch: branch === ALL_BRANCHES_VALUE ? 0 : Number(branch) || 0,
    LoanReason: loanReason === ALL_REASONS_VALUE ? '' : loanReason || '',
    User: user === ALL_USERS_VALUE ? '' : user || '',
    Currency: currency || '',
    Types: Object.keys(checks).filter((k) => checks[k]),
    TranFrom: tranFrom ? (tranFrom.format ? tranFrom.format('YYYY-MM-DD') : String(tranFrom)) : '',
    TranTo: tranTo ? (tranTo.format ? tranTo.format('YYYY-MM-DD') : String(tranTo)) : '',
    Format: format,
  });

      // Helper to download a file
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

      const escapeCSV = (value) => {
        const str = String(value ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      };

      const formatDate = (v) => {
        if (!v) return '';
        try {
          const d = new Date(v);
          if (isNaN(d.getTime())) return String(v).slice(0, 10);
          return d.toISOString().slice(0, 10);
        } catch {
          return String(v).slice(0, 10);
        }
      };

      const convertToCSV = (rowsData) => {
        const headers = ['Loan No', 'Client Code', 'Client Name', 'Product', 'Principal', 'Repayment', 'Applied', 'Approved', 'Issued', 'Maturity', 'Branch', 'Total Balance'];
        const csvRows = (rowsData || []).map((r) => [
          String(r?.LOAN_NUMBER ?? '').trim(),
          String(r?.ccustcode ?? '').trim(),
          `${String(r?.ccustfname ?? '').trim()} ${String(r?.ccustmname ?? '').trim()} ${String(r?.ccustlname ?? '').trim()}`.trim(),
          String(r?.prd_name ?? '').trim(),
          Number(r?.PRINCIPAL_AMT ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          Number(r?.REPAYMENT_AMT ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          formatDate(r?.loan_appl_date),
          formatDate(r?.loan_appr_date),
          r?.ISSUED_DATE && r.ISSUED_DATE !== '1900-01-01T00:00:00' ? formatDate(r.ISSUED_DATE) : '',
          formatDate(r?.MATURITY_DATE),
          String(r?.br_name ?? '').trim(),
          Number(r?.TOTALBALANCE ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ]);

        return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
      };

  const handleExport = async (format) => {
    setIsExporting(true);
    setStatusMessage('Preparing export...');
    try {
      const uiPayload = buildPayload(format);
      const payload = {
        BranchID: uiPayload.Branch || 0,
        ProductType: uiPayload.Product || 0,
        LoanReason: uiPayload.LoanReason || 0,
        UserID: uiPayload.User || '',
        LApply: checks.loanApplication ? 1 : 0,
        LApproved: checks.loanApproval ? 1 : 0,
        LIssued: checks.loanIssued ? 1 : 0,
        Rejected: checks.loanRejected ? 1 : 0,
        LoanWriteOff: checks.loanWriteOff ? 1 : 0,
        LoanChargeOff: checks.loanChargeOff ? 1 : 0,
        FromDate: uiPayload.TranFrom || '',
        ToDate: uiPayload.TranTo || '',
      };

      const rows = await generateReport(payload) || [];

      if (format === 'CSV') {
        const csv = convertToCSV(rows);
        const filename = `loan-report-${new Date().toISOString().slice(0, 10)}.csv`;
        downloadFile(csv, filename, 'text/csv');
        setStatusMessage(`CSV (${filename}) downloaded.`);
      } else if (format === 'Excel') {
        const csv = convertToCSV(rows);
        const filename = `loan-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadFile(csv, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        setStatusMessage(`Excel (${filename}) downloaded.`);
      } else {
        const html = buildLoanReportPrintHtml(rows, { 
          subTitle: `From: ${uiPayload.TranFrom || ''} To: ${uiPayload.TranTo || ''}`,
          creditUnion: creditUnion
        });
        const w = window.open('', '_blank');
        if (w) {
          w.document.open();
          w.document.write(html);
          w.document.close();
          w.focus();
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      setStatusMessage('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <Box p={3}>
      <Backdrop open={isExporting} sx={{ zIndex: 1300 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={72} />
          <Typography variant="h6">Preparing export...</Typography>
        </Box>
      </Backdrop>

      {/* Header (match Transaction Listing look & feel) */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Loan Reports
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Filter and export loan events by product, branch, reason, user and date range.
        </Typography>
      </Box>

      {statusMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {statusMessage}
        </Alert>
      )}

      {/* Two-column cards: Filters & Loan Events (checkboxes) */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
              Search Filters
            </Typography>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
              <TextField select label="Product" value={product} onChange={(e) => setProduct(e.target.value)} size="small">
                <MenuItem value={ALL_PRODUCTS_VALUE}>All products</MenuItem>
                {productOptions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField select label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} size="small">
                <MenuItem value={ALL_BRANCHES_VALUE}>All branches</MenuItem>
                {branchOptions.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
              <TextField select label="Loan Reason" value={loanReason} onChange={(e) => setLoanReason(e.target.value)} size="small">
                <MenuItem value={ALL_REASONS_VALUE}>All reasons</MenuItem>
                {loanReasonOptions.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </TextField>
              <TextField select label="User" value={user} onChange={(e) => setUser(e.target.value)} size="small">
                <MenuItem value={ALL_USERS_VALUE}>All users</MenuItem>
                {userOptions.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <DatePicker label="Transaction From" value={tranFrom} onChange={(v) => setTranFrom(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              <DatePicker label="Transaction To" value={tranTo} onChange={(v) => setTranTo(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
              Loan Events
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 0 }}>
              {CHECKS.map(({ name, label }) => (
                <FormControlLabel key={name} control={<Checkbox checked={checks[name]} onChange={handleCheckChange} name={name} size="small" />} label={<Typography variant="body2">{label}</Typography>} />
              ))}
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={handleClear}>Clear</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Export buttons */}
      <Box sx={{ mt: 1, display: 'flex', gap: 1.5, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => handleExport('PDF')}
          disabled={isExporting}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 4 }}
        >
          PDF
        </Button>

        <Button
          variant="contained"
          onClick={() => handleExport('Excel')}
          disabled={isExporting}
          sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
        >
          Excel
        </Button>

        <Button
          variant="contained"
          onClick={() => handleExport('CSV')}
          disabled={isExporting}
          sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
        >
          CSV
        </Button>

        <Button
          variant="text"
          onClick={handleClear}
          disabled={isExporting}
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Clear
        </Button>
      </Box>
      
    </Box>
  );
}
