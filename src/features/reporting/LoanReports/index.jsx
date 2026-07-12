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

const ALL_BRANCHES_VALUE = 'ALL';

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
  const { currencies, fetchCurrencies } = useLoanReportCurrencies();

  const [product, setProduct] = useState('');
  const [branch, setBranch] = useState(ALL_BRANCHES_VALUE);
  const [loanReason, setLoanReason] = useState('');
  const [user, setUser] = useState('');
  const [currency, setCurrency] = useState('GMD');
  const [checks, setChecks] = useState(initChecks());
  const [tranFrom, setTranFrom] = useState(null);
  const [tranTo, setTranTo] = useState(() => dayjs());
  const [statusMessage, setStatusMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLoanReasons(); }, [fetchLoanReasons]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  const branchOptions = useMemo(() => (Array.isArray(branches) ? branches : []).map((b) => ({ id: b.id, name: b.name })), [branches]);

  const productOptions = useMemo(() => (Array.isArray(products) ? products : []).map((p) => ({ id: p.id, name: p.name })), [products]);

  const loanReasonOptions = useMemo(() => (Array.isArray(loanReasons) ? loanReasons : []).map((r) => ({ id: r.id, name: r.name })), [loanReasons]);

  const userOptions = useMemo(() => (Array.isArray(users) ? users : []).map((u) => ({ id: u.id, name: u.name })), [users]);

  const currencyOptions = useMemo(() => (Array.isArray(currencies) ? currencies : []).map((c) => ({ id: c.id, name: c.name })), [currencies]);

  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setChecks((prev) => ({ ...prev, [name]: checked }));
  };

  const handleClear = () => {
    setProduct('');
    setBranch(ALL_BRANCHES_VALUE);
    setLoanReason('');
    setUser('');
    setCurrency('GMD');
    setChecks(initChecks());
    setTranFrom(null);
    setTranTo(dayjs());
    setStatusMessage('');
  };

  const buildPayload = (format) => ({
    Product: product,
    Branch: branch === ALL_BRANCHES_VALUE ? 0 : Number(branch) || 0,
    LoanReason: loanReason || '',
    User: user || '',
    Currency: currency || '',
    Types: Object.keys(checks).filter((k) => checks[k]),
    TranFrom: tranFrom ? (tranFrom.format ? tranFrom.format('YYYY-MM-DD') : String(tranFrom)) : '',
    TranTo: tranTo ? (tranTo.format ? tranTo.format('YYYY-MM-DD') : String(tranTo)) : '',
    Format: format,
  });

  const handleExport = async (format) => {
    setIsExporting(true);
    setStatusMessage('Preparing export...');
    try {
      const payload = buildPayload(format);
      // For now, just log payload and simulate export
      console.log('LoanReports export payload:', payload);
      // Simulate delay
      await new Promise((r) => setTimeout(r, 700));
      setStatusMessage(`Export (${format}) ready — downloaded.`);
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
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
                <MenuItem value="">All products</MenuItem>
                {productOptions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField select label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} size="small">
                <MenuItem value={ALL_BRANCHES_VALUE}>All branches</MenuItem>
                {branchOptions.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
              <TextField select label="Loan Reason" value={loanReason} onChange={(e) => setLoanReason(e.target.value)} size="small">
                <MenuItem value="">All reasons</MenuItem>
                {loanReasonOptions.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </TextField>
              <TextField select label="User" value={user} onChange={(e) => setUser(e.target.value)} size="small">
                <MenuItem value="">All users</MenuItem>
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
              <TextField select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} size="small">
                {currencyOptions && currencyOptions.length > 0 ? (
                  currencyOptions.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)
                ) : (
                  <>
                    <MenuItem value="GMD">GMD</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </>
                )}
              </TextField>
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
