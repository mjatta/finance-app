import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { useLoanDisbursementLoad } from './Hooks/useLoanDisbursementLoad';
import { useSaveDisbursement } from './Hooks/useSaveDisbursement';
import { useGetBanks } from './Hooks/useGetBanks';
import { useGetBankAccounts } from './Hooks/useGetBankAccounts';

const CLIENT_COLUMNS = [
  { field: 'ccustcode', headerName: 'Customer Code', flex: 1, minWidth: 120, sortable: true },
  { field: 'membername', headerName: 'Customer Name', flex: 1.5, minWidth: 200, sortable: true },
  { field: 'principal_amt', headerName: 'Principal Amount', flex: 1, minWidth: 140, sortable: true },
  { field: 'loan_interest', headerName: 'Interest', flex: 1, minWidth: 100, sortable: true },
  { field: 'loan_appl_date', headerName: 'Application Date', flex: 1, minWidth: 140, sortable: true },
  { field: 'loanstart_date', headerName: 'Start Date', flex: 1, minWidth: 140, sortable: true },
];

export default function LoanDisbursement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [sortModel, setSortModel] = useState([]);

  const [paymentOption, setPaymentOption] = useState(''); // 'cash', 'cheque', 'mobileWallet'
  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [disbursementDetails, setDisbursementDetails] = useState({
    transactionDate: dayjs(),
    amount: '',
    topUpAmount: '',
    accruedInterest: '',
  });

  const { fetchLoanDisbursementData } = useLoanDisbursementLoad();
  const { saveDisbursement } = useSaveDisbursement();
  const { fetchBanks } = useGetBanks();
  const { fetchBankAccounts } = useGetBankAccounts();

  const loadDisbursementData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLoanDisbursementData();

      if (!data || !data.clients || data.clients.length === 0) {
        setClients([]);
        setStatusMessage('No clients available for disbursement.');
        setStatusError(false);
        return;
      }

      // Transform API response to table rows
      const mappedClients = data.clients.map((item, index) => ({
        id: item.loan_id || index,
        ccustcode: item.ccustcode || '',
        membername: item.membername || '',
        principal_amt: item.principal_amt || '0',
        loan_interest: item.loan_interest || '0',
        loan_appl_date: item.loan_appl_date || '',
        loanstart_date: item.loanstart_date || '',
        maturity_date: item.maturity_date || '',
        lduration_num: item.lduration_num || '',
        repayment_amt: item.repayment_amt || '0',
        LOAN_STATUS: item.LOAN_STATUS || '',
        nofpayments: item.nofpayments || '',
        totinterest: item.totinterest || '0',
        loantype: item.loantype || '',
        loan_id: item.loan_id || '',
        ctel: item.ctel || '',
      }));

      setClients(mappedClients);
      setStatusMessage('');
      setStatusError(false);

      // Fetch banks if available
      if (data.banks && data.banks.length > 0) {
        const cleanBanks = data.banks.map(bank => ({
          bnk_id: bank.bnk_id,
          bnk_name: (bank.bnk_name || '').trim(),
        }));
        setBanks(cleanBanks);
      }
    } catch (error) {
      console.error('Failed to load disbursement data:', error);
      setStatusMessage('Failed to load disbursement data.');
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Disbursement',
        action: 'Load Data',
        message: 'Failed to load disbursement data.',
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchLoanDisbursementData]);

  useEffect(() => {
    loadDisbursementData();
  }, [loadDisbursementData]);

  const handleRowClick = (params) => {
    const loanId = params.id;
    const selectedLoan = clients.find((c) => c.id === loanId);

    if (selectedIds.includes(loanId)) {
      setSelectedIds(selectedIds.filter((id) => id !== loanId));
      setDisbursementDetails({
        transactionDate: dayjs(),
        amount: '',
        topUpAmount: '',
        accruedInterest: '',
      });
    } else {
      setSelectedIds([loanId]);
      if (selectedLoan) {
        setDisbursementDetails({
          transactionDate: dayjs(),
          amount: selectedLoan.principal_amt || '',
          topUpAmount: '',
          accruedInterest: selectedLoan.totinterest || '',
        });
      }
    }
  };

  const handlePaymentOptionChange = (e) => {
    const paymentType = e.target.value;
    setPaymentOption(paymentType);
    setSelectedBank('');
    setSelectedBankAccount('');
    setBankAccounts([]);

    // If cheque is selected, fetch banks
    if (paymentType === 'cheque') {
      setLoadingBanks(true);
      fetchBanks().then((result) => {
        if (result.success && result.data) {
          // Map the fetched banks to the format used by the dropdown
          const banksList = result.data.map((bank) => ({
            bnk_id: bank.id,
            bnk_name: bank.name,
          }));
          setBanks(banksList);
        } else {
          setBanks([]);
          setStatusMessage('Failed to load banks.');
          setStatusError(true);
        }
        setLoadingBanks(false);
      });
    } else {
      setBanks([]);
    }
  };

  const handleBankChange = (e) => {
    const bankId = e.target.value;
    setSelectedBank(bankId);
    setSelectedBankAccount('');
    setBankAccounts([]);

    if (!bankId) return;

    setLoadingAccounts(true);
    fetchBankAccounts(bankId).then((result) => {
      if (result.success && result.data) {
        // Map the fetched accounts to the format used by the dropdown
        const accountsList = result.data.map((account) => ({
          id: account.id,
          name: account.name,
        }));
        setBankAccounts(accountsList);
      } else {
        setBankAccounts([]);
        setStatusMessage('Failed to fetch bank accounts.');
        setStatusError(true);
      }
      setLoadingAccounts(false);
    });
  };

  const handleDisbursementDetailsChange = (e) => {
    const { name, value } = e.target;
    setDisbursementDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setDisbursementDetails((prev) => ({ ...prev, amount: cleanValue }));
  };

  const handleTopUpAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setDisbursementDetails((prev) => ({ ...prev, topUpAmount: cleanValue }));
  };

  const handleAccruedInterestChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setDisbursementDetails((prev) => ({ ...prev, accruedInterest: cleanValue }));
  };

  const handleSaveDisbursement = async () => {
    if (selectedIds.length === 0) {
      setStatusMessage('Please select a client.');
      setStatusError(true);
      return;
    }

    if (!paymentOption) {
      setStatusMessage('Please select a payment option.');
      setStatusError(true);
      return;
    }

    if (paymentOption === 'cheque' && !selectedBank) {
      setStatusMessage('Please select a bank for cheque payment.');
      setStatusError(true);
      return;
    }

    if (!disbursementDetails.amount) {
      setStatusMessage('Please enter the disbursement amount.');
      setStatusError(true);
      return;
    }

    try {
      const selectedLoan = clients.find((c) => c.id === selectedIds[0]);
      if (!selectedLoan) {
        setStatusMessage('Selected loan not found.');
        setStatusError(true);
        return;
      }

      const paymentOptionMap = {
        cash: 1,
        cheque: 2,
        mobileWallet: 3,
      };

      const payload = {
        LoanID: selectedLoan.loan_id,
        AccountNumber: '',
        ContraAccount: paymentOption === 'cash' ? 'CASH001' : selectedBankAccount || '',
        CashAccount: paymentOption === 'cash' ? 'CASH001' : '',
        LoanProduct: 5,
        PaymentOption: paymentOptionMap[paymentOption] || 1,
        Amount: parseFloat(disbursementDetails.amount) || 0,
        TopUpAmount: parseFloat(disbursementDetails.topUpAmount) || 0,
        IsTopUp: parseFloat(disbursementDetails.topUpAmount) > 0,
        AccruedInterest: parseFloat(disbursementDetails.accruedInterest) || 0,
        TransactionDate: disbursementDetails.transactionDate.format('YYYY-MM-DD'),
      };

      await saveDisbursement(payload);

      setStatusMessage('Disbursement saved successfully.');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Loan / Loan Disbursement',
        action: 'Save Disbursement',
        message: 'Disbursement saved successfully.',
      });

      // Reset form
      setSelectedIds([]);
      setPaymentOption('');
      setSelectedBank('');
      setBankAccounts([]);
      setDisbursementDetails({
        transactionDate: dayjs(),
        amount: '',
        topUpAmount: '',
        accruedInterest: '',
      });
    } catch (error) {
      console.error('Failed to save disbursement:', error);
      setStatusMessage('Failed to save disbursement.');
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Disbursement',
        action: 'Save Disbursement',
        message: 'Failed to save disbursement.',
        error,
      });
    }
  };

  const clientCount = clients.length;
  const selectedCount = selectedIds.length;

  return (
    <Box p={3}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Disbursement
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Process and manage loan disbursements to clients
        </Typography>
      </Box>

      {/* Statistics Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: '#e3f2fd',
            borderRadius: 1.5,
            border: '1px solid #bbdefb',
          }}
        >
          <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
            Total Clients
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1565c0' }}>
            {clientCount}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: '#f3e5f5',
            borderRadius: 1.5,
            border: '1px solid #e1bee7',
          }}
        >
          <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600 }}>
            Selected
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#6a1b9a' }}>
            {selectedCount}
          </Typography>
        </Box>
      </Box>

      {statusMessage && (
        <Box
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 1.5,
            bgcolor: statusError ? '#ffebee' : '#f1f8e9',
            borderLeft: `4px solid ${statusError ? '#c62828' : '#558b2f'}`,
            border: `1px solid ${statusError ? '#ef5350' : '#9ccc65'}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: statusError ? '#c62828' : '#558b2f',
              fontWeight: 500,
            }}
          >
            {statusError ? '❌' : '✅'} {statusMessage}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={loadDisbursementData}
          disabled={loading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
          }}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </Button>
      </Box>

      {/* Main Grid Layout */}
      <Grid container spacing={3}>
        {/* Clients DataGrid */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
            Clients for Disbursement
          </Typography>
          <Box
            sx={{
              height: 400,
              width: '100%',
              borderRadius: 1.5,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              mb: 3,
            }}
          >
            <DataGrid
              rows={clients}
              columns={CLIENT_COLUMNS}
              loading={loading}
              pageSizeOptions={[5, 10, 25]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              onRowClick={handleRowClick}
              getRowClassName={(params) => {
                if (selectedIds.includes(params.id)) {
                  return 'selected-row';
                }
                return '';
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#ffffff',
                },
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: '#2c3e50',
                  borderBottom: '2px solid #1a252f',
                },
                '& .MuiDataGrid-footerContainer': {
                  backgroundColor: '#f5f5f5',
                  borderTop: '1px solid #e0e0e0',
                  fontWeight: 500,
                },
                '& .MuiTablePagination-root': {
                  color: '#2c3e50',
                  fontWeight: 500,
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&.selected-row': {
                    backgroundColor: '#1976d2 !important',
                    color: '#ffffff',
                    fontWeight: 600,
                    '& .MuiDataGrid-cell': {
                      color: '#ffffff',
                      borderBottomColor: '#1565c0',
                    },
                    '&:hover': {
                      backgroundColor: '#1565c0 !important',
                    },
                  },
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#fafafa',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: '#ffffff',
                  },
                  '&:hover': {
                    backgroundColor: '#f0f0f0 !important',
                  },
                },
              }}
            />
          </Box>
        </Grid>

        {/* Disbursement Details Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
                Disbursement Details
              </Typography>

              <Grid container spacing={2}>
                {/* Payment Option Selection */}
                <Grid size={{ xs: 12 }}>
                  <FormControl sx={{ mb: 3 }} component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
                      Payment Option
                    </FormLabel>
                    <RadioGroup
                      row
                      aria-label="payment-option"
                      name="payment-option"
                      value={paymentOption}
                      onChange={handlePaymentOptionChange}
                      sx={{ gap: 3 }}
                    >
                      <FormControlLabel
                        value="cash"
                        control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />}
                        label="Cash"
                        sx={{ fontWeight: 500, color: '#2c3e50' }}
                      />
                      <FormControlLabel
                        value="cheque"
                        control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />}
                        label="Cheque"
                        sx={{ fontWeight: 500, color: '#2c3e50' }}
                      />
                      <FormControlLabel
                        value="mobileWallet"
                        control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />}
                        label="Mobile Wallet"
                        sx={{ fontWeight: 500, color: '#2c3e50' }}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* Cheque Payment Fields */}
                {paymentOption === 'cheque' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Bank Name"
                        value={selectedBank}
                        onChange={handleBankChange}
                        size="small"
                        disabled={loadingBanks}
                      >
                        <MenuItem value="">
                          <em>Select Bank</em>
                        </MenuItem>
                        {banks.map((bank) => (
                          <MenuItem key={bank.bnk_id} value={bank.bnk_id}>
                            {bank.bnk_name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Bank Account"
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        size="small"
                        disabled={loadingAccounts || !selectedBank}
                      >
                        <MenuItem value="">
                          <em>Select Account</em>
                        </MenuItem>
                        {bankAccounts.map((account) => (
                          <MenuItem key={account.id || account.name} value={account.name || account.id}>
                            {account.name || account.id}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </>
                )}

                {/* Disbursement Amount Fields */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    value={formatCurrency(disbursementDetails.amount)}
                    onChange={handleAmountChange}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Top Up Amount"
                    name="topUpAmount"
                    value={formatCurrency(disbursementDetails.topUpAmount)}
                    onChange={handleTopUpAmountChange}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Accrued Interest"
                    name="accruedInterest"
                    value={formatCurrency(disbursementDetails.accruedInterest)}
                    onChange={handleAccruedInterestChange}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Transaction Date"
                      value={disbursementDetails.transactionDate}
                      onChange={(newDate) =>
                        setDisbursementDetails((prev) => ({
                          ...prev,
                          transactionDate: newDate,
                        }))
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          variant: 'outlined',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Disbursement Button */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveDisbursement}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                '&:disabled': { backgroundColor: '#ccc', color: '#999' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              💾 Save Disbursement
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
