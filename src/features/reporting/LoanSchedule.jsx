import React, { useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { getFullApiUrl } from '../../utils/apiConfig';
import { useGetLoanSchedule } from './LoanSchedule/hooks/useGetLoanSchedule';
import { buildLoanSchedulePrintHtml } from './LoanSchedule/printSetup';

const formatAmount = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const escapeCSV = (value) => {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
};

const convertToCSV = (rows) => {
  const headers = ['Serial', 'Date', 'Periodic Payment', 'Principal', 'Interest', 'Beginning Balance', 'Ending Balance'];
  const csvRows = rows.map((row) => [
    row?.serial ?? '',
    row?.date ?? '',
    formatAmount(row?.periodicPayment ?? 0),
    formatAmount(row?.principal ?? 0),
    formatAmount(row?.interest ?? 0),
    formatAmount(row?.beginningBalance ?? 0),
    formatAmount(row?.endingBalance ?? 0),
  ]);
  return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
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

const getCustomerNameFromPayload = (payload) => {
  const directName = payload?.CustomerName || payload?.MemberName || payload?.Name || '';
  if (String(directName).trim()) {
    return String(directName).trim();
  }

  const firstAccountLabel = payload?.Accounts?.[0]?.AccountName || payload?.LoanAccounts?.[0]?.AccountName || '';
  if (!String(firstAccountLabel).trim()) {
    return '';
  }

  // Account names are usually like: "NDEY BADJIE <<Savings>> ..."; extract the person name prefix.
  return String(firstAccountLabel).split('<<')[0].trim();
};

const mapAccountOption = (account, type) => {
  const number = String(account?.AccountNumber || '').trim();
  const label = String(account?.AccountName || '').trim();
  return {
    value: number,
    label: `${label}${number ? ` (${number})` : ''}`,
    type,
  };
};

export default function LoanSchedule() {
  const { fetchLoanSchedule, loading: isPrinting, error: printError } = useGetLoanSchedule();
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountOptions, setAccountOptions] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const isSuccessStatus = statusMessage === 'Customer and account details loaded successfully.';

  const handleCustomerCodeChange = (e) => {
    const code = e.target.value;
    setCustomerCode(code);
    setAccountNumber('');
    setAccountOptions([]);
    setStatusMessage('');

    if (code.trim()) {
      // Reset customer name to trigger fresh fetch
      setCustomerName('');
    } else {
      setCustomerName('');
    }
  };

  const handleCustomerCodeBlur = async () => {
    if (!customerCode.trim()) {
      setCustomerName('');
      setAccountOptions([]);
      setAccountNumber('');
      return;
    }

    setIsLoadingCustomer(true);

    try {
      const response = await fetch(getFullApiUrl(`/api/remote-member/details/${customerCode.trim()}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load customer details (${response.status})`);
      }

      const payload = await response.json();
      const loanAccounts = Array.isArray(payload?.LoanAccounts)
        ? payload.LoanAccounts.map((item) => mapAccountOption(item, 'Loan Account'))
        : [];
      const allAccounts = loanAccounts.filter((item) => item.value);

      setCustomerName(getCustomerNameFromPayload(payload));
      setAccountOptions(allAccounts);

      if (allAccounts.length === 1) {
        setAccountNumber(allAccounts[0].value);
      }

      if (allAccounts.length === 0) {
        setStatusMessage('Customer loaded, but no loan accounts were found.');
      } else {
        setStatusMessage('Customer and account details loaded successfully.');
      }
    } catch (error) {
      setCustomerName('');
      setAccountOptions([]);
      setAccountNumber('');
      setStatusMessage(error?.message || 'Failed to load customer details.');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const handleExportPDF = (data, customerName) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
      return;
    }

    const reportHtml = buildLoanSchedulePrintHtml(data, {
      customerCode,
      customerName,
      accountNumber,
    });

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportCSV = (data, customerName) => {
    const scheduleRows = Array.isArray(data?.Schedule) ? data.Schedule : Array.isArray(data) ? data : [];
    const csvContent = convertToCSV(scheduleRows);
    const filename = `loan-schedule-${customerCode}-${customerName || 'export'}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const handleExportExcel = (data, customerName) => {
    const scheduleRows = Array.isArray(data?.Schedule) ? data.Schedule : Array.isArray(data) ? data : [];
    const csvContent = convertToCSV(scheduleRows);
    const filename = `loan-schedule-${customerCode}-${customerName || 'export'}.xlsx`;
    downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleFetchAndExport = async (exportType) => {
    if (!customerCode.trim() || !accountNumber.trim()) {
      setStatusMessage('Please enter customer code and account number before exporting.');
      return;
    }

    setStatusMessage('');

    const data = await fetchLoanSchedule(customerCode, accountNumber);
    if (data) {
      if (exportType === 'pdf') {
        handleExportPDF(data, customerName);
      } else if (exportType === 'csv') {
        handleExportCSV(data, customerName);
      } else if (exportType === 'excel') {
        handleExportExcel(data, customerName);
      }
    } else {
      setStatusMessage(printError || 'Failed to fetch loan schedule. Please try again.');
    }
  };

  const handleClear = () => {
    setCustomerCode('');
    setCustomerName('');
    setAccountNumber('');
    setAccountOptions([]);
    setStatusMessage('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Schedule
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Enter customer details to generate and print loan schedule.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {statusMessage && (
            <Alert severity={isSuccessStatus ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              label="Customer Code"
              value={customerCode}
              onChange={handleCustomerCodeChange}
              onBlur={handleCustomerCodeBlur}
              size="small"
              fullWidth
              placeholder="Enter customer code"
              disabled={isLoadingCustomer}
              helperText="Enter customer code and press Tab to load customer and account details."
              FormHelperTextProps={{
                sx: {
                  fontWeight: 800,
                  color: '#b45309',
                },
              }}
            />

            <TextField
              label="Customer Name"
              value={customerName}
              size="small"
              fullWidth
              disabled
              placeholder={isLoadingCustomer ? 'Loading customer...' : 'Auto-filled after customer code'}
              InputProps={
                isLoadingCustomer
                  ? {
                    endAdornment: (
                      <InputAdornment position="end">
                        <CircularProgress size={16} />
                      </InputAdornment>
                    ),
                  }
                  : undefined
              }
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            {isLoadingCustomer ? (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
                  Account
                </Typography>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
              </Box>
            ) : (
              <TextField
                select
                label="Account"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                size="small"
                fullWidth
                disabled={isLoadingCustomer || accountOptions.length === 0}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return 'Select account';
                    }

                    const option = accountOptions.find((item) => item.value === selected);
                    return option ? `${option.type}: ${option.label}` : selected;
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select account
                </MenuItem>
                {accountOptions.map((item) => (
                  <MenuItem key={`${item.type}-${item.value}`} value={item.value}>
                    {item.type}: {item.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('pdf')}
              disabled={!customerCode.trim() || !accountNumber.trim() || isLoadingCustomer || isPrinting}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {isPrinting ? 'Processing...' : 'PDF'}
            </Button>

            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('excel')}
              disabled={!customerCode.trim() || !accountNumber.trim() || isLoadingCustomer || isPrinting}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Excel
            </Button>

            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('csv')}
              disabled={!customerCode.trim() || !accountNumber.trim() || isLoadingCustomer || isPrinting}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              CSV
            </Button>

            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={isLoadingCustomer || isPrinting}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Backdrop
        open={isPrinting}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress color="inherit" size={26} />
          <Typography sx={{ fontWeight: 600 }}>Generating loan schedule...</Typography>
        </Box>
      </Backdrop>
    </Box>
  );
}
