import React, { useEffect, useState } from 'react';
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
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import logo from '../../../assets/company-logo.jpg';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useGetAccountDetails } from './hooks/useGetAccountDetails';
import { useGetBanks } from './hooks/useGetBanks';
import { useGetBankAccounts } from './hooks/useGetBankAccounts';
import { useGetCashDetails } from './hooks/useGetCashDetails';
import { useDepositTransaction } from './hooks/useDepositTransaction';
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

const makeDepositRow = (account, index) => ({
  id: `${account.accountNumber}-${index}`,
  selected: index === 0,
  accountType: account.accountType,
  accountNumber: account.accountNumber,
  paymentMade: '',
  principle: '',
  interest: '',
  beginBalance: account.accountBalance,
  endBalance: account.accountBalance,
  outstandingBalance: account.accountBalance,
  order: '',
});

export default function DepositManagement() {
  const user = useAuthStore((state) => state.user);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { fetchMemberDetails } = useGetMemberDetails();
  const { fetchAccountDetails } = useGetAccountDetails();
  const { fetchBanks } = useGetBanks();
  const { fetchBankAccounts } = useGetBankAccounts();
  const { fetchCashDetails } = useGetCashDetails();
  const { saveDepositTransaction } = useDepositTransaction();

  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [contraAccounts, setContraAccounts] = useState([]);

  const [formData, setFormData] = useState({
    transactionType: 'deposits',
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
    referenceNumber: '',
    printReceipt: false,
    transactionDate: todayIso,
    sendSmsFee: false,
    feeAmount: '',
    depositAmount: '',
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
  });

  const [rows, setRows] = useState([]);
  const [touched, setTouched] = useState({});
  const [lastTransactionData, setLastTransactionData] = useState(null);

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const isFieldInvalid = (fieldName) => {
    if (!touched[fieldName]) return false;
    if (fieldName === 'postingAccount') return !formData.postingAccount.trim();
    if (fieldName === 'depositAmount') return !formData.depositAmount.toString().trim();
    if (fieldName === 'transactionDate') return !formData.transactionDate;
    return false;
  };

  const applyMemberData = (member) => {
    const nextRows = member.accounts.map((account, index) => makeDepositRow(account, index));

    setRows(nextRows);
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
        // Payroll number search only from backend - no fallback\n        setRows([]);
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
        setRows([]);
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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
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
        contraAccount: '',
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
        setContraAccounts([]);
      }
      return;
    }

    // Handle bank change
    if (name === 'bank') {
      setFormData((prev) => ({
        ...prev,
        bank: value,
        bankAccount: '',
        contraAccount: '',
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
        setContraAccounts([]);
      }
      return;
    }

    // Handle bank account change
    if (name === 'bankAccount') {
      // When bank account is selected, fetch its details as contra accounts
      if (value && bankAccounts.length > 0) {
        const selectedAccount = bankAccounts.find((acc) => acc.id === value);
        if (selectedAccount) {
          // The bank account API returns array of accounts with AccountNumber and AccountName
          // Map this to contraAccounts for the dropdown
          const accounts = Array.isArray(selectedAccount.accounts)
            ? selectedAccount.accounts
            : [selectedAccount];
          setContraAccounts(accounts);
          
          // Auto-fill contraAccount with the first AccountNumber
          const firstAccountNumber = accounts.length > 0 ? accounts[0].AccountNumber : '';
          setFormData((prev) => ({
            ...prev,
            bankAccount: value,
            contraAccount: firstAccountNumber,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            bankAccount: value,
            contraAccount: '',
          }));
          setContraAccounts([]);
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          bankAccount: value,
          contraAccount: '',
        }));
        setContraAccounts([]);
      }
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

  // Fetch account details when posting account changes
  useEffect(() => {
    if (formData.postingAccount) {
      fetchAccountDetails(formData.postingAccount).then((result) => {
        if (result.success && result.data) {
          setFormData((prev) => ({
            ...prev,
            accountNumber: result.data.accountNumber,
            accountBalance: result.data.accountBalance,
            clearedBalance: result.data.clearedBalance,
            unclearedBalance: result.data.unclearedBalance,
          }));
        }
      });
    }
  }, [formData.postingAccount, fetchAccountDetails]);

  // Map logged-in user's cash details when deposit type is cash
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

  const handleSaveDeposit = async () => {
    const missingFields = [];
    if (!formData.postingAccount) missingFields.push('Posting Account');
    if (!formData.depositAmount) missingFields.push('Deposit Amount');
    if (!formData.transactionDate) missingFields.push('Transaction Date');

    if (missingFields.length > 0) {
      setTouched({
        postingAccount: !formData.postingAccount,
        depositAmount: !formData.depositAmount,
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
      // Call the deposit transaction API with user info from auth store
      const result = await saveDepositTransaction(formData, user?.username || '', user?.CompId, user?.BranchId);

      if (result) {
        setStatusMessage('Deposit saved successfully.');
        setStatusError(false);
        
        // Capture the newly created transaction from the 201 response
        if (result.rows && Array.isArray(result.rows) && result.rows.length > 0) {
          const newTransaction = result.rows[result.rows.length - 1];
          const transactionId = `${newTransaction.tcChqno || 'TXN'}-${new Date().getTime()}`;
          setLastTransactionData({
            transactionId,
            timestamp: new Date().toLocaleString(),
            transactionData: newTransaction,
          });
        }
        
        notifySaveSuccess({
          page: 'Member Administration / Deposits',
          action: 'Save Deposit',
          message: 'Deposit saved successfully.',
        });
        // Reset all fields after successful save
        setFormData({
          transactionType: 'deposits',
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
          referenceNumber: '',
          printReceipt: false,
          transactionDate: todayIso,
          sendSmsFee: false,
          feeAmount: '',
          depositAmount: '',
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
        });
        setRows([]);
        setTouched({});
        setBankAccounts([]);
        setContraAccounts([]);
        setBanks([]);
        // Auto dismiss success message after 5 seconds
        setTimeout(() => setStatusMessage(''), 5000);
      } else {
        throw new Error('Failed to save deposit transaction.');
      }
    } catch (error) {
      setStatusMessage('Failed to save deposit.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Deposits',
        action: 'Save Deposit',
        message: 'Failed to save deposit.',
        error,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    const selectedRow = rows.find((row) => row.selected);

    if (!selectedRow) {
      setStatusMessage('Please select an account before printing receipt.');
      setStatusError(true);
      return;
    }

    const receiptWindow = window.open('', '_blank', 'width=720,height=820');
    if (!receiptWindow) {
      setStatusMessage('Unable to open print window. Please allow pop-ups and try again.');
      setStatusError(true);
      return;
    }

    const now = new Date().toLocaleString();
    const infoRows = [
      ['Customer Code', formData.memberCode || '-'],
      ['Payroll Number', formData.payrollNumber || '-'],
      ['Account Type', selectedRow.accountType || '-'],
      ['Account Number', selectedRow.accountNumber || '-'],
      ['Transaction Date', formData.transactionDate || '-'],
      ['Phone Number', formData.phoneNumber || '-'],
      ['Comments', formData.comments || '-'],
      // Fields from 201 response payload
      ...(lastTransactionData?.transactionData ? [
        ['', ''], // Empty row for spacing
        ['API Transaction Details', ''],
        ['Check Number', lastTransactionData.transactionData.tcChqno || '-'],
        ['Posting Amount (API)', lastTransactionData.transactionData.tnTranAmt || '-'],
        ['Account Number (API)', lastTransactionData.transactionData.tcAcctNumb || '-'],
        ['Control Account', lastTransactionData.transactionData.gcControlAcct || '-'],
        ['User ID', lastTransactionData.transactionData.gcUserid || '-'],
        ['API Transaction Date', lastTransactionData.transactionData.dTranDate || '-'],
        ['Transaction ID', lastTransactionData.transactionId],
        ['Transaction Time', lastTransactionData.timestamp],
      ] : []),
    ];

    const detailsHtml = infoRows
      .map(([label, value]) => `
        <div class="row">
          <span class="label">${label}</span>
          <span class="value">${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
        </div>
      `)
      .join('');

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Deposit Receipt</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Inter, Segoe UI, Arial, sans-serif;
              color: #102a43;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .shell {
              margin: 12px;
              border: 1px solid #d9e2ec;
              border-radius: 10px;
              overflow: hidden;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #dbe7f3;
              padding: 10px 12px;
              background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand-logo {
              width: 44px;
              height: 44px;
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #dbe7f3;
            }
            .brand-title {
              font-size: 16px;
              font-weight: 800;
            }
            .receipt-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f4c81;
            }
            .meta {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              background: #f8fbff;
              border-bottom: 1px solid #e4edf5;
              font-size: 11px;
              color: #486581;
            }
            .section {
              padding: 10px 12px;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px 12px;
            }
            .row {
              display: flex;
              flex-direction: column;
              border: 1px solid #e4edf5;
              border-radius: 6px;
              padding: 6px 8px;
              min-height: 50px;
            }
            .label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #486581;
              margin-bottom: 4px;
            }
            .value {
              font-size: 12px;
              font-weight: 600;
              color: #102a43;
              word-break: break-word;
            }
            @page {
              size: A4;
              margin: 8mm;
            }
          </style>
        </head>
        <body>
          <div class="shell">
            <div class="header">
              <div class="brand">
                <img class="brand-logo" src="${logo}" alt="Company logo" />
                <div class="brand-title">Microfinance Management</div>
              </div>
              <div class="receipt-title">Member Deposit Receipt</div>
            </div>
            <div class="meta">
              <span>Printed On: ${now}</span>
            </div>

            <div class="section">
              ${detailsHtml}
            </div>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  return (
    <Box
      component="fieldset"
      p={3}
      sx={{
        border: 'none',
        p: 3,
        m: 0,
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
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Member Deposit
      </Typography>

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
                value={formData.payrollNumber}
                onChange={handleChange}
                onBlur={() => searchMember('payrollNumber')}
                disabled={isLoadingMember}
                placeholder="e.g. PAY001"
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, alignItems: 'flex-start' }}>
              {/* Image Column */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src={formData.profilePicture || defaultProfileImage}
                  alt="Member profile"
                  sx={{
                    width: 180,
                    height: 130,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    objectFit: 'cover',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Member profile picture
                </Typography>
                <TextField
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  InputProps={{ readOnly: true }}
                  disabled
                  size="small"
                  sx={{
                    maxWidth: '280px',
                    '& .MuiInputBase-input.Mui-disabled': {
                      backgroundColor: '#e8e8e8',
                      color: '#666',
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
              {/* Contact Info Column */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  component="img"
                  src={formData.memberSignature || defaultProfileImage}
                  alt="Member signature"
                  sx={{
                    width: 180,
                    height: 130,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    objectFit: 'contain',
                    backgroundColor: '#fff',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Member Signature
                </Typography>
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
            Deposit Information
          </Typography>

          {/* Two Column Card Layout */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {/* Transaction Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem', color: '#2c3e50' }}>
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
                    sx={{
                      '& .MuiFormLabel-root.Mui-required::after': {
                        color: '#fff',
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    <MenuItem value="">Select posting account</MenuItem>
                    {formData.memberAccounts.map((account) => (
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
                </Box>
              </CardContent>
            </Card>

            {/* Account Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem', color: '#2c3e50' }}>
                  Account Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    label="Account Number"
                    name="accountNumber"
                    value={formData.accountNumber}
                    disabled
                    size="small"
                    fullWidth
                    sx={{
                      maxWidth: '280px',
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        fontWeight: 600,
                      },
                      '& .MuiInputAdornment-positionEnd': {
                        display: 'none',
                      },
                    }}
                  />
                  <TextField
                    label="Account Balance"
                    name="accountBalance"
                    value={formData.accountBalance !== '' ? parseFloat(formData.accountBalance).toFixed(2) : ''}
                    disabled
                    size="small"
                    fullWidth
                    sx={{
                      maxWidth: '280px',
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        fontWeight: 600,
                      },
                      '& .MuiInputAdornment-positionEnd': {
                        display: 'none',
                      },
                    }}
                  />
                  <TextField
                    label="Cleared Balance"
                    name="clearedBalance"
                    value={formData.clearedBalance !== '' ? parseFloat(formData.clearedBalance).toFixed(2) : ''}
                    disabled
                    size="small"
                    fullWidth
                    sx={{
                      maxWidth: '280px',
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        fontWeight: 600,
                      },
                      '& .MuiInputAdornment-positionEnd': {
                        display: 'none',
                      },
                    }}
                  />
                  <TextField
                    label="Uncleared Balance"
                    name="unclearedBalance"
                    value={formData.unclearedBalance !== '' ? parseFloat(formData.unclearedBalance).toFixed(2) : ''}
                    disabled
                    size="small"
                    fullWidth
                    sx={{
                      maxWidth: '280px',
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        fontWeight: 600,
                      },
                      '& .MuiInputAdornment-positionEnd': {
                        display: 'none',
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Deposit Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem', color: '#2c3e50' }}>
                  Deposit Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    select
                    label="Deposit Type"
                    name="depositType"
                    value={formData.depositType}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                    required
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
                  </TextField>
                  <TextField
                    label="Deposit Amount"
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    onBlur={() => handleBlur('depositAmount')}
                    error={isFieldInvalid('depositAmount')}
                    helperText={isFieldInvalid('depositAmount') ? 'Deposit Amount is required' : ''}
                    size="small"
                    fullWidth
                    required
                    sx={{
                      '& .MuiFormLabel-root.Mui-required::after': {
                        color: '#fff',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                  <TextField
                    label="Comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    multiline
                    minRows={4}
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1 }}>
                    <FormControlLabel
                      control={<Checkbox name="sendSmsFee" checked={formData.sendSmsFee} onChange={handleChange} />}
                      label="Send SMS fee"
                      sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' }, m: 0 }}
                    />
                    <TextField label="Fee Amount" name="feeAmount" value={formData.feeAmount} onChange={handleChange} size="small" sx={{ width: '120px' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Cash Details Card - Only show when deposit type is cash */}
            {formData.depositType === 'cash' && (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem', color: '#2c3e50' }}>
                  Cash Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    label="Cash Account"
                    name="cashAccount"
                    value={formData.cashAccount}
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
                    label="Credit Limit"
                    name="creditLimit"
                    value={formData.creditLimit}
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
                    label="Debit Limit"
                    name="debitLimit"
                    value={formData.debitLimit}
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
                    label="Loan Limit"
                    name="loanLimit"
                    value={formData.loanLimit}
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

            {/* Check Details Card - Only show when deposit type is cheque */}
            {formData.depositType === 'cheque' && (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem', color: '#2c3e50' }}>
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
                    {banks.map((bank) => (
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
                    disabled={formData.depositType !== 'cheque' || !formData.bank}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">Select account</MenuItem>
                    {bankAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Contra Account"
                    name="contraAccount"
                    value={formData.contraAccount}
                    onChange={handleChange}
                    onBlur={() => handleBlur('contraAccount')}
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
                  >
                    <MenuItem value="">Select contra account</MenuItem>
                    {contraAccounts.map((account) => (
                      <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                        {account.AccountName?.trim()}
                      </MenuItem>
                    ))}
                  </TextField>
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
              onClick={handleSaveDeposit}
              disabled={isSaving}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              {isSaving ? 'Saving...' : '💾 Save Deposit'}
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
  );
}
