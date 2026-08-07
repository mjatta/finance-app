import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { CurrencyAdornment } from '../../../components/FieldAdornments';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useGetAccountDetails } from './hooks/useGetAccountDetails';
import { useGetBanks } from './hooks/useGetBanks';
import { useGetBankAccounts } from './hooks/useGetBankAccounts';
import { useWithdrawalTransaction } from './hooks/useWithdrawalTransaction';
import { useRegions } from '../../../hooks/useRegions';
import { useAuthStore } from '../../../store/authStore';

const todayIso = new Date().toISOString().split('T')[0];
const defaultProfileImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="130" viewBox="0 0 180 130"><rect width="180" height="130" fill="#f1f5f9"/><circle cx="90" cy="48" r="18" fill="#cbd5e1"/><rect x="52" y="76" width="76" height="30" rx="15" fill="#cbd5e1"/></svg>',
)}`;

const formatProfileImage = (imageData) => {
  if (!imageData) return defaultProfileImage;
  // If image already has data URI format, return as is
  if (imageData.startsWith('data:')) return imageData;
  // If it's base64 without prefix, add the proper prefix
  return `data:image/jpeg;base64,${imageData}`;
};


export default function Withdrawal() {
  const resetFormState = {
    transactionType: 'withdrawals',
    memberCode: '',
    payrollNumber: '',
    profilePicture: '',
    memberSignature: '',
    phoneNumber: '',
    postingAccount: '',
    memberAccounts: [],
    accountBalance: '',
    accountNumber: '',
    clearedBalance: '',
    unclearedBalance: '',
    printReceipt: false,
    transactionDate: todayIso,
    sendSmsFee: false,
    feeAmount: '',
    withdrawalAmount: '',
    comments: '',
    depositType: '',
    contraAccount: '',
    checkNumber: '',
    checkDate: todayIso,
    bank: '',
    bankAccount: '',
    cashAccount: '',
    creditLimit: '',
    debitLimit: '',
    loanLimit: '',
    region: '',
    selectedRegionId: '',
  };

  const [formData, setFormData] = useState({
    transactionType: 'withdrawals',
    memberCode: '',
    payrollNumber: '',
    profilePicture: '',
    memberSignature: '',
    phoneNumber: '',
    postingAccount: '',
    memberAccounts: [],
    accountBalance: '',
    accountNumber: '',
    clearedBalance: '',
    unclearedBalance: '',
    printReceipt: false,
    transactionDate: todayIso,
    sendSmsFee: false,
    feeAmount: '',
    withdrawalAmount: '',
    comments: '',
    depositType: '',
    contraAccount: '',
    checkNumber: '',
    checkDate: todayIso,
    bank: '',
    bankAccount: '',
    cashAccount: '',
    creditLimit: '',
    debitLimit: '',
    loanLimit: '',
    region: '',
    selectedRegionId: '',
  });
  const user = useAuthStore((state) => state.user);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  // Limit check state
  const [limitError, setLimitError] = useState('');
    // Compute limits from localStorage or user object
    const debitLimit = useMemo(() => {
      const fromStorage = localStorage.getItem('DebitLimit');
      if (fromStorage !== null && fromStorage !== undefined) return parseFloat(fromStorage);
      if (user?.DebitLimit != null) return parseFloat(user.DebitLimit);
      return null;
    }, [user]);
    const creditLimit = useMemo(() => {
      const fromStorage = localStorage.getItem('CreditLimit');
      if (fromStorage !== null && fromStorage !== undefined) return parseFloat(fromStorage);
      if (user?.CreditLimit != null) return parseFloat(user.CreditLimit);
      return null;
    }, [user]);

    // Check limits on withdrawalAmount change
    useEffect(() => {
      if (!formData.withdrawalAmount) {
        setLimitError('');
        return;
      }
      const amount = parseFloat(formData.withdrawalAmount);
      if (debitLimit != null && amount > debitLimit) {
        setLimitError(`You are not allowed to withdraw more than D ${Number(debitLimit).toLocaleString()}.`);
      } else if (creditLimit != null && amount > creditLimit) {
        setLimitError(`You are not allowed to withdraw more than D ${Number(creditLimit).toLocaleString()}.`);
      } else {
        setLimitError('');
      }
    }, [formData.withdrawalAmount, debitLimit, creditLimit]);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  const shouldAutoPrint = useRef(false);
  const { fetchMemberDetails } = useGetMemberDetails();
  const { fetchAccountDetails } = useGetAccountDetails();
  const { fetchBanks } = useGetBanks();
  const { fetchBankAccounts } = useGetBankAccounts();
  const { saveWithdrawalTransaction } = useWithdrawalTransaction();
  const { regions, loading: regionsLoading } = useRegions();

  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingAccountDetails, setLoadingAccountDetails] = useState(false);

  // Duplicate declaration removed above. Only one useState for formData should exist.

  const [touched, setTouched] = useState({});

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const isFieldInvalid = (fieldName) => {
    if (!touched[fieldName]) return false;
    if (fieldName === 'postingAccount') return !formData.postingAccount.trim();
    if (fieldName === 'withdrawalAmount') return !formData.withdrawalAmount.toString().trim();
    if (fieldName === 'transactionDate') return !formData.transactionDate;
    return false;
  };

  const applyMemberData = (member) => {
    // const nextRows = member.accounts.map((account, index) => makeWithdrawalRow(account, index));
    // setRows(nextRows); // rows state removed
    setFormData((prev) => ({
      ...prev,
      memberCode: member.memberCode,
      payrollNumber: member.payrollNumber,
      profilePicture: member.profilePicture,
      memberSignature: member.memberSignature,
      phoneNumber: member.phoneNumber,
      memberAccounts: member.memberAccounts || [],
    }));
  };

  // Fetch account details when posting account changes
  useEffect(() => {
    if (formData.postingAccount) {
      setLoadingAccountDetails(true);
      fetchAccountDetails(formData.postingAccount).then((result) => {
        if (result.success && result.data) {
          setFormData((prev) => ({
            ...prev,
            accountNumber: result.data.accountNumber,
            accountBalance: result.data.accountBalance,
            clearedBalance: result.data.clearedBalance,
            unclearedBalance: result.data.unclearedBalance,
            controlAccount: result.data.controlAccount,
          }));
        }
        setLoadingAccountDetails(false);
      }).catch(() => {
        setLoadingAccountDetails(false);
      });
    }
  }, [formData.postingAccount, fetchAccountDetails]);

  // Map logged-in user's cash details when withdrawal type is cash
  useEffect(() => {
    if (formData.depositType === 'cash' && user) {
      setFormData((prev) => ({
        ...prev,
        cashAccount: user.CashAccount || '',
        contraAccount: user.CashAccount || '',
        debitLimit: user.DebitLimit != null ? String(user.DebitLimit) : '',
        creditLimit: user.CreditLimit != null ? String(user.CreditLimit) : '',
        loanLimit: user.LoanLimit != null ? String(user.LoanLimit) : '',
      }));
    }
  }, [formData.depositType, user]);

  const searchMember = async (searchBy) => {
    const rawValue = searchBy === 'memberCode' ? formData.memberCode : formData.payrollNumber;
    if (!rawValue.trim()) {
      return;
    }

    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      let member = null;

      // For member code, try fetching from backend API
      if (searchBy === 'memberCode') {
        const remoteMemberData = await fetchMemberDetails(rawValue.trim());
        if (remoteMemberData) {
          // Transform API response to match our local member structure
          // Map Accounts array from API (with capital A) to accounts
          const accounts = Array.isArray(remoteMemberData.Accounts) 
            ? remoteMemberData.Accounts.map(acc => ({
                accountType: acc.AccountName || 'Account',
                accountNumber: acc.AccountNumber || '',
                accountBalance: '0.00'
              }))
            : [];
          
          member = {
            memberCode: remoteMemberData.memberCode || rawValue.trim(),
            payrollNumber: remoteMemberData.payrollNumber || '',
            profilePicture: formatProfileImage(remoteMemberData.MemberPicture),
            memberSignature: formatProfileImage(remoteMemberData.MemberSignature),
            phoneNumber: remoteMemberData.Phone || '',
            memberAccounts: Array.isArray(remoteMemberData.Accounts) ? remoteMemberData.Accounts : [],
            accounts: accounts.length > 0 ? accounts : [{
              accountType: 'Account',
              accountNumber: '',
              accountBalance: '0.00'
            }]
          };
        }
      } else {
        // Payroll number search only from backend - no fallback
        // setRows([]); // rows state removed
        setFormData((prev) => ({
          ...prev,
          profilePicture: '',
          memberSignature: '',
          phoneNumber: '',
          memberAccounts: [],
          accountBalance: '',
          accountNumber: '',
          clearedBalance: '',
          unclearedBalance: '',
        }));
        setStatusMessage('Member not found for provided search details.');
        setStatusError(true);
        setIsLoadingMember(false);
        return;
      }

      if (!member) {
        // setRows([]); // rows state removed
        setFormData((prev) => ({
          ...prev,
          profilePicture: '',
          memberSignature: '',
          phoneNumber: '',
          memberAccounts: [],
          accountBalance: '',
          accountNumber: '',
          clearedBalance: '',
          unclearedBalance: '',
        }));
        setStatusMessage('Member not found for provided search details.');
        setStatusError(true);
        return;
      }

      applyMemberData(member);
      setStatusMessage('Member accounts and contact details loaded successfully.');
      setStatusError(false);
    } catch (error) {
      console.error('Error searching for member:', error);
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  };

  const handleClear = () => {
    setFormData({ ...resetFormState });
    // setRows([]); // rows state removed
    setStatusMessage('');
    setStatusError(false);
    setTouched({});
  };

  const handleWithdrawalAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setFormData((prev) => ({ ...prev, withdrawalAmount: cleanValue }));
  };

  const handleFeeAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setFormData((prev) => ({ ...prev, feeAmount: cleanValue }));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (name === 'region') {
      const selected = regions.find((r) => r.coun_name?.trim() === value);
      setFormData((prev) => ({
        ...prev,
        region: value,
        selectedRegionId: selected ? String(selected.coun_id) : '',
      }));
      return;
    }

    // Handle deposit type change
    if (name === 'depositType') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        bank: '',
        bankAccount: '',
      }));

      // If cheque is selected, fetch banks
      if (value === 'cheque') {
        fetchBanks().then((result) => {
          if (result.success && result.data) {
            setBanks(result.data);
          }
        });
      } else {
        setBanks([]);
        setBankAccounts([]);
      }
      return;
    }

    // Handle bank change
    if (name === 'bank') {
      setFormData((prev) => ({
        ...prev,
        bank: value,
        bankAccount: '',
      }));

      // Fetch bank accounts for the selected bank
      if (value) {
        fetchBankAccounts(value).then((result) => {
          if (result.success && result.data) {
            setBankAccounts(result.data);
          }
        });
      } else {
        setBankAccounts([]);
      }
      return;
    }

    // Handle bank account change
    if (name === 'bankAccount') {
      // The selected value is the AccountNumber from the bank accounts dropdown
      setFormData((prev) => ({
        ...prev,
        bankAccount: value,
        contraAccount: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? value.format('YYYY-MM-DD') : '',
    }));
  };



  const handleSaveWithdrawal = async () => {
    if (limitError) {
      setStatusMessage(limitError);
      setStatusError(true);
      return;
    }
    const missingFields = [];
    if (!formData.postingAccount) missingFields.push('Posting Account');
    if (!formData.withdrawalAmount) missingFields.push('Withdrawal Amount');
    if (!formData.transactionDate) missingFields.push('Transaction Date');

    if (missingFields.length > 0) {
      setTouched({
        postingAccount: !formData.postingAccount,
        withdrawalAmount: !formData.withdrawalAmount,
        transactionDate: !formData.transactionDate,
      });
      setStatusMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setStatusError(true);
      return;
    }

    if (formData.transactionDate > todayIso) {
      setStatusMessage('Transaction Date cannot be in the future.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      // Call the withdrawal transaction API with user info from auth store
      const result = await saveWithdrawalTransaction(formData, user?.username || '', user?.CompId, user?.BranchId);

      if (result) {
        setStatusMessage('Withdrawal saved successfully.');
        setStatusError(false);

        // Capture the receipt from the API response
        if (formData.printReceipt) {
          shouldAutoPrint.current = true;
        }
        if (result.Receipt) {
          setLastTransactionData({
            receipt: result.Receipt,
            message: result.Message || 'Withdrawal inserted successfully.',
            timestamp: new Date().toLocaleString(),
          });
        } else {
          setLastTransactionData({
            receipt: null,
            message: result.Message || 'Withdrawal inserted successfully.',
            timestamp: new Date().toLocaleString(),
          });
        }

        notifySaveSuccess({
          page: 'Customer Administration / Withdrawals',
          action: 'Save Withdrawal',
          message: 'Withdrawal saved successfully.',
        });
        // Reset form and validation state after successful save
        setTouched({});
        setFormData({ ...resetFormState });
      } else {
        throw new Error('Failed to save withdrawal transaction.');
      }
    } catch (error) {
      setStatusMessage('Failed to save withdrawal.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Withdrawals',
        action: 'Save Withdrawal',
        message: 'Failed to save withdrawal.',
        error,
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handlePrintReceipt = React.useCallback(() => {
    if (!lastTransactionData) {
      setStatusMessage('Please save a withdrawal first before printing a receipt.');
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
    const transactionType = (lastTransactionData.message || 'Withdrawal').replace(' inserted successfully.', '').replace(' saved successfully.', '');

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Withdrawal Receipt</title>
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
            <span class="label">Receipt Date:</span>
            <span class="value"></span>
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
            <span class="label">${transactionType.replace(/</g, '&lt;')}</span>
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
  }, [lastTransactionData, user]);

  // Auto-print receipt after save when checkbox is checked
  useEffect(() => {
    if (lastTransactionData && shouldAutoPrint.current) {
      shouldAutoPrint.current = false;
      handlePrintReceipt();
    }
  }, [lastTransactionData, handlePrintReceipt]);

  return (
    <>
      <Box
        component="fieldset"
        p={3}
        sx={{
          border: 'none',
          p: 3,
          m: 0,
          position: 'relative',
          '& .MuiInputLabel-root, & .MuiFormLabel-root': {
            fontWeight: 600,
            fontSize: '1.2rem',
          },
          '& .MuiFormLabel-asterisk': {
            color: 'error.main',
            fontSize: '1.2rem',
            fontWeight: 800,
          },
        }}
      >
        <Backdrop
          open={isSaving}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={96} thickness={5} />
            <Typography variant="h6" fontWeight={800}>Saving withdrawal...</Typography>
          </Box>
        </Backdrop>

        <Box
          sx={{
            mb: 3,
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            color: 'white',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
            Withdrawal
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Process member withdrawals and manage transactions
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
                  helperText="Enter customer code and press Tab to load member details."
                  FormHelperTextProps={{
                    sx: {
                      fontWeight: 800,
                      color: '#b45309',
                    },
                  }}
                />
                <TextField
                  label="Payroll Number"
                  name="payrollNumber"
                  value={formData.payrollNumber}
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
                    sx={{
                      backgroundColor: '#667eea',
                      '&:hover': { backgroundColor: '#5568d3' },
                      fontWeight: 600,
                      flex: 1,
                      textTransform: 'none',
                    }}
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
                {/* Images Row */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, justifyItems: 'center' }}>
                  {/* Profile Picture */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={formData.profilePicture || defaultProfileImage}
                      alt="Member profile"
                      sx={{
                        width: 160,
                        height: 120,
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: 'primary.light',
                        objectFit: 'cover',
                        boxShadow: 1,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Member Profile
                    </Typography>
                  </Box>
                  {/* Member Signature */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={formData.memberSignature || defaultProfileImage}
                      alt="Member signature"
                      sx={{
                        width: 160,
                        height: 120,
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: 'primary.light',
                        objectFit: 'contain',
                        backgroundColor: '#f5f5f5',
                        boxShadow: 1,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Member Signature
                    </Typography>
                  </Box>
                </Box>
                {/* Phone Number Section */}
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
            sx={{
              mt: 2,
              '& .MuiAlert-message': {
                fontSize: '1.1rem',
                fontWeight: statusError ? 600 : 700,
              },
            }}
            onClose={() => setStatusMessage('')}
          >
            {statusMessage}
          </Alert>
        )}

        <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#2c3e50' }}>
              Withdrawal Information
            </Typography>

            {/* Two Column Card Layout */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              {/* Transaction Details Card */}
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    Transaction Details
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <TextField
                      label="Transaction Type"
                      name="transactionType"
                      value={formData.transactionType}
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
                    <TextField
                      select
                      label="Posting Account"
                      name="postingAccount"
                      value={formData.postingAccount}
                      onChange={handleChange}
                      onBlur={() => handleBlur('postingAccount')}
                      error={isFieldInvalid('postingAccount')}
                      helperText={isFieldInvalid('postingAccount') ? 'Posting Account is required' : ''}
                      size="small"
                      fullWidth
                      required
                      // displayEmpty and renderValue removed
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      <MenuItem value="">Select Posting Account</MenuItem>
                      {Array.isArray(formData.memberAccounts) && formData.memberAccounts.map((account) => (
                        <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                          {account.AccountName}
                        </MenuItem>
                      ))}
                    </TextField>
                    <DatePicker
                      label="Transaction Date"
                      value={formData.transactionDate ? dayjs(formData.transactionDate) : null}
                      onChange={(value) => handleDateChange('transactionDate', value)}
                      maxDate={dayjs(todayIso)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                    />
                    <TextField
                      select
                      label="Region"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      size="small"
                      fullWidth
                      disabled={regionsLoading}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected) => selected || 'Select a Region',
                      }}
                    >
                      <MenuItem value="" disabled>
                        {regionsLoading ? 'Loading regions...' : 'Select a Region'}
                      </MenuItem>
                      {regions.map((r) => (
                        <MenuItem key={r.coun_id} value={r.coun_name?.trim()}>
                          {r.coun_name?.trim()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </CardContent>
              </Card>

              {/* Account Details Card */}
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    Account Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {loadingAccountDetails ? (
                      <>
                        <Skeleton variant="rounded" height={30} />
                        <Skeleton variant="rounded" height={30} />
                        <Skeleton variant="rounded" height={30} />
                        <Skeleton variant="rounded" height={30} />
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Account Number:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.accountNumber || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Account Balance:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.accountBalance !== '' ? parseFloat(formData.accountBalance).toFixed(2) : 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Cleared Balance:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.clearedBalance !== '' ? parseFloat(formData.clearedBalance).toFixed(2) : 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                            Uncleared Balance:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                            {formData.unclearedBalance !== '' ? parseFloat(formData.unclearedBalance).toFixed(2) : 'N/A'}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Withdrawal Details Card */}
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    Withdrawal Details
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <TextField
                      select
                      label="Withdrawal Type"
                      name="depositType"
                      value={formData.depositType}
                      onChange={handleChange}
                      size="small"
                      fullWidth
                      required
                      // displayEmpty and renderValue removed
                    >
                      <MenuItem value="">Select Withdrawal Type</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
                    </TextField>
                    <TextField
                      label="Withdrawal Amount"
                      name="withdrawalAmount"
                      value={formatCurrency(formData.withdrawalAmount)}
                      onChange={handleWithdrawalAmountChange}
                      onBlur={() => handleBlur('withdrawalAmount')}
                      error={Boolean(limitError) || isFieldInvalid('withdrawalAmount')}
                      helperText={limitError ? limitError : (isFieldInvalid('withdrawalAmount') ? 'Withdrawal Amount is required' : '')}
                      size="small"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: <CurrencyAdornment />
                      }}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          ...(Boolean(limitError) && {
                            '& fieldset': {
                              borderColor: '#d32f2f',
                              borderWidth: 2,
                            },
                          }),
                        },
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                    {limitError && (
                      <Alert severity="error" sx={{ mt: 1, mb: 0.5 }}>
                        {limitError}
                      </Alert>
                    )}
                    <TextField
                      label="Comments"
                      name="comments"
                      value={formData.comments}
                      onChange={handleChange}
                      multiline
                      minRows={4}
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                      <FormControlLabel
                        control={<Checkbox name="sendSmsFee" checked={formData.sendSmsFee} onChange={handleChange} />}
                        label="Send SMS fee"
                        sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' }, m: 0 }}
                      />
                      {formData.sendSmsFee && (
                        <TextField
                          label="Fee Amount"
                          name="feeAmount"
                          value={formatCurrency(formData.feeAmount)}
                          onChange={handleFeeAmountChange}
                          size="small"
                          InputProps={{
                            startAdornment: <CurrencyAdornment />
                          }}
                          inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                          sx={{ width: '200px' }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Cash Details Card - Only show when withdrawal type is cash */}
              {formData.depositType === 'cash' && (
                <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                      Cash Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Check Details Card - Only show when withdrawal type is cheque */}
              {formData.depositType === 'cheque' && (
                <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                      Check Details
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <TextField
                        label="Check Number"
                        name="checkNumber"
                        value={formData.checkNumber}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                      />
                      <DatePicker
                        label="Check Date"
                        value={formData.checkDate ? dayjs(formData.checkDate) : null}
                        onChange={(value) => handleDateChange('checkDate', value)}
                        maxDate={dayjs(todayIso)}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          },
                        }}
                      />
                      <TextField
                        select
                        label="Bank"
                        name="bank"
                        value={formData.bank}
                        onChange={handleChange}
                        disabled={formData.depositType !== 'cheque'}
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">Select bank</MenuItem>
                        {Array.isArray(banks) && banks.map((bank) => (
                          <MenuItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Bank Account"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleChange}
                        disabled={!Array.isArray(bankAccounts) || bankAccounts.length === 0}
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">Select account</MenuItem>
                        {Array.isArray(bankAccounts) && bankAccounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.name}
                          </MenuItem>
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
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Additional Options - Full Width */}
            <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <FormControlLabel
                control={<Checkbox name="printReceipt" checked={formData.printReceipt} onChange={handleChange} />}
                label="Print receipt after saving"
                sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' }, pt: 1 }}
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleSaveWithdrawal}
                disabled={isSaving || !!limitError}
                sx={{
                  backgroundColor: '#667eea',
                  '&:hover': { backgroundColor: '#5568d3' },
                  fontWeight: 600,
                  paddingX: 3,
                  boxShadow: 'none',
                  textTransform: 'none',
                }}
              >
                {isSaving ? 'Saving...' : '💾 Save Withdrawal'}
              </Button>
              <Button
                variant="outlined"
                onClick={handlePrintReceipt}
                sx={{
                  fontWeight: 600,
                  paddingX: 3,
                  textTransform: 'none',
                }}
              >
                🖨️ Print Receipt
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
