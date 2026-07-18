import React, { useMemo, useState, useEffect } from 'react';
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
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useBranches } from '../../hooks/useBranches';
import { useUsers } from '../../hooks/useUsers';
import { buildTransactionListingPrintHtml } from './TransactionListing/printSetup';

const normalizeBranchName = (branch) => (
  branch?.branchName
  || branch?.br_name
  || branch?.name
  || branch?.branch
  || ''
).toString().trim();

const normalizeBranchId = (branch) => (
  branch?.branchid
  ?? branch?.BranchID
  ?? branch?.branchId
  ?? branch?.br_id
  ?? branch?.id
  ?? ''
).toString().trim();

const ALL_BRANCHES_VALUE = 'ALL';

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

const normalizeReportRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.Table)) return payload.Table;
  if (Array.isArray(payload?.table)) return payload.table;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.Table)) return payload.data.Table;
  if (Array.isArray(payload?.data?.table)) return payload.data.table;
  return [];
};

const escapeCSV = (value) => {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
};

const formatAmount = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const fullNameOf = (row) => {
  // Try ccustname first, fall back to combination of fname/mname/lname
  const custName = String(row?.ccustname ?? '').trim();
  if (custName) {
    return custName;
  }
  const first = String(row?.ccustfname ?? '').trim();
  const middle = String(row?.ccustmname ?? '').trim();
  const last = String(row?.ccustlname ?? '').trim();
  return [first, middle, last].filter(Boolean).join(' ');
};

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

export default function TransactionListing() {
  const { branches, loading: branchesLoading } = useBranches();
  const { users, isLoading: usersLoading, fetchUsers } = useUsers();
  const [branch, setBranch] = useState(ALL_BRANCHES_VALUE);
  const [user, setUser] = useState('');
  const [transactionRange, setTransactionRange] = useState('');
  const [transDateFrom, setTransDateFrom] = useState(null);
  const [transDateTo, setTransDateTo] = useState(() => dayjs());
  const [postDateFrom, setPostDateFrom] = useState(() => dayjs('1960-01-01'));
  const [postDateTo, setPostDateTo] = useState(() => dayjs('2089-12-31'));
  const [sources, setSources] = useState(initCheckboxState(TRANSACTION_SOURCES));
  const [types, setTypes] = useState(initCheckboxState(TRANSACTION_TYPES));
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const branchOptions = useMemo(
    () => {
      const rows = Array.isArray(branches) ? branches : [];
      const byId = new Map();

      rows.forEach((item) => {
        const id = normalizeBranchId(item);
        const name = normalizeBranchName(item);

        if (!id || !name || byId.has(id)) {
          return;
        }

        byId.set(id, { id, name });
      });

      return Array.from(byId.values());
    },
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

  const handleClear = () => {
    setBranch(ALL_BRANCHES_VALUE);
    setUser('');
    setTransactionRange('');
    setTransDateFrom(null);
    setTransDateTo(dayjs());
    setPostDateFrom(dayjs('1960-01-01'));
    setPostDateTo(dayjs('2089-12-31'));
    setSources(initCheckboxState(TRANSACTION_SOURCES));
    setTypes(initCheckboxState(TRANSACTION_TYPES));
    setSelectedBatch('');
    setSelectedProduct('');
    setStatusMessage('');
  };

  const formatDateTime = (value, fallbackDate, endOfDay = false) => {
    if (value?.format) {
      return value.format(`YYYY-MM-DD ${endOfDay ? '23:59:59' : '00:00:00'}`);
    }
    return `${fallbackDate} ${endOfDay ? '23:59:59' : '00:00:00'}`;
  };

  const buildPayload = () => ({
    Currency: '',
    BranchID: branch === ALL_BRANCHES_VALUE ? 0 : parseInt(branch, 10) || 0,
    BatchID: selectedBatch ? parseInt(selectedBatch.replace('batch-', '')) || 0 : 0,
    ProductID: 0,
    UserID: user || '',
    cUserID: user || '',
    Deposit: types.deposit ? '01' : '',
    Withdrawal: types.withdrawal ? '02' : '',
    LoanIssued: types.loanDisbursement ? '06' : '',
    LoanRepayment: types.loanRepayment ? '07' : '',
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
    TranFromDate: formatDateTime(transDateFrom, '1900-01-01'),
    TranToDate: formatDateTime(transDateTo, '2100-12-31', true),
    PostFromDate: formatDateTime(postDateFrom, '1960-01-01'),
    PostToDate: formatDateTime(postDateTo, '2089-12-31', true),
  });

  const fetchTransactionData = async () => {
    const response = await fetch('/api/transactionlisting/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to fetch transaction data.');
    }

    const data = await response.json();
    const rows = normalizeReportRows(data);

    if (rows.length === 0) {
      throw new Error('No transaction data found for the selected filters.');
    }

    return { data, rows };
  };

  const handleExportPDF = (data) => {
    const printHtml = buildTransactionListingPrintHtml(data);
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      throw new Error('Unable to open print preview. Please allow pop-ups and try again.');
    }

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    let didPrint = false;
    const triggerPrint = () => {
      if (didPrint || printWindow.closed) return;
      didPrint = true;
      printWindow.focus();
      printWindow.print();
    };

    printWindow.onload = () => {
      triggerPrint();
    };

    window.setTimeout(() => {
      triggerPrint();
    }, 250);
  };

  const convertToCSV = (rows) => {
    const headers = ['Account Number', 'Full Name', 'Transaction Date', 'Credit', 'Debit', 'Description', 'Branch'];

    const csvRows = rows.map((row) => {
      const amount = Number(row?.ntranamnt ?? 0);
      const credit = amount > 0 ? formatAmount(amount) : '';
      const debit = amount < 0 ? formatAmount(Math.abs(amount)) : '';

      const userValue = (row?.cuserid || row?.gcUserid || row?.cUserID || row?.username || row?.oprcode || '').toString().trim();
      const name = fullNameOf(row);
      const displayName = userValue ? `${name} (User: ${userValue})` : name;

      return [
        String(row?.cacctnumb ?? '').trim(),
        displayName,
        formatDate(row?.dtrandate),
        credit,
        debit,
        String(row?.ctrandesc ?? '').trim(),
        String(row?.br_name ?? '').trim(),
      ];
    });

    return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
  };

  const handleExportCSV = (rows) => {
    const csvContent = convertToCSV(rows);
    const filename = `transaction-listing-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const handleExportExcel = (rows) => {
    const csvContent = convertToCSV(rows);
    const filename = `transaction-listing-${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleExport = async (exportType) => {
    setStatusMessage('');
    setIsPrinting(true);

    try {
      const { data, rows } = await fetchTransactionData();

      if (exportType === 'pdf') {
        handleExportPDF(data);
      } else if (exportType === 'excel') {
        handleExportExcel(rows);
      } else if (exportType === 'csv') {
        handleExportCSV(rows);
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
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (v) => {
                    if (!v || v === ALL_BRANCHES_VALUE) return 'All Branches';
                    const option = branchOptions.find((item) => item.id === v);
                    return option?.name || 'All Branches';
                  },
                }}
              >
                <MenuItem value={ALL_BRANCHES_VALUE}>All Branches</MenuItem>
                {branchOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="User"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                size="small"
                fullWidth
                disabled={usersLoading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return 'Select a user';
                    }

                    const option = users.find((item) => item.value === selected);
                    return option?.label || selected;
                  },
                }}
              >
                <MenuItem value="">
                  All Users
                </MenuItem>
                {users.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
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

      {/* Export Buttons */}
      <Box sx={{ mt: 1, display: 'flex', gap: 1.5, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => handleExport('pdf')}
          disabled={branchesLoading || isPrinting}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 4 }}
        >
          PDF
        </Button>

        <Button
          variant="contained"
          onClick={() => handleExport('excel')}
          disabled={branchesLoading || isPrinting}
          sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
        >
          Excel
        </Button>

        <Button
          variant="contained"
          onClick={() => handleExport('csv')}
          disabled={branchesLoading || isPrinting}
          sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
        >
          CSV
        </Button>

        <Button
          variant="text"
          onClick={handleClear}
          disabled={isPrinting}
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Clear
        </Button>
      </Box>

      <Backdrop
        open={isPrinting}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
