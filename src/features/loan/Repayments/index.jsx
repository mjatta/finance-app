import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Backdrop,
  CircularProgress,
  Skeleton,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import dayjs from 'dayjs';
import { useGetLoanRepaymentAccount } from './hooks/useGetLoanRepaymentAccount';
import { useInsertLoanRepayment } from './hooks/useInsertLoanRepayment';
import { useGetMemberDetails } from '../../member/DepositManagement/hooks/useGetMemberDetails';
import { useGetAccountDetails } from '../../member/DepositManagement/hooks/useGetAccountDetails';
import { useGetBanks } from '../../member/DepositManagement/hooks/useGetBanks';
import { useGetBankAccounts } from '../../member/DepositManagement/hooks/useGetBankAccounts';
import { useAuthStore } from '../../../store/authStore';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';



// Placeholder for profile/signature images
const defaultProfileImage = '/src/assets/company-logo.jpg';

export default function Repayments() {

    const [printReceipt, setPrintReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const shouldAutoPrint = useRef(false);
  // Print receipt handler (copied and adapted from Deposit page)
  const handlePrintReceipt = React.useCallback(() => {
    if (!lastReceipt) {
      setStatusMessage('Please save a repayment first before printing a receipt.');
      setStatusError(true);
      return;
    }
    const receiptWindow = window.open('', '_blank', 'width=420,height=700');
    if (!receiptWindow) {
      setStatusMessage('Unable to open print window. Please allow pop-ups and try again.');
      setStatusError(true);
      return;
    }
    const receipt = lastReceipt;
    const now = new Date();
    const printDate = now.toLocaleDateString();
    const printTime = now.toLocaleTimeString();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cashierName = user?.name || user?.username || '-';
    const amount = receipt.Amount != null ? parseFloat(receipt.Amount).toFixed(2) : '0.00';
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Repayment Receipt</title>
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
            <span class="value">${receipt.ReceiptNumber || '-'}</span>
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
          <div class="section-header">Transaction Details</div>
          <hr class="divider" />
          <div class="row">
            <span class="label">Repayment</span>
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
            <button class="btn-print" onclick="window.print()">🖨️ Print</button>
            <button class="btn-close" onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
  }, [lastReceipt]);

  // Auto-print receipt after save when checkbox is checked
  useEffect(() => {
    if (lastReceipt && printReceipt && shouldAutoPrint.current) {
      shouldAutoPrint.current = false;
      handlePrintReceipt();
    }
  }, [lastReceipt, printReceipt, handlePrintReceipt]);
  // Insert loan repayment hook
  const { insertLoanRepayment } = useInsertLoanRepayment();

  // Save repayment handler
  const handleSaveRepayment = async () => {
    const parseLocalStorageJson = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const appState = parseLocalStorageJson('State');
    const stateUser = appState?.users || appState?.user || null;
    const persistedAuth = parseLocalStorageJson('microfinance-auth');
    const persistedUser = persistedAuth?.state?.user || null;
    const legacyUser = parseLocalStorageJson('user') || {};

    const resolvedUsername =
      stateUser?.username ||
      persistedUser?.username ||
      legacyUser?.username ||
      legacyUser?.UserName ||
      '';

    const resolvedBranchId =
      stateUser?.BranchId ??
      stateUser?.branchId ??
      persistedUser?.BranchId ??
      persistedUser?.branchId ??
      legacyUser?.BranchId ??
      legacyUser?.branchId ??
      '';

    const payload = {
      accountNumber: formData.accountNumber,
      productId: formData.loanProductId,
      repaymentType: formData.repaymentType,
      repaymentAmount: formData.repaymentAmount,
      totalAccruedInterest: formData.totalAccruedInterest || 0,
      transactionDate: formData.transactionDate,
      checkNumber: formData.checkNumber,
      username: resolvedUsername,
      branchId: resolvedBranchId,
    };
    const result = await insertLoanRepayment(payload);
    if (result) {
      setStatusMessage('Repayment saved successfully!');
      setStatusError(false);
      if (result.Receipt) {
        setLastReceipt(result.Receipt);
        if (printReceipt) {
          shouldAutoPrint.current = true;
        }
      }
      // Reset all fields after 7 seconds, like deposit
      setTimeout(() => {
        setFormData({
          memberCode: '',
          profilePicture: '',
          memberSignature: '',
          phoneNumber: '',
          postingAccount: '',
          memberAccounts: [],
          loanAccounts: [],
          transactionDate: dayjs().format('YYYY-MM-DD'),
          repaymentAmount: '',
          loanProductId: '',
          loanBalance: undefined,
          calculatedInterest: undefined,
          storedAccruedInterest: undefined,
          totalAccruedInterest: 0,
          repayment: undefined,
          duration: undefined,
          startDate: undefined,
          accountNumber: '',
          customerCode: '',
          bookBalance: undefined,
          unclearedBalance: undefined,
          clearedBalance: undefined,
          controlAccount: '',
          interestAccount: '',
          badDebtAccount: '',
          repaymentType: '',
          checkNumber: '',
          checkDate: '',
          bank: '',
          bankAccount: '',
          contraAccount: '',
          cashAccount: '',
          creditLimit: '',
          debitLimit: '',
          loanLimit: '',
        });
        setLastReceipt(null);
        setTouched({});
        setStatusMessage('');
        setStatusError(false);
      }, 7000);
    } else {
      setStatusMessage('Failed to save repayment.');
      setStatusError(true);
    }
  };
  // State
  const todayIso = dayjs().format('YYYY-MM-DD');
  const [formData, setFormData] = useState({
    memberCode: '',
    profilePicture: '',
    memberSignature: '',
    phoneNumber: '',
    postingAccount: '',
    memberAccounts: [],
    loanAccounts: [],
    transactionDate: todayIso,
    repaymentAmount: '',
    loanProductId: '',
    loanBalance: undefined,
    calculatedInterest: undefined,
    storedAccruedInterest: undefined,
    totalAccruedInterest: 0,
    // comments: '',
    // Loan details
    repayment: undefined,
    duration: undefined,
    startDate: undefined,
    accountNumber: '',
    customerCode: '',
    bookBalance: undefined,
    unclearedBalance: undefined,
    clearedBalance: undefined,
    controlAccount: '',
    interestAccount: '',
    badDebtAccount: '',
    // Repayment type details
    repaymentType: '',
    checkNumber: '',
    checkDate: '',
    bank: '',
    bankAccount: '',
    contraAccount: '',
    cashAccount: '',
    creditLimit: '',
    debitLimit: '',
    loanLimit: '',
  });
      // Bank and account state for dropdowns
      const [banks, setBanks] = useState([]);
      const [bankAccounts, setBankAccounts] = useState([]);
      const user = useAuthStore((state) => state.user);
      const { fetchBanks } = useGetBanks();
      const { fetchBankAccounts } = useGetBankAccounts();
      // Handle Repayment Type change
      const handleRepaymentTypeChange = async (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
          ...prev,
          repaymentType: value,
          // Reset details on type change
          checkNumber: '',
          checkDate: '',
          bank: '',
          bankAccount: '',
          contraAccount: '',
          cashAccount: '',
          creditLimit: '',
          debitLimit: '',
          loanLimit: '',
        }));
        if (value === 'cheque' || value === 'bank') {
          const result = await fetchBanks();
          if (result && result.success && result.data) setBanks(result.data);
          else setBanks([]);
          setBankAccounts([]);
        } else if (value === 'cash' && user) {
          setFormData((prev) => ({
            ...prev,
            cashAccount: user.CashAccount || '',
            contraAccount: user.CashAccount || '',
            debitLimit: user.DebitLimit != null ? String(user.DebitLimit) : '',
            creditLimit: user.CreditLimit != null ? String(user.CreditLimit) : '',
            loanLimit: user.LoanLimit != null ? String(user.LoanLimit) : '',
          }));
          setBanks([]);
          setBankAccounts([]);
        } else {
          setBanks([]);
          setBankAccounts([]);
        }
      };
      // Handle bank change
      const handleBankChange = async (e) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, bank: value, bankAccount: '', contraAccount: '' }));
        if (value) {
          const result = await fetchBankAccounts(value);
          if (result && result.success && result.data) setBankAccounts(result.data);
          else setBankAccounts([]);
        } else {
          setBankAccounts([]);
        }
      };
      // Handle bank account change
      const handleBankAccountChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, bankAccount: value, contraAccount: value }));
      };
    // Fetch loan details from new endpoint
    const fetchLoanDetails = useCallback(async (accountNumber, tranDate) => {
      setLoadingAccountDetails(true);
      try {
        const url = `http://alakuyateh-001-site10.atempurl.com/api/LoanRepayment/getLoanRepaymentAccount?accountNumber=${encodeURIComponent(accountNumber)}&ncompid=30&tranDate=${tranDate}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch loan details');
        const data = await resp.json();
        setFormData((prev) => ({
          ...prev,
          accountNumber: data.AccountNumber || '',
          customerCode: data.CustomerCode || '',
          bookBalance: data.Details?.BookBalance ?? '',
          unclearedBalance: data.Details?.UnclearedBalance ?? '',
          clearedBalance: data.Details?.ClearedBalance ?? '',
          controlAccount: data.Details?.ControlAccount || '',
          interestAccount: data.Details?.InterestAccount || '',
          badDebtAccount: data.Details?.BadDebtAccount || '',
          loanBalance: data.AccruedInterest?.LoanBalance ?? '',
          calculatedInterest: data.AccruedInterest?.CalculatedInterest ?? '',
          storedAccruedInterest: data.AccruedInterest?.StoredAccruedInterest ?? '',
          repayment: data.Loan?.Repayment ?? '',
          duration: data.Loan?.Duration ?? '',
          startDate: data.Loan?.StartDate || '',
          loanProductId: data.Loan?.ProductID ?? '',
          totalAccruedInterest: data.AccruedInterest?.TotalAccruedInterest ?? 0,
        }));
      } finally {
        setLoadingAccountDetails(false);
      }
    }, []);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [loadingAccountDetails, setLoadingAccountDetails] = useState(false);
  const [touched, setTouched] = useState({});

  // Hooks
  const { fetchLoanRepaymentAccount } = useGetLoanRepaymentAccount();
  const { fetchMemberDetails } = useGetMemberDetails();
  useGetAccountDetails(); // Only call for side effects if any

  // Search member by code
  const searchMember = useCallback(async () => {
    if (!formData.memberCode) return;
    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);
    try {
      const member = await fetchMemberDetails(formData.memberCode);
      if (!member) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: '',
          memberSignature: '',
          phoneNumber: '',
          memberAccounts: [],
          loanAccounts: [],
          accountBalance: '',
          accountNumber: '',
          clearedBalance: '',
          unclearedBalance: '',
        }));
        setStatusMessage('Member not found for provided code.');
        setStatusError(true);
        return;
      }
      // Map payload fields
      setFormData((prev) => ({
        ...prev,
        profilePicture: member.MemberPicture ? `data:image/jpeg;base64,${member.MemberPicture}` : '',
        memberSignature: member.MemberSignature ? `data:image/jpeg;base64,${member.MemberSignature}` : '',
        phoneNumber: member.Phone || '',
        memberAccounts: Array.isArray(member.Accounts) ? member.Accounts : [],
        loanAccounts: Array.isArray(member.LoanAccounts) ? member.LoanAccounts : [],
      }));
      setStatusMessage('Member accounts and contact details loaded successfully.');
      setStatusError(false);
    } catch {
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  }, [formData.memberCode, fetchMemberDetails]);

  // Clear form
  const handleClear = () => {
    setFormData({
      memberCode: '',
      profilePicture: '',
      memberSignature: '',
      phoneNumber: '',
      postingAccount: '',
      memberAccounts: [],
      accountBalance: '',
      accountNumber: '',
      clearedBalance: '',
      unclearedBalance: '',
      transactionDate: todayIso,
      repaymentAmount: '',
      loanProductId: '',
      loanBalance: undefined,
      calculatedInterest: undefined,
      storedAccruedInterest: undefined,
      totalAccruedInterest: 0,
      comments: '',
    });
    setStatusMessage('');
    setStatusError(false);
    setTouched({});
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle numeric input for repayment amount
  const handleRepaymentAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setFormData((prev) => ({ ...prev, repaymentAmount: cleanValue }));
  };

  // Handle date change
  const handleDateChange = (value) => {
    setFormData((prev) => ({ ...prev, transactionDate: value ? value.format('YYYY-MM-DD') : '' }));
  };

  // Fetch account details when posting account changes
  useEffect(() => {
    if (formData.postingAccount) {
      setLoadingAccountDetails(true);
      fetchLoanRepaymentAccount(formData.postingAccount, formData.transactionDate).then((result) => {
        if (result) {
          setFormData((prev) => ({
            ...prev,
            accountNumber: result.AccountNumber || '',
            customerCode: result.CustomerCode || '',
            bookBalance: result.Details?.BookBalance ?? '',
            unclearedBalance: result.Details?.UnclearedBalance ?? '',
            clearedBalance: result.Details?.ClearedBalance ?? '',
            controlAccount: result.Details?.ControlAccount || '',
            interestAccount: result.Details?.InterestAccount || '',
            badDebtAccount: result.Details?.BadDebtAccount || '',
            loanBalance: result.AccruedInterest?.LoanBalance ?? '',
            calculatedInterest: result.AccruedInterest?.CalculatedInterest ?? '',
            storedAccruedInterest: result.AccruedInterest?.StoredAccruedInterest ?? '',
            repayment: result.Loan?.Repayment ?? '',
            duration: result.Loan?.Duration ?? '',
            startDate: result.Loan?.StartDate || '',
            loanProductId: result.Loan?.ProductID ?? '',
            totalAccruedInterest: result.AccruedInterest?.TotalAccruedInterest ?? 0,
          }));
        }
        setLoadingAccountDetails(false);
      }).catch(() => {
        setLoadingAccountDetails(false);
      });
    }
  }, [formData.postingAccount, formData.transactionDate, fetchLoanRepaymentAccount]);

  // Field validation
  const isFieldInvalid = (field) => {
    return touched[field] && !formData[field];
  };

  // Main render
  return (
    <Box component="fieldset" p={3} sx={{ border: 'none', p: 3, m: 0, position: 'relative' }}>
      <Backdrop open={isLoadingMember} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={96} thickness={5} />
          <Typography variant="h6" fontWeight={800}>Loading member...</Typography>
        </Box>
      </Backdrop>

      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Repayments
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Process member loan repayments and manage transactions
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Search
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Customer Code"
                name="memberCode"
                value={formData.memberCode}
                onChange={handleChange}
                onBlur={() => searchMember('memberCode')}
                disabled={isLoadingMember}
                placeholder="Member Code"
              />
              <TextField
                label="Payroll Number"
                name="payrollNumber"
                value={formData.payrollNumber || ''}
                onChange={handleChange}
                onBlur={() => searchMember('payrollNumber')}
                disabled={isLoadingMember}
                placeholder="e.g. PAY001"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleClear}
                  disabled={isLoadingMember}
                  sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, flex: 1, textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, justifyItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="img"
                    src={formData.profilePicture || defaultProfileImage}
                    alt="Member profile"
                    sx={{ width: 160, height: 120, borderRadius: 1.5, border: '2px solid', borderColor: 'primary.light', objectFit: 'cover', boxShadow: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Member Profile
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="img"
                    src={formData.memberSignature || defaultProfileImage}
                    alt="Member signature"
                    sx={{ width: 160, height: 120, borderRadius: 1.5, border: '2px solid', borderColor: 'primary.light', objectFit: 'contain', backgroundColor: '#f5f5f5', boxShadow: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Member Signature
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '120px' }}>
                    Phone Number:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                    {formData.phoneNumber || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          sx={{ mt: 2, '& .MuiAlert-message': { fontSize: '1.1rem', fontWeight: statusError ? 600 : 700 } }}
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
      )}

      <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#2c3e50' }}>
            Repayment Information
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {/* Transaction Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Transaction Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    select
                    label="Posting Account"
                    name="postingAccount"
                    value={formData.postingAccount}
                    onChange={handleChange}
                    onBlur={e => {
                      const value = e.target.value;
                      if (value) fetchLoanDetails(value, formData.transactionDate);
                    }}
                    error={isFieldInvalid('postingAccount')}
                    helperText={isFieldInvalid('postingAccount') ? 'Posting Account is required' : ''}
                    size="small"
                    fullWidth
                    required
                  >
                    <MenuItem value="">Select Posting Account</MenuItem>
                    {(formData.loanAccounts || []).map((account) => (
                      <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                        {account.AccountName}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Transaction Date"
                    name="transactionDate"
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => handleDateChange(dayjs(e.target.value))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Loan Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Loan Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  {loadingAccountDetails ? (
                    <>
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Account Number:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.accountNumber || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Loan Balance:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.loanBalance !== undefined ? `${CURRENCY_SYMBOL} ${formatCurrency(formData.loanBalance)}` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Calculated Interest:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.calculatedInterest !== undefined ? `${CURRENCY_SYMBOL} ${parseFloat(formData.calculatedInterest).toFixed(2)}` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Accrued Interest:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.storedAccruedInterest !== undefined ? `${CURRENCY_SYMBOL} ${formatCurrency(formData.storedAccruedInterest)}` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Total Accrued:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.totalAccruedInterest !== undefined ? `${CURRENCY_SYMBOL} ${parseFloat(formData.totalAccruedInterest).toFixed(2)}` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Repayment:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.repayment !== undefined ? `${CURRENCY_SYMBOL} ${formatCurrency(formData.repayment)}` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Duration:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.duration !== undefined ? formData.duration : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                          Start Date:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.startDate ? dayjs(formData.startDate).format('DD-MM-YYYY') : 'N/A'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Repayment Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Repayment Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    select
                    label="Repayment Type"
                    name="repaymentType"
                    value={formData.repaymentType}
                    onChange={handleRepaymentTypeChange}
                    size="small"
                    fullWidth
                    required
                  >
                    <MenuItem value="">Select Repayment Type</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="bank">Bank</MenuItem>
                    <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
                  </TextField>
                  <TextField
                    label="Repayment Amount"
                    name="repaymentAmount"
                    value={formatCurrency(formData.repaymentAmount)}
                    onChange={handleRepaymentAmountChange}
                    size="small"
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Repayment Type Details Card - moved below Loan Details */}
            {(formData.repaymentType === 'cash' || formData.repaymentType === 'cheque' || formData.repaymentType === 'bank') && (
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    {formData.repaymentType === 'cash'
                      ? 'Cash Details'
                      : formData.repaymentType === 'cheque'
                        ? 'Check Details'
                        : 'Bank Details'}
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr' } }}>
                    {formData.repaymentType === 'cash' && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Cash Account:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.cashAccount || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Credit Limit:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.creditLimit || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Debit Limit:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.debitLimit || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Loan Limit:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.loanLimit || 'N/A'}
                          </Typography>
                        </Box>
                      </>
                    )}
                    {(formData.repaymentType === 'cheque' || formData.repaymentType === 'bank') && (
                      <>
                        {formData.repaymentType === 'cheque' && (
                          <>
                            <TextField
                              label="Check Number"
                              name="checkNumber"
                              value={formData.checkNumber}
                              onChange={handleChange}
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Check Date"
                              name="checkDate"
                              type="date"
                              value={formData.checkDate}
                              onChange={handleChange}
                              size="small"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </>
                        )}
                        <TextField
                          select
                          label="Bank"
                          name="bank"
                          value={formData.bank}
                          onChange={handleBankChange}
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="">Select bank</MenuItem>
                          {banks.map((bank) => (
                            <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          label="Bank Account"
                          name="bankAccount"
                          value={formData.bankAccount}
                          onChange={handleBankAccountChange}
                          size="small"
                          fullWidth
                          disabled={!formData.bank}
                        >
                          <MenuItem value="">Select account</MenuItem>
                          {bankAccounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Contra Account"
                          name="contraAccount"
                          value={formData.contraAccount}
                          disabled
                          size="small"
                          fullWidth
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                              fontWeight: 600,
                            },
                          }}
                        />
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Print Receipt Checkbox and Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={printReceipt}
                  onChange={e => setPrintReceipt(e.target.checked)}
                  color="primary"
                />
              }
              label="Print Receipt"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                disabled={
                  !formData.postingAccount ||
                  !formData.repaymentAmount ||
                  !formData.repaymentType
                }
                onClick={handleSaveRepayment}
                sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, paddingX: 3, boxShadow: 'none', textTransform: 'none' }}
              >
                💾 Save Repayment
              </Button>
              <Button
                variant="outlined"
                disabled={!lastReceipt}
                onClick={handlePrintReceipt}
                sx={{ fontWeight: 600, paddingX: 3, textTransform: 'none' }}
              >
                🖨️ Print Receipt
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
