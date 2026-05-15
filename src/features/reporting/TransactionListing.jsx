import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useBranches } from '../../hooks/useBranches';

const normalizeBranchName = (branch) => (
  branch?.branchName
  || branch?.br_name
  || branch?.name
  || branch?.branch
  || ''
).toString().trim();

const TRANSACTION_SOURCES = [
  { name: 'transfer', label: 'Transfer' },
  { name: 'dividend', label: 'Dividend' },
  { name: 'batchSaving', label: 'Batch Saving' },
  { name: 'internetBanking', label: 'Internet Banking' },
  { name: 'adjustment', label: 'Adjustment' },
  { name: 'reversal', label: 'Reversal' },
  { name: 'batchLoanRepayment', label: 'Batch Loan Repayment' },
  { name: 'savingTransfer', label: 'Saving Transfer' },
  { name: 'chargeOff', label: 'Charge Off' },
  { name: 'savingInterest', label: 'Saving Interest' },
  { name: 'batchInterestPaid', label: 'Batch Interest Paid' },
  { name: 'annualMonthlyDues', label: 'Annual / Monthly Dues' },
  { name: 'writeOff', label: 'Write Off' },
  { name: 'atm', label: 'ATM' },
  { name: 'mobileMoney', label: 'Mobile Money Transfer' },
  { name: 'annualShares', label: 'Annual Shares' },
];

const TRANSACTION_TYPES = [
  { name: 'deposit', label: 'Deposit' },
  { name: 'withdrawal', label: 'Withdrawal' },
  { name: 'loanRepayment', label: 'Loan Repayment' },
  { name: 'loanDisbursement', label: 'Loan Disbursement' },
  { name: 'interestCharged', label: 'Interest Charged' },
  { name: 'interestPaid', label: 'Interest Paid' },
  { name: 'annualFeePaid', label: 'Annual Fee Paid' },
  { name: 'feePaid', label: 'Fee Paid' },
  { name: 'badDebtTransfer', label: 'Bad Debt Transfer' },
  { name: 'badDebtRecovered', label: 'Bad Debt Recovered' },
];

const initCheckboxState = (items) =>
  items.reduce((acc, { name }) => ({ ...acc, [name]: false }), {});

export default function TransactionListing() {
  const { branches, loading: branchesLoading } = useBranches();
  const [branch, setBranch] = useState('');
  const [user, setUser] = useState('');
  const [transactionRange, setTransactionRange] = useState('');
  const [transDateFrom, setTransDateFrom] = useState('');
  const [transDateTo, setTransDateTo] = useState('');
  const [postDateFrom, setPostDateFrom] = useState('');
  const [postDateTo, setPostDateTo] = useState('');
  const [sources, setSources] = useState(initCheckboxState(TRANSACTION_SOURCES));
  const [types, setTypes] = useState(initCheckboxState(TRANSACTION_TYPES));
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const branchOptions = useMemo(
    () => Array.from(new Set((Array.isArray(branches) ? branches : []).map(normalizeBranchName).filter(Boolean))),
    [branches],
  );

  const handleSourceChange = (e) => {
    const { name, checked } = e.target;
    setSources((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTypeChange = (e) => {
    const { name, checked } = e.target;
    setTypes((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePrint = () => {
    if (!branch) {
      setStatusMessage('Please select a branch before printing.');
      return;
    }
    setStatusMessage('');
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Transaction Listing
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Filter and print transaction records by branch, date range, source, and type.
        </Typography>
      </Box>

      {statusMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {statusMessage}
        </Alert>
      )}

      {/* Card 1: Filters */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Search Filters
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
            <TextField
              select
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              fullWidth
              disabled={branchesLoading}
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select a branch' }}
            >
              <MenuItem value="" disabled>Select a branch</MenuItem>
              {branchOptions.map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="User"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              size="small"
              fullWidth
              placeholder="Enter username"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Transaction Range"
              value={transactionRange}
              onChange={(e) => setTransactionRange(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g. 1 - 1000"
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
            <TextField
              label="Transaction Date From"
              type="date"
              value={transDateFrom}
              onChange={(e) => setTransDateFrom(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Transaction Date To"
              type="date"
              value={transDateTo}
              onChange={(e) => setTransDateTo(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              label="Post Date From"
              type="date"
              value={postDateFrom}
              onChange={(e) => setPostDateFrom(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Post Date To"
              type="date"
              value={postDateTo}
              onChange={(e) => setPostDateTo(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Card 2: Transaction Sources */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Transaction Sources
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 0 }}>
            {TRANSACTION_SOURCES.map(({ name, label }) => (
              <FormControlLabel
                key={name}
                control={
                  <Checkbox
                    checked={sources[name]}
                    onChange={handleSourceChange}
                    name={name}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{label}</Typography>}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Card 3: Transaction Types */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Transaction Types
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 0 }}>
            {TRANSACTION_TYPES.map(({ name, label }) => (
              <FormControlLabel
                key={name}
                control={
                  <Checkbox
                    checked={types[name]}
                    onChange={handleTypeChange}
                    name={name}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{label}</Typography>}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Batch & Product */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Batch & Product
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              select
              label="Select Batch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select batch' }}
            >
              <MenuItem value="" disabled>Select batch</MenuItem>
              <MenuItem value="batch-001">Batch 001</MenuItem>
              <MenuItem value="batch-002">Batch 002</MenuItem>
              <MenuItem value="batch-003">Batch 003</MenuItem>
            </TextField>

            <TextField
              select
              label="Select Product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select product' }}
            >
              <MenuItem value="" disabled>Select product</MenuItem>
              <MenuItem value="Development Loan">Development Loan</MenuItem>
              <MenuItem value="Emergency Loan">Emergency Loan</MenuItem>
              <MenuItem value="Regular Loan">Regular Loan</MenuItem>
              <MenuItem value="Consumer Loan">Consumer Loan</MenuItem>
              <MenuItem value="Building Loan">Building Loan</MenuItem>
              <MenuItem value="Tobaski Loan">Tobaski Loan</MenuItem>
              <MenuItem value="Regular Saving">Regular Saving</MenuItem>
              <MenuItem value="Shares">Shares</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Print Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={!branch || branchesLoading}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 4 }}
        >
          Print
        </Button>
      </Box>
    </Box>
  );
}
