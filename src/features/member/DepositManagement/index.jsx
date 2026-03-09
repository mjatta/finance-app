import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faBuildingColumns,
  faCalendarDays,
  faCoins,
  faCommentDots,
  faFileInvoice,
  faHashtag,
  faIdBadge,
  faIdCard,
  faList,
  faMoneyCheckDollar,
  faPhone,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import logo from '../../../assets/company-logo.jpg';

export default function DepositManagement({ user }) {
  const initialForm = {
    transactionType: '',
    memberCode: '',
    payrollNo: '',
    postingAccount: '',
    bookBalance: '',
    accountNumber: '',
    clearedBalance: '',
    unclearedBalance: '',
    refNo: '',
    printReceipt: false,
    transactionDate: '',
    sendSmsFee: false,
    feeAccount: '',
    account: '',
    comments: '',
    paymentType: 'cash',
    phoneNumber: '',
    bankName: '',
    walletTransactionDate: '',
    contraAccount: '',
    checkNumber: '',
    checkAccountNumber: '',
    checkDate: '',
    // new fields for grid
    paymentMade: '',
    principal: '',
    interest: '',
    beginBalance: '',
    endBalance: '',
    outstandingBalance: '',
    order: '',
    paid: false,
  };

  const [formData, setFormData] = useState(initialForm);
  const [rows, setRows] = useState([]);
  const [openRows, setOpenRows] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [storageError, setStorageError] = useState('');
  const isReadOnlyRole = Boolean(user?.access?.readOnly) || user?.role === 'LOAN_MEMBER_READONLY';
  const depositsApiUrl = '/api/deposits';

  useEffect(() => {
    let isMounted = true;

    const loadDeposits = async () => {
      setIsLoadingRows(true);
      setStorageError('');

      try {
        const response = await fetch(depositsApiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch deposit records.');
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        setRows(Array.isArray(payload?.rows) ? payload.rows : []);
      } catch {
        if (!isMounted) {
          return;
        }

        setStorageError('Unable to load saved deposit records.');
      } finally {
        if (isMounted) {
          setIsLoadingRows(false);
        }
      }
    };

    loadDeposits();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatLabel = (key) => {
    // insert space before capital letters and capitalize first char
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase());
  };

  // columns visible in the main grid
  const headerKeys = [
    'transactionType',
    'transactionDate',
    'accountNumber',
    'paymentType',
    'paymentMade',
    'principal',
    'interest',
    'beginBalance',
    'endBalance',
    'outstandingBalance',
    'order',
    'paid',
  ];
  const headerLabels = {
    transactionType: 'Transaction Type',
    transactionDate: 'Transaction Date',
    accountNumber: 'Account Number',
    paymentType: 'Payment Type',
    paymentMade: 'Payment Made',
    principal: 'Principal',
    interest: 'Interest',
    beginBalance: 'Begin Balance',
    endBalance: 'End Balance',
    outstandingBalance: 'Outstanding Balance',
    order: 'Order',
    paid: 'Paid',
  };

  const cardStackSx = { display: 'flex', flexDirection: 'column', gap: 2 };
  const rowSx = { display: 'flex', flexWrap: 'wrap', gap: 2 };
  const fieldSx = {
    flex: '1 1 220px',
    minWidth: 220,
    '& .MuiInputLabel-root': {
      fontWeight: 700,
      color: '#334e68',
    },
  };
  const cardSx = { mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' };
  const sectionTitleSx = {
    mb: 2,
    px: 1.5,
    py: 1,
    borderRadius: 1,
    borderLeft: '4px solid',
    borderColor: 'primary.main',
    bgcolor: 'grey.50',
    fontWeight: 700,
  };

  const toggleRow = (idx) => {
    setOpenRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getAdornment = (icon) => (
    <InputAdornment position="start">
      <FontAwesomeIcon icon={icon} />
    </InputAdornment>
  );

  const formatNumberValue = (value) => {
    const raw = String(value ?? '').replace(/,/g, '');
    const cleaned = raw.replace(/[^\d.]/g, '');
    if (!cleaned) {
      return '';
    }

    const [integerPart = '', ...decimalParts] = cleaned.split('.');
    const normalizedInteger = integerPart.replace(/^0+(\d)/, '$1');
    const withCommas = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = decimalParts.join('').slice(0, 2);

    return decimalPart ? `${withCommas}.${decimalPart}` : withCommas;
  };

  const formatPhoneValue = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 12);
    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const validateField = (name, value, nextForm) => {
    const requiredMessages = {
      paymentMade: 'Payment Made is required',
      transactionType: 'Transaction Type is required',
      memberCode: 'Member Code is required',
      payrollNo: 'Payroll No is required',
      postingAccount: 'Posting Account is required',
      bookBalance: 'Book Balance is required',
      accountNumber: 'Account Number is required',
      transactionDate: 'Transaction Date is required',
      account: 'Account is required',
    };

    if (requiredMessages[name] && !String(value || '').trim()) {
      return requiredMessages[name];
    }

    if (nextForm.sendSmsFee && name === 'feeAccount' && !String(value || '').trim()) {
      return 'Fee Account is required when Send SMS Fee is checked';
    }

    if (name === 'feeAccount' && nextForm.sendSmsFee && !String(value || '').trim()) {
      return 'Fee Account is required when Send SMS Fee is checked';
    }

    const numericValue = Number(String(value || '').replace(/,/g, ''));
    if (name === 'paymentMade' && value && (Number.isNaN(numericValue) || numericValue <= 0)) {
      return 'Payment Made must be greater than 0';
    }

    if (['bookBalance', 'clearedBalance', 'unclearedBalance'].includes(name) && value && Number.isNaN(numericValue)) {
      return 'Enter a valid number';
    }

    if (name === 'phoneNumber' && value) {
      const phoneDigits = String(value).replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        return 'Enter a valid phone number';
      }
    }

    if (name === 'phoneNumber' && value && !String(value).replace(/\D/g, '')) {
      return 'Enter a valid phone number';
    }

    if (nextForm.paymentType === 'mobile' && name === 'walletTransactionDate' && !String(value || '').trim()) {
      return 'Wallet Transaction Date is required for Mobile Wallet';
    }

    if (nextForm.paymentType === 'cheque') {
      if (name === 'bankName' && !String(value || '').trim()) {
        return 'Bank Name is required for Cheque';
      }
      if (name === 'checkNumber' && !String(value || '').trim()) {
        return 'Check Number is required for Cheque';
      }
      if (name === 'checkAccountNumber' && !String(value || '').trim()) {
        return 'Check Account Number is required for Cheque';
      }
      if (name === 'checkDate' && !String(value || '').trim()) {
        return 'Check Date is required for Cheque';
      }
    }

    return '';
  };

  const validateAllFields = (nextForm) => {
    const fieldsToValidate = [
      'paymentMade',
      'transactionType',
      'memberCode',
      'payrollNo',
      'postingAccount',
      'bookBalance',
      'accountNumber',
      'transactionDate',
      'feeAccount',
      'account',
      'phoneNumber',
      'bankName',
      'walletTransactionDate',
      'checkNumber',
      'checkAccountNumber',
      'checkDate',
    ];

    const nextErrors = {};
    fieldsToValidate.forEach((field) => {
      const fieldError = validateField(field, nextForm[field], nextForm);
      if (fieldError) {
        nextErrors[field] = fieldError;
      }
    });

    return nextErrors;
  };

  const updateField = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (touched[name]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: validateField(name, value, next),
        }));
      }
      return next;
    });
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formData[name], formData),
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      updateField(name, checked);
      return;
    }

    const commaFields = ['paymentMade', 'bookBalance', 'clearedBalance', 'unclearedBalance'];
    if (commaFields.includes(name)) {
      updateField(name, formatNumberValue(value));
      return;
    }

    if (name === 'phoneNumber') {
      updateField(name, formatPhoneValue(value));
      return;
    }

    updateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnlyRole) {
      return;
    }
    const nextErrors = validateAllFields(formData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const touchedMap = {};
      Object.keys(nextErrors).forEach((key) => {
        touchedMap[key] = true;
      });
      setTouched((prev) => ({ ...prev, ...touchedMap }));
      return;
    }

    setIsSavingRow(true);
    setStorageError('');

    try {
      const response = await fetch(depositsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row: formData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save deposit record.');
      }

      const payload = await response.json();
      setRows(Array.isArray(payload?.rows) ? payload.rows : []);
      setOpenRows({});
      setFormData(initialForm);
      setErrors({});
      setTouched({});
    } catch {
      setStorageError('Unable to save deposit record.');
    } finally {
      setIsSavingRow(false);
    }
  };

  const handlePrintGrid = () => {
    if (rows.length === 0) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      return;
    }

    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const headHtml = headerKeys
      .map((key) => `<th>${headerLabels[key] || key}</th>`)
      .join('');

    const bodyHtml = rows
      .map((row, index) => {
        const rowCells = headerKeys
          .map((key) => {
            const value = row[key];
            if (typeof value === 'boolean') {
              return `<td>${value ? 'Yes' : 'No'}</td>`;
            }
            return `<td>${escapeHtml(value ?? '')}</td>`;
          })
          .join('');

        const detailsHtml = Object.entries(row)
          .filter(([key]) => !headerKeys.includes(key))
          .map(([key, value]) => `
            <div class="detail-item">
              <span class="detail-label">${escapeHtml(formatLabel(key))}:</span>
              <span class="detail-value">${escapeHtml(typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value ?? '')}</span>
            </div>
          `)
          .join('');

        return `
          <tr class="main-row">${rowCells}</tr>
          <tr class="detail-row">
            <td colspan="${headerKeys.length}" class="detail-cell">
              <div class="detail-wrap">
                <div class="detail-title">Additional Details - Entry #${index + 1}</div>
                <div class="detail-grid">${detailsHtml}</div>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Deposits</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Inter, Segoe UI, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #102a43;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-shell {
              border: 1px solid #d9e2ec;
              border-radius: 12px;
              overflow: visible;
            }
            .print-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #dbe7f3;
              padding: 14px 18px;
              background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
            }
            .brand-wrap { display: flex; align-items: center; gap: 12px; }
            .brand-logo {
              width: 56px;
              height: 56px;
              object-fit: cover;
              border-radius: 8px;
              border: 1px solid #dbe7f3;
            }
            .brand-name { font-size: 20px; font-weight: 800; color: #102a43; }
            .report-title { font-size: 18px; font-weight: 800; color: #0f4c81; }
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 18px;
              background: #f8fbff;
              border-bottom: 1px solid #e4edf5;
              font-size: 12px;
              color: #486581;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #d9e2ec;
              padding: 6px 6px;
              text-align: left;
              font-size: 11px;
              line-height: 1.25;
              white-space: normal;
              word-break: break-word;
            }
            th {
              background: #1f4f82;
              color: #ffffff;
              font-weight: 700;
              letter-spacing: 0.2px;
            }
            .main-row td {
              background: #ffffff;
            }
            .main-row:nth-of-type(4n+1) td {
              background: #fbfdff;
            }
            .detail-cell {
              background: #f7fbff;
              border-top: none;
            }
            .detail-wrap {
              padding: 10px 4px;
              break-inside: avoid;
            }
            .detail-title {
              font-weight: 700;
              margin-bottom: 10px;
              color: #0f4c81;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(180px, 1fr));
              gap: 8px 12px;
            }
            .detail-item {
              font-size: 12px;
              background: #ffffff;
              border: 1px solid #d9e2ec;
              border-radius: 6px;
              padding: 6px 8px;
            }
            .detail-label { font-weight: 700; color: #334e68; }
            .detail-value { color: #102a43; }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            @media print {
              body { padding: 0; }
              .report-shell { border: none; border-radius: 0; }
              .detail-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
          </style>
        </head>
        <body>
          <div class="report-shell">
            <div class="print-header">
              <div class="brand-wrap">
                <img class="brand-logo" src="${logo}" alt="Company logo" />
                <div class="brand-name">Microfinance Management</div>
              </div>
              <div class="report-title">Deposits</div>
            </div>
            <div class="meta-row">
              <span>Generated: ${new Date().toLocaleString()}</span>
              <span>Total Records: ${rows.length}</span>
            </div>
            <table>
              <thead>
                <tr>${headHtml}</tr>
              </thead>
              <tbody>
                ${bodyHtml}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Deposit Management
      </Typography>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view and print saved records, but cannot edit or add deposits.
        </Typography>
      )}

      {storageError && (
        <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 600 }}>
          {storageError}
        </Typography>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="fieldset"
        disabled={isReadOnlyRole}
        sx={{
          border: 'none',
          p: 0,
          m: 0,
          opacity: isReadOnlyRole ? 0.55 : 1,
          pointerEvents: isReadOnlyRole ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
      >
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        {/* group 1: basic transaction info */}
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Transaction Details
            </Typography>
            <Box sx={cardStackSx}>
              <Box sx={rowSx}>
          <TextField
            label="Payment Made"
            name="paymentMade"
            value={formData.paymentMade}
            onChange={handleChange}
            onBlur={() => handleBlur('paymentMade')}
            error={Boolean(errors.paymentMade)}
            helperText={errors.paymentMade}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faCoins),
            }}
          />
          <TextField
            select
            label="Transaction Type"
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            onBlur={() => handleBlur('transactionType')}
            error={Boolean(errors.transactionType)}
            helperText={errors.transactionType}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faList),
            }}
          >
            <MenuItem value="deposit">Deposit</MenuItem>
            <MenuItem value="withdrawal">Withdrawal</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
          </TextField>

          <TextField
            label="Member Code"
            name="memberCode"
            value={formData.memberCode}
            onChange={handleChange}
            onBlur={() => handleBlur('memberCode')}
            error={Boolean(errors.memberCode)}
            helperText={errors.memberCode}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faIdBadge),
            }}
          />

          <TextField
            label="Payroll No"
            name="payrollNo"
            value={formData.payrollNo}
            onChange={handleChange}
            onBlur={() => handleBlur('payrollNo')}
            error={Boolean(errors.payrollNo)}
            helperText={errors.payrollNo}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faIdCard),
            }}
          />

          <TextField
            label="Posting Account"
            name="postingAccount"
            value={formData.postingAccount}
            onChange={handleChange}
            onBlur={() => handleBlur('postingAccount')}
            error={Boolean(errors.postingAccount)}
            helperText={errors.postingAccount}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faBuildingColumns),
            }}
          />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* group 2: balances */}
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Balances
            </Typography>
            <Box sx={rowSx}>
          <TextField
            label="Book Balance"
            name="bookBalance"
            value={formData.bookBalance}
            onChange={handleChange}
            onBlur={() => handleBlur('bookBalance')}
            error={Boolean(errors.bookBalance)}
            helperText={errors.bookBalance}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faBook),
            }}
          />
          <TextField
            label="Account Number"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            onBlur={() => handleBlur('accountNumber')}
            error={Boolean(errors.accountNumber)}
            helperText={errors.accountNumber}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faHashtag),
            }}
          />
          <TextField
            label="Cleared Balance"
            name="clearedBalance"
            value={formData.clearedBalance}
            onChange={handleChange}
            onBlur={() => handleBlur('clearedBalance')}
            error={Boolean(errors.clearedBalance)}
            helperText={errors.clearedBalance}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faCoins),
            }}
          />
          <TextField
            label="Uncleared Balance"
            name="unclearedBalance"
            value={formData.unclearedBalance}
            onChange={handleChange}
            onBlur={() => handleBlur('unclearedBalance')}
            error={Boolean(errors.unclearedBalance)}
            helperText={errors.unclearedBalance}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faCoins),
            }}
          />
            </Box>
          </CardContent>
        </Card>

        {/* group 3: reference & options */}
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Reference & Options
            </Typography>
            <Box sx={cardStackSx}>
              <Box
                sx={{
                  ...rowSx,
                  px: 1.5,
                  py: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '& .MuiFormControlLabel-label': {
                    fontWeight: 700,
                    color: '#334e68',
                  },
                }}
              >
          <FormControlLabel
            control={
              <Checkbox
                name="paid"
                checked={formData.paid}
                onChange={handleChange}
              />
            }
            label="Paid"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="printReceipt"
                checked={formData.printReceipt}
                onChange={handleChange}
              />
            }
            label="Print Receipt"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="sendSmsFee"
                checked={formData.sendSmsFee}
                onChange={handleChange}
              />
            }
            label="Send SMS Fee"
          />
              </Box>

              <Box sx={rowSx}>
          <TextField
            label="Reference Number"
            name="refNo"
            value={formData.refNo}
            onChange={handleChange}
            onBlur={() => handleBlur('refNo')}
            error={Boolean(errors.refNo)}
            helperText={errors.refNo}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faFileInvoice),
            }}
          />
          <DatePicker
            label="Transaction Date"
            value={formData.transactionDate ? dayjs(formData.transactionDate) : null}
            onChange={(newValue) => {
              updateField('transactionDate', newValue ? newValue.format('YYYY-MM-DD') : '');
            }}
            slotProps={{
              textField: {
                sx: fieldSx,
                onBlur: () => handleBlur('transactionDate'),
                error: Boolean(errors.transactionDate),
                helperText: errors.transactionDate,
                InputProps: {
                  startAdornment: getAdornment(faCalendarDays),
                },
              },
            }}
          />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* group 4: accounts/comments */}
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Accounts & Comments
            </Typography>
            <Box sx={cardStackSx}>
              <Box sx={rowSx}>
          <TextField
            label="Fee Account"
            name="feeAccount"
            value={formData.feeAccount}
            onChange={handleChange}
            onBlur={() => handleBlur('feeAccount')}
            error={Boolean(errors.feeAccount)}
            helperText={errors.feeAccount}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faWallet),
            }}
          />
          <TextField
            label="Account"
            name="account"
            value={formData.account}
            onChange={handleChange}
            onBlur={() => handleBlur('account')}
            error={Boolean(errors.account)}
            helperText={errors.account}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faBuildingColumns),
            }}
          />
              </Box>

              <Box sx={rowSx}>
          <TextField
            label="Comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            onBlur={() => handleBlur('comments')}
            error={Boolean(errors.comments)}
            helperText={errors.comments}
            multiline
            rows={3}
            sx={{
              flex: '1 1 100%',
              minWidth: 320,
              '& .MuiInputLabel-root': {
                fontWeight: 700,
                color: '#334e68',
              },
            }}
            InputProps={{
              startAdornment: getAdornment(faCommentDots),
            }}
          />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* group 5: payment and related */}
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Payment Details
            </Typography>
            <Box sx={cardStackSx}>
              <FormControl
                component="fieldset"
                sx={{
                  px: 1.5,
                  py: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '& .MuiFormLabel-root': {
                    fontWeight: 700,
                    color: '#334e68',
                  },
                  '& .MuiFormControlLabel-label': {
                    fontWeight: 700,
                    color: '#334e68',
                  },
                }}
              >
                <FormLabel component="legend">Payment Type</FormLabel>
                <RadioGroup
                  row
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label="Cash"
                  />
                  <FormControlLabel
                    value="cheque"
                    control={<Radio />}
                    label="Cheque"
                  />
                  <FormControlLabel
                    value="mobile"
                    control={<Radio />}
                    label="Mobile Wallet"
                  />
                </RadioGroup>
              </FormControl>

              <Box sx={rowSx}>
                <TextField
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phoneNumber')}
                  error={Boolean(errors.phoneNumber)}
                  helperText={errors.phoneNumber}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: getAdornment(faPhone),
                  }}
                />
                <TextField
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('bankName')}
                  error={Boolean(errors.bankName)}
                  helperText={errors.bankName}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: getAdornment(faBuildingColumns),
                  }}
                />
                <DatePicker
                  label="Wallet Transaction Date"
                  value={formData.walletTransactionDate ? dayjs(formData.walletTransactionDate) : null}
                  onChange={(newValue) => {
                    updateField('walletTransactionDate', newValue ? newValue.format('YYYY-MM-DD') : '');
                  }}
                  slotProps={{
                    textField: {
                      sx: fieldSx,
                      onBlur: () => handleBlur('walletTransactionDate'),
                      error: Boolean(errors.walletTransactionDate),
                      helperText: errors.walletTransactionDate,
                      InputProps: {
                        startAdornment: getAdornment(faCalendarDays),
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* group 6: check/contra */}
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Check / Contra Info
            </Typography>
            <Box sx={rowSx}>
          <TextField
            label="Contra Account"
            name="contraAccount"
            value={formData.contraAccount}
            onChange={handleChange}
            onBlur={() => handleBlur('contraAccount')}
            error={Boolean(errors.contraAccount)}
            helperText={errors.contraAccount}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faBuildingColumns),
            }}
          />
          <TextField
            label="Check Number"
            name="checkNumber"
            value={formData.checkNumber}
            onChange={handleChange}
            onBlur={() => handleBlur('checkNumber')}
            error={Boolean(errors.checkNumber)}
            helperText={errors.checkNumber}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faMoneyCheckDollar),
            }}
          />
          <TextField
            label="Check Account Number"
            name="checkAccountNumber"
            value={formData.checkAccountNumber}
            onChange={handleChange}
            onBlur={() => handleBlur('checkAccountNumber')}
            error={Boolean(errors.checkAccountNumber)}
            helperText={errors.checkAccountNumber}
            sx={fieldSx}
            InputProps={{
              startAdornment: getAdornment(faHashtag),
            }}
          />
          <DatePicker
            label="Check Date"
            value={formData.checkDate ? dayjs(formData.checkDate) : null}
            onChange={(newValue) => {
              updateField('checkDate', newValue ? newValue.format('YYYY-MM-DD') : '');
            }}
            slotProps={{
              textField: {
                sx: fieldSx,
                onBlur: () => handleBlur('checkDate'),
                error: Boolean(errors.checkDate),
                helperText: errors.checkDate,
                InputProps: {
                  startAdornment: getAdornment(faCalendarDays),
                },
              },
            }}
          />
            </Box>
          </CardContent>
        </Card>

        <Button variant="contained" color="primary" type="submit" disabled={isSavingRow}>
          {isSavingRow ? 'Saving...' : 'Add to Table'}
        </Button>
      </Box>
      </Box>
      </LocalizationProvider>
      {isLoadingRows && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Loading saved deposit records...
        </Typography>
      )}
      {rows.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Saved Deposit Records
            </Typography>
            <Button variant="outlined" size="small" onClick={handlePrintGrid}>
              Print
            </Button>
          </Box>
          <TableContainer sx={{ width: '100%', maxHeight: 420, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 980, width: 'max-content' }} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      top: 0,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      zIndex: 2,
                      width: 48,
                    }}
                  ></TableCell>
                  {headerKeys.map((key) => (
                    <TableCell
                      key={key}
                      sx={{
                        position: 'sticky',
                        top: 0,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        zIndex: 2,
                        fontWeight: 700,
                        letterSpacing: 0.2,
                      }}
                    >
                      {headerLabels[key] || key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <TableRow
                      hover
                      sx={{
                        bgcolor: idx % 2 === 0 ? 'background.paper' : 'grey.50',
                        '& > td': { borderBottomColor: 'divider' },
                      }}
                    >
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(idx)}
                          aria-label={openRows[idx] ? 'collapse' : 'expand'}
                        >
                          <ExpandMoreIcon
                            sx={{ transform: openRows[idx] ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                          />
                        </IconButton>
                      </TableCell>
                      {headerKeys.map((key) => (
                        <TableCell
                          key={key}
                          sx={{ wordBreak: 'break-word', maxWidth: 200 }}
                        >
                          {typeof row[key] === 'boolean' ? (
                            <Chip
                              size="small"
                              label={row[key] ? 'Yes' : 'No'}
                              color={row[key] ? 'success' : 'default'}
                              variant={row[key] ? 'filled' : 'outlined'}
                            />
                          ) : (
                            row[key]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={headerKeys.length + 1}>
                        <Collapse in={openRows[idx]} timeout="auto" unmountOnExit>
                          <Box
                            sx={{
                              m: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Record Details
                              </Typography>
                              <Chip size="small" label={`Entry #${idx + 1}`} variant="outlined" />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              {(() => {
                                const fields = Object.entries(row).filter(([k]) => !headerKeys.includes(k));
                                const quarter = Math.ceil(fields.length / 4);
                                const cols = [
                                  fields.slice(0, quarter),
                                  fields.slice(quarter, quarter * 2),
                                  fields.slice(quarter * 2, quarter * 3),
                                  fields.slice(quarter * 3),
                                ];

                                return cols.map((col, colIdx) => (
                                  <Box
                                    key={colIdx}
                                    sx={{
                                      flex: '1 1 220px',
                                      minWidth: 220,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1.5,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {col.map(([k, v], idx2) => (
                                      <Box
                                        key={k}
                                        sx={{
                                          px: 1.25,
                                          py: 0.8,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 0.2,
                                          bgcolor: idx2 % 2 === 0 ? 'grey.50' : 'background.paper',
                                          borderBottom: idx2 !== col.length - 1 ? '1px solid' : 'none',
                                          borderColor: 'divider',
                                        }}
                                      >
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                          {formatLabel(k)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                          {String(v)}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                ));
                              })()}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
