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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useBranches } from '../../hooks/useBranches';
import { buildTransactionListingPrintHtml } from './TransactionListing/printSetup';

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
  const [transDateFrom, setTransDateFrom] = useState(null);
  const [transDateTo, setTransDateTo] = useState(null);
  const [postDateFrom, setPostDateFrom] = useState(null);
  const [postDateTo, setPostDateTo] = useState(null);
  const [sources, setSources] = useState(initCheckboxState(TRANSACTION_SOURCES));
  const [types, setTypes] = useState(initCheckboxState(TRANSACTION_TYPES));
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

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

  const handlePrint = async () => {
    if (!branch) {
      setStatusMessage('Please select a branch before printing.');
      return;
    }
    setStatusMessage('');
    setIsPrinting(true);

    try {
      // Build payload matching backend structure
      const payload = {
        Currency: '',
        BranchID: parseInt(branch) || 0,
        BatchID: selectedBatch ? parseInt(selectedBatch.replace('batch-', '')) || 0 : 0,
        ProductID: 0,
        UserID: user || '',
        Deposit: sources.deposit ? '01' : '',
        Withdrawal: sources.withdrawal ? '02' : '',
        LoanIssued: sources.loanDisbursement ? '06' : '',
        LoanRepayment: sources.batchLoanRepayment ? '07' : '',
        InterestCharged: types.interestCharged ? '17' : '',
        InterestPaid: types.interestPaid ? '05' : '',
        SavingsInterest: sources.savingInterest ? '04' : '',
        FeeCharged: types.feePaid ? '27' : '',
        FeePaid: types.feePaid ? '15' : '',
        Adjustment: sources.adjustment ? '21' : '',
        Reversal: sources.reversal ? '16' : '',
        Transfer: sources.transfer ? '' : '',
        ChargeOff: sources.chargeOff ? '22' : '',
        WriteOff: types.withdrawal ? 'Loan Write off' : '',
        StandingOrder: '',
        DepositInterest: sources.savingInterest ? '24' : '',
        MobileMoneyTran: sources.mobileMoney ? '25' : '',
        ATM: sources.atm ? '26' : '',
        Dividend: sources.dividend ? '20' : '',
        InternetBanking: sources.internetBanking ? '27' : '',
        BadDebitTransfer: types.badDebtTransfer ? '11' : '',
        BadDebitRecovered: types.badDebtRecovered ? '10' : '',
        BatchInterestPaid: sources.batchInterestPaid ? '13' : '',
        BatchLoanRepayment: sources.batchLoanRepayment ? '08' : '',
        AnnualFee: types.annualFeePaid ? '14' : '',
        AnnualShares: sources.annualShares ? '18' : '',
        TranFromDate: transDateFrom ? transDateFrom.format('YYYY-MM-DD 00:00:00') : null,
        TranToDate: transDateTo ? transDateTo.format('YYYY-MM-DD 23:59:59') : null,
        PostFromDate: postDateFrom ? postDateFrom.format('YYYY-MM-DD 00:00:00') : null,
        PostToDate: postDateTo ? postDateTo.format('YYYY-MM-DD 23:59:59') : null,
      };

      const response = await fetch('/api/transactionlisting/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const printHtml = buildTransactionListingPrintHtml(data);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printHtml);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        const errorData = await response.text();
        setStatusMessage(`Error: ${errorData || 'Failed to fetch transaction data.'}`);
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
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

      {/* Two Column Layout: Search Filters & Transaction Sources */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
        {/* Card 1: Filters */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
              <DatePicker
                label="Transaction Date From"
                value={transDateFrom}
                onChange={(value) => setTransDateFrom(value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
              <DatePicker
                label="Transaction Date To"
                value={transDateTo}
                onChange={(value) => setTransDateTo(value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <DatePicker
                label="Post Date From"
                value={postDateFrom}
                onChange={(value) => setPostDateFrom(value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
              <DatePicker
                label="Post Date To"
                value={postDateTo}
                onChange={(value) => setPostDateTo(value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Card 2: Transaction Sources */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
              Transaction Sources
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' }, gap: 0 }}>
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
      </Box>

      {/* Two Column Layout: Transaction Types & Batch & Product */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
        {/* Card 3: Transaction Types */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
              Transaction Types
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 0 }}>
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

        {/* Card 4: Batch & Product */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
      </Box>

      {/* Print Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={!branch || branchesLoading || isPrinting}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 4 }}
        >
          {isPrinting ? 'Loading...' : 'Print'}
        </Button>
      </Box>
    </Box>
  );
}
