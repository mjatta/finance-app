import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  MenuItem,
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import logo from '../../../assets/company-logo.jpg';
import {
  faCalendarDays,
  faCoins,
  faCommentDots,
  faHashtag,
  faIdBadge,
  faMoneyCheckDollar,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';

export default function Repayments({ user }) {
  const initialForm = {
    memberCode: '',
    loanAccountNumber: '',
    repaymentDate: '',
    paymentType: 'cash',
    amountPaid: '',
    principalPaid: '',
    interestPaid: '',
    penaltyPaid: '',
    outstandingBalance: '',
    refNo: '',
    phoneNumber: '',
    comments: '',
  };

  const headerKeys = [
    'memberCode',
    'loanAccountNumber',
    'repaymentDate',
    'paymentType',
    'amountPaid',
    'principalPaid',
    'interestPaid',
    'penaltyPaid',
    'outstandingBalance',
  ];

  const headerLabels = {
    memberCode: 'Member Code',
    loanAccountNumber: 'Loan Account No',
    repaymentDate: 'Repayment Date',
    paymentType: 'Payment Type',
    amountPaid: 'Amount Paid',
    principalPaid: 'Principal Paid',
    interestPaid: 'Interest Paid',
    penaltyPaid: 'Penalty Paid',
    outstandingBalance: 'Outstanding Balance',
  };

  const [formData, setFormData] = useState(initialForm);
  const [rows, setRows] = useState([]);
  const [openRows, setOpenRows] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [storageError, setStorageError] = useState('');

  const isReadOnlyRole = Boolean(user?.access?.readOnly);
  const repaymentsApiUrl = '/api/loan-repayments';

  useEffect(() => {
    let isMounted = true;

    const loadRepayments = async () => {
      setIsLoadingRows(true);
      setStorageError('');

      try {
        const response = await fetch(repaymentsApiUrl);
        if (!response.ok) {
          throw new Error('Failed to load loan repayments.');
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        setRows(Array.isArray(payload?.rows) ? payload.rows : []);
      } catch {
        if (isMounted) {
          setStorageError('Unable to load saved loan repayments.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false);
        }
      }
    };

    loadRepayments();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase());

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

  const parseAmount = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;

  const formatAmount = (value) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);

  const summaryValues = useMemo(() => {
    const hasTypedData = Object.values(formData).some((value) => String(value ?? '').trim() !== '');
    const source = hasTypedData ? formData : rows[rows.length - 1] || {};

    const loanBalance = parseAmount(source.outstandingBalance);
    const amountPaid = parseAmount(source.amountPaid);
    const principalPaid = parseAmount(source.principalPaid);
    const interestPaid = parseAmount(source.interestPaid);
    const penaltyPaid = parseAmount(source.penaltyPaid);

    const calculatedInterest = Math.max(amountPaid - principalPaid - penaltyPaid, 0);
    const accruedInterest = interestPaid + penaltyPaid;

    return {
      loanBalance,
      calculatedInterest,
      accruedInterest,
    };
  }, [formData, rows]);

  const validate = (data) => {
    const nextErrors = {};
    if (!data.memberCode.trim()) {
      nextErrors.memberCode = 'Member Code is required';
    }
    if (!data.loanAccountNumber.trim()) {
      nextErrors.loanAccountNumber = 'Loan Account Number is required';
    }
    if (!data.repaymentDate.trim()) {
      nextErrors.repaymentDate = 'Repayment Date is required';
    }

    const numericFields = ['amountPaid', 'principalPaid', 'interestPaid', 'penaltyPaid', 'outstandingBalance'];
    numericFields.forEach((field) => {
      const numericValue = Number(String(data[field] || '').replace(/,/g, ''));
      if (!String(data[field] || '').trim()) {
        nextErrors[field] = `${formatLabel(field)} is required`;
      } else if (Number.isNaN(numericValue) || numericValue < 0) {
        nextErrors[field] = `Enter a valid ${formatLabel(field).toLowerCase()}`;
      }
    });

    if (data.phoneNumber) {
      const digits = String(data.phoneNumber).replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        nextErrors.phoneNumber = 'Enter a valid phone number';
      }
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['amountPaid', 'principalPaid', 'interestPaid', 'penaltyPaid', 'outstandingBalance'];
    const nextValue = numericFields.includes(name) ? formatNumberValue(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnlyRole) {
      return;
    }

    const nextErrors = validate(formData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSavingRow(true);
    setStorageError('');

    try {
      const response = await fetch(repaymentsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row: formData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save repayment row.');
      }

      const payload = await response.json();
      setRows(Array.isArray(payload?.rows) ? payload.rows : []);
      setFormData(initialForm);
      setErrors({});
      setOpenRows({});
    } catch {
      setStorageError('Unable to save loan repayment record.');
    } finally {
      setIsSavingRow(false);
    }
  };

  const toggleRow = (idx) => {
    setOpenRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
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
          .map((key) => `<td>${escapeHtml(row[key] ?? '-')}</td>`)
          .join('');

        const detailsHtml = Object.entries(row)
          .filter(([key]) => !headerKeys.includes(key))
          .map(([key, value]) => `
            <div class="detail-item">
              <span class="detail-label">${escapeHtml(formatLabel(key))}:</span>
              <span class="detail-value">${escapeHtml(value ?? '-')}</span>
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
          <title>Loan Repayments</title>
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
              <div class="report-title">Loan Repayments</div>
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
        Loan Repayments
      </Typography>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view repayment history, but cannot add new loan repayments.
        </Typography>
      )}

      {storageError && (
        <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 600 }}>
          {storageError}
        </Typography>
      )}

      <Box
        sx={{
          mb: 2,
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Loan Balance
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(summaryValues.loanBalance)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Calculated Interest
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(summaryValues.calculatedInterest)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Accrued Interest
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(summaryValues.accruedInterest)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="fieldset"
        disabled={isReadOnlyRole}
        sx={{ border: 'none', p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1, pointerEvents: isReadOnlyRole ? 'none' : 'auto' }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                Repayment Entry
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  label="Member Code"
                  name="memberCode"
                  value={formData.memberCode}
                  onChange={handleChange}
                  error={Boolean(errors.memberCode)}
                  helperText={errors.memberCode}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faIdBadge) }}
                />
                <TextField
                  label="Loan Account Number"
                  name="loanAccountNumber"
                  value={formData.loanAccountNumber}
                  onChange={handleChange}
                  error={Boolean(errors.loanAccountNumber)}
                  helperText={errors.loanAccountNumber}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faHashtag) }}
                />
                <DatePicker
                  label="Repayment Date"
                  value={formData.repaymentDate ? dayjs(formData.repaymentDate) : null}
                  onChange={(newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      repaymentDate: newValue ? newValue.format('YYYY-MM-DD') : '',
                    }));
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.repaymentDate),
                      helperText: errors.repaymentDate,
                      sx: { flex: '1 1 220px', minWidth: 220 },
                      InputProps: { startAdornment: getAdornment(faCalendarDays) },
                    },
                  }}
                />
                <TextField
                  select
                  label="Payment Type"
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faMoneyCheckDollar) }}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="mobile">Mobile Wallet</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                </TextField>
                <TextField
                  label="Amount Paid"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleChange}
                  error={Boolean(errors.amountPaid)}
                  helperText={errors.amountPaid}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faCoins) }}
                />
                <TextField
                  label="Principal Paid"
                  name="principalPaid"
                  value={formData.principalPaid}
                  onChange={handleChange}
                  error={Boolean(errors.principalPaid)}
                  helperText={errors.principalPaid}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faCoins) }}
                />
                <TextField
                  label="Interest Paid"
                  name="interestPaid"
                  value={formData.interestPaid}
                  onChange={handleChange}
                  error={Boolean(errors.interestPaid)}
                  helperText={errors.interestPaid}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faCoins) }}
                />
                <TextField
                  label="Penalty Paid"
                  name="penaltyPaid"
                  value={formData.penaltyPaid}
                  onChange={handleChange}
                  error={Boolean(errors.penaltyPaid)}
                  helperText={errors.penaltyPaid}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faCoins) }}
                />
                <TextField
                  label="Outstanding Balance"
                  name="outstandingBalance"
                  value={formData.outstandingBalance}
                  onChange={handleChange}
                  error={Boolean(errors.outstandingBalance)}
                  helperText={errors.outstandingBalance}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faCoins) }}
                />
                <TextField
                  label="Reference Number"
                  name="refNo"
                  value={formData.refNo}
                  onChange={handleChange}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faHashtag) }}
                />
                <TextField
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  error={Boolean(errors.phoneNumber)}
                  helperText={errors.phoneNumber}
                  sx={{ flex: '1 1 220px', minWidth: 220 }}
                  InputProps={{ startAdornment: getAdornment(faPhone) }}
                />
                <TextField
                  label="Comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  sx={{ flex: '1 1 100%', minWidth: 320 }}
                  InputProps={{ startAdornment: getAdornment(faCommentDots) }}
                />
              </Box>
            </CardContent>
          </Card>

          <Button variant="contained" color="primary" type="submit" disabled={isSavingRow}>
            {isSavingRow ? 'Saving...' : 'Add Repayment'}
          </Button>
        </Box>
      </Box>
      </LocalizationProvider>

      {isLoadingRows && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Loading saved loan repayments...
        </Typography>
      )}

      {rows.length > 0 && (
        <Paper elevation={0} sx={{ width: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Saved Repayment Records
            </Typography>
            <Button variant="outlined" size="small" onClick={handlePrintGrid}>
              Print
            </Button>
          </Box>

          <TableContainer sx={{ width: '100%', maxHeight: 420, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 980, width: 'max-content' }} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: 'sticky', top: 0, bgcolor: 'primary.main', color: 'primary.contrastText', zIndex: 2, width: 48 }}></TableCell>
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
                      }}
                    >
                      {headerLabels[key]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <TableRow hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : 'grey.50' }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleRow(idx)} aria-label={openRows[idx] ? 'collapse' : 'expand'}>
                          <ExpandMoreIcon sx={{ transform: openRows[idx] ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                        </IconButton>
                      </TableCell>

                      {headerKeys.map((key) => (
                        <TableCell key={key} sx={{ wordBreak: 'break-word', maxWidth: 220 }}>
                          {row[key] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>

                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={headerKeys.length + 1}>
                        <Collapse in={openRows[idx]} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Repayment Details
                              </Typography>
                              <Chip size="small" label={`Entry #${idx + 1}`} variant="outlined" />
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1 }}>
                              {Object.entries(row).map(([k, v]) => (
                                <Box key={k} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {formatLabel(k)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                    {String(v || '-')}
                                  </Typography>
                                </Box>
                              ))}
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
