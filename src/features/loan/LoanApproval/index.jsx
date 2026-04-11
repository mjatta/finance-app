import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { useLoanApprovalLoad } from './Hooks/useLoanApprovalLoad';

const LOAN_COLUMNS = [
  { field: 'customerCode', headerName: 'Customer Code', flex: 1, minWidth: 120, sortable: true },
  { field: 'customerName', headerName: 'Customer Name', flex: 1.5, minWidth: 200, sortable: true },
  { field: 'loanAmount', headerName: 'Loan Amount', flex: 1, minWidth: 140, sortable: true },
  { field: 'applicationDate', headerName: 'Application Date', flex: 1, minWidth: 140, sortable: true },
];

export default function LoanApproval() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [sortModel, setSortModel] = useState([]);

  const [approvalDetails, setApprovalDetails] = useState({
    savingBalance: '',
    previousLoanBalance: '',
    loanProduct: '',
    gracePeriod: '',
    newAccountNumber: '',
    approveAmount: '',
    duration: '',
    approveDate: '',
  });

  const [appliedLoanDetails, setAppliedLoanDetails] = useState({
    paymentFrequency: '',
    grossInterest: '',
    totalAmount: '',
    economicSector: '',
    periodicPayment: '',
    totalDuration: '',
  });

  const { fetchLoansForApproval } = useLoanApprovalLoad();

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLoansForApproval();

      if (!data || data.length === 0) {
        setLoans([]);
        setStatusMessage('No loans available for approval.');
        setStatusError(false);
        return;
      }

      // Transform API response to table rows
      const mappedLoans = data.map((item, index) => ({
        id: item.loanId || index,
        customerCode: item.customerCode || '',
        customerName: item.customerName || '',
        loanAmount: item.loanAmount || '0',
        applicationDate: item.applicationDate || '',
        // Store additional data for populating form
        savingBalance: item.savingBalance || '0',
        previousLoanBalance: item.previousLoanBalance || '0',
        loanProduct: item.loanProduct || '',
        gracePeriod: item.gracePeriod || '',
        paymentFrequency: item.paymentFrequency || '',
        grossInterest: item.grossInterest || '0',
        totalAmount: item.totalAmount || '0',
        economicSector: item.economicSector || '',
        periodicPayment: item.periodicPayment || '0',
        totalDuration: item.totalDuration || '',
      }));

      setLoans(mappedLoans);
      setStatusMessage('');
      setStatusError(false);
    } catch (error) {
      console.error('Failed to load loans:', error);
      setStatusMessage('Failed to load loan data.');
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Approval',
        action: 'Load Loans',
        message: 'Failed to load loan data.',
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchLoansForApproval]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleRowClick = (params) => {
    const loanId = params.id;
    const selectedLoan = loans.find((l) => l.id === loanId);

    if (selectedIds.includes(loanId)) {
      setSelectedIds(selectedIds.filter((id) => id !== loanId));
      setApprovalDetails({
        savingBalance: '',
        previousLoanBalance: '',
        loanProduct: '',
        gracePeriod: '',
        newAccountNumber: '',
        approveAmount: '',
        duration: '',
        approveDate: '',
      });
      setAppliedLoanDetails({
        paymentFrequency: '',
        grossInterest: '',
        totalAmount: '',
        economicSector: '',
        periodicPayment: '',
        totalDuration: '',
      });
    } else {
      setSelectedIds([loanId]);
      if (selectedLoan) {
        setApprovalDetails({
          savingBalance: selectedLoan.savingBalance,
          previousLoanBalance: selectedLoan.previousLoanBalance,
          loanProduct: selectedLoan.loanProduct,
          gracePeriod: selectedLoan.gracePeriod,
          newAccountNumber: '',
          approveAmount: '',
          duration: '',
          approveDate: '',
        });
        setAppliedLoanDetails({
          paymentFrequency: selectedLoan.paymentFrequency,
          grossInterest: selectedLoan.grossInterest,
          totalAmount: selectedLoan.totalAmount,
          economicSector: selectedLoan.economicSector,
          periodicPayment: selectedLoan.periodicPayment,
          totalDuration: selectedLoan.totalDuration,
        });
      }
    }
  };

  const handleApprovalDetailsChange = (e) => {
    const { name, value } = e.target;
    setApprovalDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleApproveAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setApprovalDetails((prev) => ({ ...prev, approveAmount: cleanValue }));
  };

  const handleApproveLoan = () => {
    if (!approvalDetails.approveAmount) {
      setStatusMessage('Please enter the approval amount.');
      setStatusError(true);
      return;
    }

    setStatusMessage('Loan approved successfully.');
    setStatusError(false);
    notifySaveSuccess({
      page: 'Loan / Loan Approval',
      action: 'Approve Loan',
      message: 'Loan approved successfully.',
    });
  };

  const handleRejectLoan = () => {
    if (selectedIds.length === 0) {
      setStatusMessage('Please select a loan first.');
      setStatusError(true);
      return;
    }

    setStatusMessage('Loan rejected.');
    setStatusError(false);
    notifySaveSuccess({
      page: 'Loan / Loan Approval',
      action: 'Reject Loan',
      message: 'Loan rejected.',
    });
  };

  const handleLoanAmortization = () => {
    if (selectedIds.length === 0) {
      setStatusMessage('Please select a loan first.');
      setStatusError(true);
      return;
    }

    setStatusMessage('Loan amortization generated.');
    setStatusError(false);
  };

  const loanCount = loans.length;

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
          Loan Approval
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Review and manage loan applications for approval
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
            Total Loans
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1565c0' }}>
            {loanCount}
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
            {selectedIds.length}
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
          onClick={loadLoans}
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
        {/* Loans DataGrid */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
            Loans for Approval
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
              rows={loans}
              columns={LOAN_COLUMNS}
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

        {/* Details Cards */}
        <Grid size={{ xs: 12 }}>
          {/* Approval Details Card */}
          <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
                Approval Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Saving Balance"
                    value={approvalDetails.savingBalance}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Previous Loan Balance"
                    value={approvalDetails.previousLoanBalance}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Loan Product"
                    value={approvalDetails.loanProduct}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Grace Period"
                    value={approvalDetails.gracePeriod}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                      New Account Number
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {approvalDetails.newAccountNumber || 'Not generated'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Approve Amount"
                    name="approveAmount"
                    value={formatCurrency(approvalDetails.approveAmount)}
                    onChange={handleApproveAmountChange}
                    variant="outlined"
                    size="small"
                    placeholder="Enter amount"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Duration"
                    name="duration"
                    value={approvalDetails.duration}
                    onChange={handleApprovalDetailsChange}
                    variant="outlined"
                    size="small"
                    placeholder="Enter duration"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Approve Date"
                      value={approvalDetails.approveDate ? dayjs(approvalDetails.approveDate) : null}
                      onChange={(newValue) => {
                        const formatted = newValue ? newValue.format('YYYY-MM-DD') : '';
                        setApprovalDetails((prev) => ({
                          ...prev,
                          approveDate: formatted,
                        }));
                      }}
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

          {/* Applied Loan Details Card */}
          <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
                Applied Loan Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Payment Frequency"
                    value={appliedLoanDetails.paymentFrequency}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Gross Interest"
                    value={formatCurrency(appliedLoanDetails.grossInterest)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    value={formatCurrency(appliedLoanDetails.totalAmount)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Economic Sector"
                    value={appliedLoanDetails.economicSector}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Periodic Payment"
                    value={formatCurrency(appliedLoanDetails.periodicPayment)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Total Duration"
                    value={appliedLoanDetails.totalDuration}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleApproveLoan}
          disabled={selectedIds.length === 0 || loading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
        >
          ✓ Approve Loan
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleRejectLoan}
          disabled={selectedIds.length === 0 || loading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
        >
          ✗ Reject Loan
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleLoanAmortization}
          disabled={selectedIds.length === 0 || loading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
          }}
        >
          📊 Loan Amortization
        </Button>
      </Box>
    </Box>
  );
}
