import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
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
  CircularProgress,
  Backdrop,
  Alert,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { CurrencyAdornment } from '../../../components/FieldAdornments';
import { useAuthStore } from '../../../store/authStore';
import { useLoanDisbursementLoad } from './Hooks/useLoanDisbursementLoad';
import { useSaveDisbursement } from './Hooks/useSaveDisbursement';
import { useGetBanks } from './Hooks/useGetBanks';
import { useGetBankAccounts } from './Hooks/useGetBankAccounts';

const CLIENT_COLUMNS = [
  { field: 'ccustcode', headerName: 'Customer Code', flex: 1, minWidth: 120, sortable: true },
  { field: 'membername', headerName: 'Customer Name', flex: 1.5, minWidth: 200, sortable: true },
  {
    field: 'principal_amt',
    headerName: 'Principal Amount',
    flex: 1,
    minWidth: 140,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return 'D 0';
      const amount = parseFloat(params.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `D ${amount}`;
    },
  },
  {
    field: 'loan_interest',
    headerName: 'Interest',
    flex: 1,
    minWidth: 100,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return '0%';
      return `${params.value}%`;
    },
  },
  {
    field: 'loan_appl_date',
    headerName: 'Application Date',
    flex: 1,
    minWidth: 140,
    sortable: true,
    renderCell: (params) => {
      if (!params.value) return '';
      return dayjs(params.value).format('DD MMM YYYY');
    },
  },
  {
    field: 'loanstart_date',
    headerName: 'Start Date',
    flex: 1,
    minWidth: 140,
    sortable: true,
    renderCell: (params) => {
      if (!params.value) return '';
      return dayjs(params.value).format('DD MMM YYYY');
    },
  },
];

export default function LoanDisbursement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  const shouldAutoPrint = useRef(false);
  const user = useAuthStore((state) => state.user);
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
  const [selectedBankAccountNumber, setSelectedBankAccountNumber] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [disbursementDetails, setDisbursementDetails] = useState({
    transactionDate: dayjs(),
    amount: '',
    topUpAmount: '',
    accruedInterest: '',
    chequeNumber: '',
  });

  // Loan limit error logic
  // Get user limits from localStorage or user object
  let debitLimit = 0;
  let creditLimit = 0;
  // Prefer store user if present and has limits
  if (user && (user.DebitLimit || user.CreditLimit)) {
    debitLimit = Number(user.DebitLimit) || 0;
    creditLimit = Number(user.CreditLimit) || 0;
  } else {
    try {
      let userLimits = JSON.parse(localStorage.getItem('user'));
      if (userLimits && userLimits.user) {
        userLimits = userLimits.user;
      }
      debitLimit = Number(userLimits?.DebitLimit) || 0;
      creditLimit = Number(userLimits?.CreditLimit) || 0;
    } catch {
      debitLimit = 0;
      creditLimit = 0;
    }
  }

  // Compute limitError for loan disbursement, only if amount is present
  let limitError = '';
  const amountNum = Number(disbursementDetails.amount);
  if (disbursementDetails.amount !== '' && !isNaN(amountNum)) {
    if (debitLimit > 0 && amountNum > debitLimit) {
      limitError = `You are not allowed to disburse more than D ${debitLimit.toLocaleString()}.`;
    }
  }

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
        loanacct: item.loanacct || item.loan_id || '',
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
    setSelectedBankAccountNumber('');
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
    setSelectedBankAccountNumber('');
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

  // Helper: should Amount field be disabled?
  const isAmountBlocked = disbursementDetails.amount !== '' && Boolean(limitError);

  const handleSaveDisbursement = async () => {
    if (limitError) {
      setStatusMessage(limitError);
      setStatusError(true);
      return;
    }
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

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

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

      const branchId = parseInt(user?.BranchId) || 11;
      const cUserID = user?.username || 'SYSTEM';
      const cashAccount = user?.CashAccount || localStorage.getItem('cashAccount') || '';

      const payload = {
        LoanID: selectedLoan.loan_id,
        AccountNumber: String(selectedLoan.loanacct || selectedLoan.loan_id || ''),
        ContraAccount: paymentOption === 'cash' ? cashAccount : (selectedBankAccountNumber || ''),
        ControlAcct: String(selectedLoan.ControlAcct || '13100110101'),
        ChequeNo: disbursementDetails.chequeNumber || '',
        LoanProduct: 1,
        PaymentOption: paymentOptionMap[paymentOption] || 1,
        Amount: parseFloat(disbursementDetails.amount) || 0,
        TopUpAmount: parseFloat(disbursementDetails.topUpAmount) || 0,
        IsTopUp: parseFloat(disbursementDetails.topUpAmount) > 0,
        AccruedInterest: parseFloat(disbursementDetails.accruedInterest) || 0,
        TransactionDate: disbursementDetails.transactionDate.format('YYYY-MM-DDTHH:mm:ss'),
        cUserID: cUserID,
        lcurrcode: 1,
        lbranchid: branchId,
        llcBank: selectedBank || 1,
      };

      const result = await saveDisbursement(payload);

      setStatusMessage('Disbursement saved successfully.');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Loan / Loan Disbursement',
        action: 'Save Disbursement',
        message: 'Disbursement saved successfully.',
      });

      // Capture receipt from API response
      if (printReceipt) {
        shouldAutoPrint.current = true;
      }
      if (result?.Receipt) {
        setLastTransactionData({
          receipt: result.Receipt,
          message: result.Message || 'Disbursement inserted successfully.',
          timestamp: new Date().toLocaleString(),
        });
      }

      // Reset form
      setSelectedIds([]);
      setPaymentOption('');
      setSelectedBank('');
      setBankAccounts([]);
      setPrintReceipt(false);
      setDisbursementDetails({
        transactionDate: dayjs(),
        amount: '',
        topUpAmount: '',
        accruedInterest: '',
        chequeNumber: '',
      });

      // Auto dismiss success message and reload grid after 2 seconds
      setTimeout(() => {
        setStatusMessage('');
        loadDisbursementData();
      }, 2000);
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
    } finally {
      setIsSaving(false);
    }
  };


  // Move handlePrintReceipt above useEffect to avoid initialization error
  const handlePrintReceipt = useCallback(() => {
    if (!lastTransactionData) {
      setStatusMessage('Please save a disbursement first before printing a receipt.');
      setStatusError(true);
      return;
    }

    const receiptWindow = window.open('', '_blank', 'width=420,height=700');
    if (!receiptWindow) {
      setStatusMessage('Unable to open print window. Please allow pop-ups and try again.');
      setStatusError(true);
      return;
    }

    const receipt = lastTransactionData.receipt || {};
    const now = new Date();
    const printDate = now.toLocaleDateString();
    const printTime = now.toLocaleTimeString();
    const cashierName = user?.name || user?.username || '-';
    const amount = receipt.Amount != null ? parseFloat(receipt.Amount).toFixed(2) : '0.00';

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Disbursement Receipt</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
              padding: 20px;
              width: 380px;
              margin: 0 auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .center { text-align: center; }
            .bold { font-weight: 700; }
            .company-name { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
            .company-info { font-size: 11px; color: #333; margin-bottom: 1px; }
            .divider { border: none; border-top: 1px solid #000; margin: 10px 0; }
            .divider-double { border: none; border-top: 2px solid #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
            .row .label { color: #333; }
            .row .value { font-weight: 600; text-align: right; }
            .section-header { font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 8px 0 4px; text-align: center; letter-spacing: 1px; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; padding: 4px 0; }
            .sig-section { margin-top: 30px; font-size: 11px; }
            .sig-line { border-bottom: 1px solid #000; margin: 25px 0 4px; width: 60%; }
            .sig-label { font-size: 11px; color: #333; }
            .payment-by { margin-top: 20px; font-size: 12px; font-weight: 600; }
            .btn-row { text-align: center; margin-top: 20px; }
            .btn-row button {
              padding: 8px 20px; margin: 0 5px; font-size: 13px;
              border: none; border-radius: 4px; cursor: pointer; font-weight: 600;
            }
            .btn-print { background: #667eea; color: #fff; }
            .btn-print:hover { background: #5568d3; }
            .btn-close { background: #999; color: #fff; }
            .btn-close:hover { background: #777; }
            @page { size: 80mm auto; margin: 5mm; }
            @media print { .btn-row { display: none; } body { padding: 5px; } }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="company-name">${(receipt.CompanyName || 'MICROFINANCE').replace(/</g, '&lt;')}</div>
            <div class="company-info">${(receipt.Address || '').replace(/</g, '&lt;')}</div>
            <div class="company-info">${(receipt.Tel || '').replace(/</g, '&lt;')}</div>
            <div class="company-info">${(receipt.Email || '').replace(/</g, '&lt;')}</div>
          </div>

          <hr class="divider-double" />

          <div class="row">
            <span class="label">Print Date:</span>
            <span class="value">${printDate}</span>
          </div>
          <div class="row">
            <span class="label">Print Time:</span>
            <span class="value">${printTime}</span>
          </div>
          <div class="row">
            <span class="label">Receipt Number:</span>
            <span class="value">${(receipt.ReceiptNumber || '-').replace(/</g, '&lt;')}</span>
          </div>
          <div class="row">
            <span class="label">Customer Code:</span>
            <span class="value">${(receipt.ClientCode || '-').replace(/</g, '&lt;')}</span>
          </div>
          <div class="row">
            <span class="label">Customer Name:</span>
            <span class="value">${(receipt.ClientName || '-').replace(/</g, '&lt;')}</span>
          </div>

          <hr class="divider" />
          <div class="section-header">Disbursement Details</div>
          <hr class="divider" />

          <div class="row">
            <span class="label">Loan Disbursement</span>
            <span class="value">${amount}</span>
          </div>

          <hr class="divider" />
          <div class="total-row">
            <span>Total</span>
            <span>${amount}</span>
          </div>
          <hr class="divider-double" />

          <div class="sig-section">
            <div class="row">
              <span class="label">Cashier:</span>
              <span class="value">${cashierName.replace(/</g, '&lt;')}</span>
            </div>

            <div class="sig-line"></div>
            <div class="sig-label">Cashier Signature</div>

            <div class="sig-line"></div>
            <div class="sig-label">Customer Signature</div>
          </div>

          <div class="payment-by">Payment By: _________________</div>

          <div class="btn-row">
            <button class="btn-print" onclick="window.print()">&#128424; Print</button>
            <button class="btn-close" onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
  }, [lastTransactionData, setStatusMessage, setStatusError, user]);

  // Auto-print receipt after save when checkbox is checked
  useEffect(() => {
    if (lastTransactionData && shouldAutoPrint.current) {
      shouldAutoPrint.current = false;
      handlePrintReceipt();
    }
  }, [lastTransactionData, handlePrintReceipt]);

  const clientCount = clients.length;
  const selectedCount = selectedIds.length;

  return (
    <Box p={3} sx={{ position: 'relative' }}>
      {/* Loan limit error alert */}
      {disbursementDetails.amount !== '' && limitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {limitError}
        </Alert>
      )}
      {/* Loading Spinner */}
      <Backdrop
        open={isSaving}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={96} thickness={5} />
          <Typography variant="h6" fontWeight={800}>
            Saving disbursement...
          </Typography>
        </Box>
      </Backdrop>

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
          <Paper sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <div style={{ height: 420, width: '100%' }}>
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
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
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
                    backgroundColor: '#cfe2ff !important',
                    fontWeight: 700,
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#ffffff',
                  },
                  '&:hover': {
                    backgroundColor: '#e9ecef !important',
                  },
                },
                '& .MuiDataGrid-cell': {
                  borderColor: '#dee2e6',
                },
              }}
            />
            </div>
          </Paper>
        </Grid>

        {/* Disbursement Details Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Disbursement Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Payment Option Selection */}
                <Box>
                  <FormLabel sx={{ fontWeight: 600, color: '#2c3e50', mb: 2, display: 'block' }}>
                    Payment Option
                  </FormLabel>
                  <RadioGroup
                    aria-label="payment-option"
                    name="payment-option"
                    value={paymentOption}
                    onChange={handlePaymentOptionChange}
                    sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}
                  >
                    <FormControlLabel
                      value="cash"
                      control={<Radio sx={{ display: 'none' }} />}
                      label="💵 Cash"
                      sx={{
                        flex: 1,
                        m: 0,
                        p: 1.5,
                        border: '2px solid',
                        borderColor: paymentOption === 'cash' ? '#667eea' : '#e0e0e0',
                        borderRadius: 1.5,
                        bgcolor: paymentOption === 'cash' ? '#f0f4ff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: paymentOption === 'cash' ? 700 : 500,
                        color: paymentOption === 'cash' ? '#667eea' : '#2c3e50',
                        '&:hover': {
                          borderColor: '#667eea',
                          bgcolor: '#f0f4ff',
                        },
                      }}
                    />
                    <FormControlLabel
                      value="cheque"
                      control={<Radio sx={{ display: 'none' }} />}
                      label="🏦 Cheque"
                      sx={{
                        flex: 1,
                        m: 0,
                        p: 1.5,
                        border: '2px solid',
                        borderColor: paymentOption === 'cheque' ? '#667eea' : '#e0e0e0',
                        borderRadius: 1.5,
                        bgcolor: paymentOption === 'cheque' ? '#f0f4ff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: paymentOption === 'cheque' ? 700 : 500,
                        color: paymentOption === 'cheque' ? '#667eea' : '#2c3e50',
                        '&:hover': {
                          borderColor: '#667eea',
                          bgcolor: '#f0f4ff',
                        },
                      }}
                    />
                    <FormControlLabel
                      value="mobileWallet"
                      control={<Radio sx={{ display: 'none' }} />}
                      label="📱 Mobile Wallet"
                      sx={{
                        flex: 1,
                        m: 0,
                        p: 1.5,
                        border: '2px solid',
                        borderColor: paymentOption === 'mobileWallet' ? '#667eea' : '#e0e0e0',
                        borderRadius: 1.5,
                        bgcolor: paymentOption === 'mobileWallet' ? '#f0f4ff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: paymentOption === 'mobileWallet' ? 700 : 500,
                        color: paymentOption === 'mobileWallet' ? '#667eea' : '#2c3e50',
                        '&:hover': {
                          borderColor: '#667eea',
                          bgcolor: '#f0f4ff',
                        },
                      }}
                    />
                  </RadioGroup>
                </Box>

                {/* Cheque Payment Fields - 2 Column Layout */}
                {paymentOption === 'cheque' && (
                  <Grid container spacing={2}>
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
                        onChange={(e) => {
                          setSelectedBankAccount(e.target.value);
                          const selectedAccount = bankAccounts.find(acc => acc.id === e.target.value);
                          if (selectedAccount) {
                            setSelectedBankAccountNumber(selectedAccount.accno || selectedAccount.id);
                          }
                        }}
                        size="small"
                        disabled={loadingAccounts || !selectedBank}
                      >
                        <MenuItem value="">
                          <em>Select Account</em>
                        </MenuItem>
                        {bankAccounts.map((account) => (
                          <MenuItem key={account.id || account.name} value={account.id}>
                            {account.name || account.id}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Cheque Number"
                        name="chequeNumber"
                        value={disbursementDetails.chequeNumber}
                        onChange={handleDisbursementDetailsChange}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Disbursement Amount Fields - 2 Column Layout */}
                <Grid container spacing={2}>
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
                        startAdornment: <CurrencyAdornment />
                      }}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                      error={isAmountBlocked}
                      helperText={isAmountBlocked ? limitError : ''}
                      disabled={isAmountBlocked}
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
                        startAdornment: <CurrencyAdornment />
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
                        startAdornment: <CurrencyAdornment />
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
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Disbursement Button */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                  size="small"
                />
              }
              label="Print Receipt"
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleSaveDisbursement}
              disabled={isSaving || isAmountBlocked}
              startIcon={isSaving ? <CircularProgress size={18} /> : undefined}
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
              {isSaving ? 'Saving...' : '💾 Save Disbursement'}
            </Button>
            <Button
              variant="outlined"
              onClick={handlePrintReceipt}
              disabled={!lastTransactionData}
              sx={{
                fontWeight: 600,
                paddingX: 3,
                textTransform: 'none',
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': { borderColor: '#5568d3', backgroundColor: '#f0f4ff' },
                '&:disabled': { borderColor: '#ccc', color: '#ccc' },
              }}
            >
              🖨️ Print Receipt
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
