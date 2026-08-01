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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { CurrencyAdornment } from '../../../components/FieldAdornments';
import { useLoanApprovalLoad } from './Hooks/useLoanApprovalLoad';
import { useLoanDetails } from './Hooks/useLoanDetails';
import { useLoanApprovalSubmit } from './Hooks/useLoanApprovalSubmit';
import { useCheckTopup } from './Hooks/useCheckTopup';
import { useRejectReasons } from './Hooks/useRejectReasons';
import { useSaveRejectedLoan } from './Hooks/useSaveRejectedLoan';
import { useLoanOfficers } from '../../../hooks/useLoanOfficers';
import { useUsersStore } from '../../../store/useUsersStore';
import { useAuthStore } from '../../../store/authStore';

const LOAN_COLUMNS = [
  { field: 'customerCode', headerName: 'Customer Code', flex: 0.8, minWidth: 110, sortable: true },
  { field: 'customerName', headerName: 'Customer Name', flex: 1.2, minWidth: 150, sortable: true },
  {
    field: 'loanAmount',
    headerName: 'Principal Amount',
    flex: 0.9,
    minWidth: 130,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return 'D 0';
      // Remove commas from string before parsing
      const cleanValue = String(params.value).replace(/,/g, '');
      const amount = parseFloat(cleanValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `D ${amount}`;
    },
  },
  { field: 'duration', headerName: 'Duration (Months)', flex: 0.8, minWidth: 120, sortable: true, align: 'center', headerAlign: 'center' },
  {
    field: 'repaymentAmount',
    headerName: 'Repayment Amount',
    flex: 1,
    minWidth: 130,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return 'D 0';
      // Remove commas from string before parsing
      const cleanValue = String(params.value).replace(/,/g, '');
      const amount = parseFloat(cleanValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `D ${amount}`;
    },
  },
  {
    field: 'totalInterest',
    headerName: 'Total Interest',
    flex: 0.8,
    minWidth: 110,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return '0%';
      return `${params.value}%`;
    },
  },
  {
    field: 'applicationDate',
    headerName: 'Application Date',
    flex: 0.9,
    minWidth: 130,
    sortable: true,
    renderCell: (params) => {
      if (!params.value) return '';
      return dayjs(params.value).format('DD MMM YYYY');
    },
  },
  {
    field: 'loanStartDate',
    headerName: 'Loan Start Date',
    flex: 0.9,
    minWidth: 130,
    sortable: true,
    renderCell: (params) => {
      if (!params.value) return '';
      return dayjs(params.value).format('DD MMM YYYY');
    },
  },
];

export default function LoanApproval() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    loanOfficer: '',
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
  const { fetchUsersList } = useUsersStore();
  const { fetchLoanDetails } = useLoanDetails();
  const { submitLoanApproval } = useLoanApprovalSubmit();
  const { fetchCheckTopup } = useCheckTopup();
  const { reasons: rejectReasons, fetchRejectReasons } = useRejectReasons();
  const { saveRejectedLoan } = useSaveRejectedLoan();
  const { officers: loanOfficers, fetchLoanOfficers, isLoading: loadingOfficers, error: officersError } = useLoanOfficers();
  const authUser = useAuthStore((state) => state.user);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDetails, setRejectDetails] = useState({
    loanId: '',
    rejectReasonId: '',
  });
  const [selectedLoanForReject, setSelectedLoanForReject] = useState(null);

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
        id: item.loan_id || index,
        customerCode: item.ccustcode || '',
        customerName: item.membername || '',
        loanAmount: item.principal_amt || '0',
        applicationDate: item.loan_appl_date || '',
        // Store additional data for populating form and details
        duration: item.lduration_num || '',
        repaymentAmount: item.repayment_amt || '0',
        loanStartDate: item.loanstart_date || '',
        totalInterest: item.totinterest || '0',
        loanInterest: item.loan_interest || '0',
        loanAccount: item.loanacct || '',
        loanStatus: item.loan_status || '0',
        productId: item.prd_id || '',
        // Legacy fields for compatibility
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

      // After loans load successfully, fetch users list
      await fetchUsersList();
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
  }, [fetchLoansForApproval, fetchUsersList]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Fetch loan officers on component mount
  useEffect(() => {
    fetchLoanOfficers();
  }, [fetchLoanOfficers]);

  // Log officers when loaded
  useEffect(() => {
  }, [loanOfficers]);

  // Fetch rejection reasons when reject dialog opens
  useEffect(() => {
    if (rejectDialogOpen && rejectReasons.length === 0) {
      fetchRejectReasons();
    }
  }, [rejectDialogOpen, rejectReasons.length, fetchRejectReasons]);

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
        loanOfficer: '',
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
        // Fetch loan details from the new endpoint
        (async () => {
          const loanDetails = await fetchLoanDetails(
            selectedLoan.customerCode,
            selectedLoan.id
          );

          if (loanDetails) {
                // After fetching detailed loan info, check top-up eligibility
                try {
                  const topupCheck = await fetchCheckTopup(selectedLoan.id)
                  setApprovalDetails((prev) => ({ ...prev, topupCheck }))
                } catch (err) {
                  console.warn('Topup check failed:', err)
                }
            // Map API response to form fields
            setApprovalDetails({
              savingBalance: loanDetails.savebal || '',
              previousLoanBalance: '',
              loanProduct: loanDetails.LoanType || selectedLoan.loanProduct || selectedLoan.productId || '',
              gracePeriod: loanDetails.graceperiod || '',
              newAccountNumber: selectedLoan.loanAccount || '',
              approveAmount: loanDetails.PrincipalAmt || selectedLoan.loanAmount,
              duration: loanDetails.lduration_num || selectedLoan.duration || '',
              approveDate: selectedLoan.loanStartDate || '',
            });
            setAppliedLoanDetails({
              paymentFrequency: '',
              grossInterest: loanDetails.total_interest || loanDetails.graceperiod || selectedLoan.totalInterest || '',
              totalAmount: loanDetails.PrincipalAmt || selectedLoan.loanAmount || '',
              economicSector: loanDetails.econsec || '',
              periodicPayment: loanDetails.repayment_amt || selectedLoan.repaymentAmount || '',
              totalDuration: loanDetails.nofpay || selectedLoan.duration || '',
            });
          } else {
            // Fallback to existing data if fetch fails
            setApprovalDetails({
              savingBalance: selectedLoan.savingBalance,
              previousLoanBalance: selectedLoan.previousLoanBalance,
              loanProduct: selectedLoan.loanProduct || selectedLoan.productId || '',
              gracePeriod: selectedLoan.gracePeriod,
              newAccountNumber: selectedLoan.loanAccount || '',
              approveAmount: selectedLoan.loanAmount,
              duration: selectedLoan.duration || '',
              approveDate: selectedLoan.loanStartDate || '',
            });
            setAppliedLoanDetails({
              paymentFrequency: selectedLoan.paymentFrequency,
              grossInterest: selectedLoan.totalInterest || selectedLoan.loanInterest || '',
              totalAmount: selectedLoan.totalAmount || selectedLoan.loanAmount || '',
              economicSector: selectedLoan.economicSector,
              periodicPayment: selectedLoan.periodicPayment || selectedLoan.repaymentAmount || '',
              totalDuration: selectedLoan.totalDuration || selectedLoan.duration || '',
            });
          }
        })();
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

  const handleOpenRejectDialog = () => {
    if (selectedIds.length === 0) {
      setStatusMessage('Please select a loan first.');
      setStatusError(true);
      return;
    }

    const selectedLoan = loans.find((l) => l.id === selectedIds[0]);
    if (!selectedLoan) {
      setStatusMessage('Selected loan not found.');
      setStatusError(true);
      return;
    }

    setSelectedLoanForReject(selectedLoan);
    setRejectDetails({ loanId: selectedLoan.id, rejectReasonId: '' });
    setRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedLoanForReject(null);
    setRejectDetails({ loanId: '', rejectReasonId: '' });
  };

  const handleRejectDetailsChange = (e) => {
    const { name, value } = e.target;
    setRejectDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleRejectLoan = async () => {
    if (!rejectDetails.rejectReasonId) {
      setStatusMessage('Please select a rejection reason.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const payload = {
        LoanId: parseInt(rejectDetails.loanId, 10),
        RejectReasonId: parseInt(rejectDetails.rejectReasonId, 10),
      };

      const result = await saveRejectedLoan(payload);

      if (result) {
        setStatusMessage('Loan rejected successfully.');
        setStatusError(false);
        notifySaveSuccess({
          page: 'Loan / Loan Approval',
          action: 'Reject Loan',
          message: 'Loan rejected successfully.',
        });

        handleCloseRejectDialog();
        await loadLoans(); // Reload the loans list
      } else {
        setStatusMessage('Failed to reject loan.');
        setStatusError(true);
        notifySaveError({
          page: 'Loan / Loan Approval',
          action: 'Reject Loan',
          message: 'Failed to reject loan.',
        });
      }
    } catch (err) {
      console.error('Error rejecting loan:', err);
      setStatusMessage('Error rejecting loan: ' + (err.message || 'Unknown error'));
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Approval',
        action: 'Reject Loan',
        message: err.message || 'Error rejecting loan.',
        error: err,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveLoan = async () => {
    if (!approvalDetails.approveAmount) {
      setStatusMessage('Please enter the approval amount.');
      setStatusError(true);
      return;
    }

    if (selectedIds.length === 0) {
      setStatusMessage('Please select a loan first.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const selectedLoan = loans.find((l) => l.id === selectedIds[0]);
      if (!selectedLoan) {
        setStatusMessage('Selected loan not found.');
        setStatusError(true);
        return;
      }

      // Construct payload for approval - send numeric values for numeric fields
      // Helper function to safely truncate strings to database column limits
      const truncate = (value, maxLength) => {
        if (!value) return '';
        const str = String(value).trim();
        if (str.length > maxLength) {
          console.warn(`Truncating "${str}" from ${str.length} to ${maxLength} chars`);
          return str.substring(0, maxLength);
        }
        return str;
      };

      // Parse numeric values safely
      const approveAmountNum = parseFloat(String(approvalDetails.approveAmount).replace(/,/g, '')) || 0;
      const durationNum = parseInt(approvalDetails.duration, 10) || 0;
      const interestRateNum = parseFloat(String(appliedLoanDetails.grossInterest).replace(/,/g, '')) || 0;
      const compidNum = parseInt(authUser?.CompId, 10) || 30;
      const loanTypeNum = parseInt(selectedLoan.productId || selectedLoan.prd_id, 10) || 0;
      const loanIdNum = parseInt(selectedLoan.id || selectedLoan.loan_id || 0, 10);

      // Check top-up/reschedule status before approval
      let isTopUpFlag = false
      let isRescheduledFlag = false
      try {
        const check = await fetchCheckTopup(loanIdNum)
        // Support multiple casing/field names
        isTopUpFlag = Boolean(check?.isTopUp ?? check?.isTopup ?? check?.is_topup ?? check?.IsTopUp ?? check?.IsTopup)
        isRescheduledFlag = Boolean(check?.isRescheduled ?? check?.isReschedule ?? check?.is_rescheduled ?? check?.IsRescheduled ?? check?.IsReschedule)
      } catch (err) {
        console.warn('Failed to fetch check-topup before approval:', err)
      }

      const payload = {
        loanid: loanIdNum,
        loanAmount: approveAmountNum,
        duration: durationNum,
        loanAccount: truncate(selectedLoan.loanacct || selectedLoan.loanAccount || '', 50),
        loanOfficer: truncate(approvalDetails.loanOfficer || authUser?.username || 'SYSTEM', 20),
        userid: truncate(authUser?.username || 'SYSTEM', 20),  // Use username instead of id (usually shorter)
        customerCode: truncate(selectedLoan.customerCode || selectedLoan.ccustcode || '', 20),
        memberType: truncate('C', 5),
        memberName: truncate(selectedLoan.customerName || selectedLoan.membername || '', 50),
        compid: compidNum,
        loanType: loanTypeNum,
        interestRate: interestRateNum,
        glTopUp: isTopUpFlag,
        glResched: isRescheduledFlag,
      };

      // Submit the loan approval
      const result = await submitLoanApproval(payload);

      if (result.success) {
        setStatusMessage(result.message || 'Loan approved successfully.');
        setStatusError(false);
        notifySaveSuccess({
          page: 'Loan / Loan Approval',
          action: 'Approve Loan',
          message: result.message || 'Loan approved successfully.',
        });

        // Reset form after successful approval
        setSelectedIds([]);
        setApprovalDetails({
          savingBalance: '',
          previousLoanBalance: '',
          loanProduct: '',
          gracePeriod: '',
          newAccountNumber: '',
          approveAmount: '',
          duration: '',
          approveDate: '',
          loanOfficer: '',
        });
        setAppliedLoanDetails({
          paymentFrequency: '',
          grossInterest: '',
          totalAmount: '',
          economicSector: '',
          periodicPayment: '',
          totalDuration: '',
        });

        // Refresh the Loans for Approval data grid
        await loadLoans();
      } else {
        setStatusMessage(result.message || 'Failed to approve loan.');
        setStatusError(true);
        notifySaveError({
          page: 'Loan / Loan Approval',
          action: 'Approve Loan',
          message: result.message || 'Failed to approve loan.',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error approving loan:', error);
      const errorMsg = error.message || 'Failed to approve loan.';
      setStatusMessage(errorMsg);
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Approval',
        action: 'Approve Loan',
        message: errorMsg,
        error,
      });
    } finally {
      setIsSaving(false);
    }
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
    <Box p={3} sx={{ position: 'relative' }}>
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
            Processing approval...
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
          <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Approval Details
              </Typography>

              <Grid container spacing={4}>
                {/* Left Column - Editable Fields */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        startAdornment: <CurrencyAdornment />
                      }}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                    />
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
                    <Box>
                      <TextField
                        select
                        fullWidth
                        label="Approved By"
                        name="loanOfficer"
                        value={approvalDetails.loanOfficer}
                        onChange={handleApprovalDetailsChange}
                        variant="outlined"
                        size="small"
                        error={!!officersError}
                        helperText={officersError ? `Error loading officers: ${officersError}` : loadingOfficers ? 'Loading officers...' : ''}
                      >
                        <MenuItem value="">
                          <em>{loadingOfficers ? 'Loading...' : 'Select Loan Officer'}</em>
                        </MenuItem>
                        {loanOfficers.map((officer) => (
                          <MenuItem key={officer.value} value={officer.label}>
                            {officer.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Box>
                </Grid>

                {/* Right Column - Display-only Fields */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Saving Balance:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {approvalDetails.savingBalance || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Previous Loan Balance:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {approvalDetails.previousLoanBalance || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Loan Product:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {approvalDetails.loanProduct || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Grace Period:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {approvalDetails.gracePeriod || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Applied Loan Details Card */}
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Applied Loan Details
              </Typography>
              <Grid container spacing={4}>
                {/* Left Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Payment Frequency:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {appliedLoanDetails.paymentFrequency || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Gross Interest:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {appliedLoanDetails.grossInterest ? `${CURRENCY_SYMBOL} ${formatCurrency(appliedLoanDetails.grossInterest)}` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Total Amount:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {appliedLoanDetails.totalAmount ? `${CURRENCY_SYMBOL} ${formatCurrency(appliedLoanDetails.totalAmount)}` : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Right Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Economic Sector:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {appliedLoanDetails.economicSector || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Periodic Payment:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {appliedLoanDetails.periodicPayment ? `${CURRENCY_SYMBOL} ${formatCurrency(appliedLoanDetails.periodicPayment)}` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Total Duration:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {appliedLoanDetails.totalDuration || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
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
          disabled={selectedIds.length === 0 || loading || isSaving}
          startIcon={isSaving ? <CircularProgress size={18} /> : undefined}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
        >
          {isSaving ? 'Processing...' : '✓ Approve Loan'}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleOpenRejectDialog}
          disabled={selectedIds.length === 0 || loading || isSaving}
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

      {/* Reject Loan Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, background: '#f5f5f5' }}>Reject Loan</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Customer Code - Read Only */}
            <TextField
              label="Customer Code"
              value={selectedLoanForReject?.customerCode || selectedLoanForReject?.ccustcode || ''}
              InputProps={{ readOnly: true }}
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
            />

            {/* Loan Amount - Read Only */}
            <TextField
              label="Loan Amount"
              value={formatCurrency(selectedLoanForReject?.loanAmount || 0)}
              InputProps={{ readOnly: true, startAdornment: <CurrencyAdornment /> }}
              variant="outlined"
              fullWidth
            />

            {/* Loan Product - Read Only */}
            <TextField
              label="Loan Product"
              value={selectedLoanForReject?.loanProduct || 'N/A'}
              InputProps={{ readOnly: true }}
              variant="outlined"
              fullWidth
            />

            {/* Rejection Reason - Dropdown */}
            <TextField
              select
              label="Rejection Reason"
              name="rejectReasonId"
              value={rejectDetails.rejectReasonId}
              onChange={handleRejectDetailsChange}
              variant="outlined"
              fullWidth
              required
            >
              <MenuItem value="">Select a reason...</MenuItem>
              {rejectReasons.map((reason) => (
                <MenuItem key={reason.rej_id || reason.id || reason.ID} value={reason.rej_id || reason.id || reason.ID}>
                  {reason.rej_name || reason.reason || reason.Reason || reason.name || reason.Name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseRejectDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleRejectLoan}
            variant="contained"
            color="error"
            disabled={!rejectDetails.rejectReasonId}
          >
            Reject Loan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
