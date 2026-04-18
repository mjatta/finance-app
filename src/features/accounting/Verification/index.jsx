import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import { useUnverifiedJournals } from '../../../hooks/useUnverifiedJournals';
import { useConfirmVouchers } from '../../../hooks/useConfirmVouchers';
import { useAuthStore } from '../../../store/authStore';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

const VERIFICATION_COLUMNS = [
  { field: 'cuserid', headerName: 'User ID', flex: 0.75, minWidth: 100, sortable: true, align: 'center', headerAlign: 'center' },
  { field: 'cacctnumb', headerName: 'Posting Account', flex: 0.9, minWidth: 120, sortable: true, align: 'center', headerAlign: 'center' },
  {
    field: 'dpostdate',
    headerName: 'Posting Date',
    flex: 0.9,
    minWidth: 120,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return '';
      return dayjs(params.value).format('DD MMM YYYY');
    },
  },
  {
    field: 'dtrandate',
    headerName: 'Transaction Date',
    flex: 0.9,
    minWidth: 120,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      if (!params.value) return '';
      return dayjs(params.value).format('DD MMM YYYY HH:mm');
    },
  },
  {
    field: 'ndebit',
    headerName: 'Debit',
    flex: 0.85,
    minWidth: 110,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const value = parseFloat(params.value || 0);
      const amount = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `D ${amount}`;
    },
  },
  {
    field: 'ncredit',
    headerName: 'Credit',
    flex: 0.85,
    minWidth: 110,
    sortable: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const amount = parseFloat(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `D ${amount}`;
    },
  },
  { field: 'ctrandesc', headerName: 'Transaction Comment', flex: 1.1, minWidth: 140, sortable: true, align: 'center', headerAlign: 'center' },
  { field: 'cvoucherno', headerName: 'Voucher Number', flex: 0.8, minWidth: 110, sortable: true, align: 'center', headerAlign: 'center' },
  { field: 'Cchqno', headerName: 'Cheque No / Reference', flex: 1, minWidth: 140, sortable: true, align: 'center', headerAlign: 'center' },
];

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Transactions' },
  { value: 'Deposit', label: 'Deposits' },
  { value: 'Withdrawal', label: 'Withdrawals' },
  { value: 'Loan Repayment', label: 'Loan Repayments' },
  { value: 'Batch Process', label: 'Batch Process' },
];

export default function Verification() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedJVNumbers, setSelectedJVNumbers] = useState([]);
  const [gridKey, setGridKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState('all');
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [sortModel, setSortModel] = useState([]);

  const authUser = useAuthStore((state) => state.user);
  const { journals, loading, error, fetchUnverifiedJournals } =
    useUnverifiedJournals();
  const { confirmVouchers } = useConfirmVouchers();

  const [verificationDetails, setVerificationDetails] = useState({
    verificationCode: '',
    referencNumber: '',
    verificationNotes: '',
  });

  // Fetch journals on component mount
  useEffect(() => {
    fetchUnverifiedJournals();
  }, [fetchUnverifiedJournals]);

  // Display hook error if there is one
  useEffect(() => {
    if (error && !statusMessage) {
      setStatusMessage(error);
      setStatusError(true);
    }
  }, [error, statusMessage]);

  // Filter journals based on transaction type
  useEffect(() => {
    let filtered = journals;

    if (selectedTransactionType !== 'all') {
      filtered = journals.filter((j) => j.ctrandesc === selectedTransactionType);
    }

    setFilteredJournals(filtered);
  }, [journals, selectedTransactionType]);

  /**
   * Handle saving verification for selected rows
   */
  const handleSaveVerification = useCallback(async () => {
    if (selectedIds.length === 0) {
      notifySaveError('Please select at least one journal to verify');
      return;
    }

    setIsSaving(true);

    try {
      // Always compute unique voucher numbers from selectedIds and filteredJournals
      const uniqueVouchers = Array.from(
        new Set(
          filteredJournals
            .filter((j) => selectedIds.map(String).includes(String(j.id)))
            .map((j) => String(j.cvoucherno))
        )
      );
      console.log('Saving verification:', { selectedIds, uniqueVouchers });
      const payload = {
        companyId: authUser?.CompId || 30,
        branchId: parseInt(authUser?.BranchId) || 16,
        userId: authUser?.username || 'SYSTEM',
        workStation: 'SERVER01',
        windowsUser: authUser?.name || authUser?.username || 'Unknown',
        vouchers: uniqueVouchers,
      };
      console.log('Payload to be sent:', payload);
      await confirmVouchers(payload);

      notifySaveSuccess(`Successfully verified ${selectedIds.length} journal(s)`);
      setStatusMessage(`Successfully verified ${selectedIds.length} journal(s)`);
      setStatusError(false);
      setVerificationDialogOpen(false);
      setSelectedIds([]);
      setSelectedJVNumbers([]);
      setGridKey((k) => k + 1);
      setVerificationDetails({
        verificationCode: '',
        referencNumber: '',
        verificationNotes: '',
      });

      // Refresh the data
      fetchUnverifiedJournals();
    } catch (err) {
      const errorMsg = err.message || 'Failed to save verification';
      notifySaveError(errorMsg);
      setStatusMessage(errorMsg);
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  }, [selectedIds, selectedJVNumbers, authUser, confirmVouchers, fetchUnverifiedJournals]);

  /**
   * Handle clearing selection and form
   */
  const handleClear = useCallback(() => {
    setSelectedIds([]);
    setSelectedJVNumbers([]);
    setGridKey((k) => k + 1);
    setVerificationDetails({
      verificationCode: '',
      referencNumber: '',
      verificationNotes: '',
    });
    setStatusMessage('');
    setStatusError(false);
  }, []);

  // Calculate filtered totals
  const filteredTotalDebit = filteredJournals.reduce((sum, j) => sum + (parseFloat(j.ndebit) || 0), 0);
  const filteredTotalCredit = filteredJournals.reduce((sum, j) => sum + (parseFloat(j.ncredit) || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isSaving}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Saving verification...</Typography>
        </Box>
      </Backdrop>

      {/* Header */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Journal Verification
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Verify and approve pending journal transactions
          </Typography>
        </CardContent>
      </Card>

      {/* Status Message */}
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

      {/* Filter and Sorting Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Filter by Transaction Type
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {TRANSACTION_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={selectedTransactionType === type.value ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedTransactionType(type.value)}
                sx={{
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 2,
                }}
              >
                {type.label}
              </Button>
            ))}
          </Box>
          {filteredJournals.length > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
              Showing {filteredJournals.length} of {journals.length} transactions
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, p: 2, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
            Unverified Journal Transactions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Total Debit: D ${filteredTotalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: 700, fontSize: '0.95rem', height: 36, px: 1 }}
            />
            <Chip
              label={`Total Credit: D ${filteredTotalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.95rem', height: 36, px: 1 }}
            />
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            width: '100%',
            borderRadius: 1.5,
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <DataGrid
            key={gridKey}
            rows={filteredJournals}
            columns={VERIFICATION_COLUMNS}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            checkboxSelection
            selectionModel={selectedIds}
            onRowSelectionModelChange={(selection) => {
              let arr = Array.isArray(selection) ? selection : [selection];
              arr = arr.map(String);
              const prevIds = selectedIds.map(String);
              let changedId = null;
              let action = null;
              if (arr.length > prevIds.length) {
                changedId = arr.find((id) => !prevIds.includes(id));
                action = 'select';
              } else if (arr.length < prevIds.length) {
                changedId = prevIds.find((id) => !arr.includes(id));
                action = 'deselect';
              }
              if (changedId) {
                const changedRow = filteredJournals.find((j) => String(j.id) === String(changedId));
                if (changedRow && changedRow.cvoucherno) {
                  const sameVoucherIds = filteredJournals
                    .filter((j) => String(j.cvoucherno) === String(changedRow.cvoucherno))
                    .map((j) => String(j.id));
                  if (action === 'select') {
                    arr = Array.from(new Set([...arr, ...sameVoucherIds]));
                  } else if (action === 'deselect') {
                    arr = arr.filter((id) => !sameVoucherIds.includes(id));
                  }
                  // Force DataGrid to update selection model immediately
                  setSelectedIds(arr);
                  const selectedVouchers = Array.from(
                    new Set(
                      filteredJournals
                        .filter((j) => arr.includes(String(j.id)))
                        .map((j) => String(j.cvoucherno))
                    )
                  );
                  setSelectedJVNumbers(selectedVouchers);
                  return;
                }
              }
              // Fallback: update as normal
              setSelectedIds(arr);
              const selectedVouchers = Array.from(
                new Set(
                  filteredJournals
                    .filter((j) => arr.includes(String(j.id)))
                    .map((j) => String(j.cvoucherno))
                )
              );
              setSelectedJVNumbers(selectedVouchers);
            }}
            onRowClick={(params) => {
              const rowId = String(params.id);
              const row = filteredJournals.find((j) => String(j.id) === rowId);
              if (!row) return;
              const sameVoucherIds = filteredJournals
                .filter((j) => String(j.cvoucherno) === String(row.cvoucherno))
                .map((j) => String(j.id));
              let arr = Array.isArray(selectedIds) ? selectedIds.map(String) : [String(selectedIds)];
              const allSelected = sameVoucherIds.every((id) => arr.includes(id));
              if (allSelected) {
                // Deselect all
                arr = arr.filter((id) => !sameVoucherIds.includes(id));
              } else {
                // Select all
                arr = Array.from(new Set([...arr, ...sameVoucherIds]));
              }
              setSelectedIds(arr);
              const selectedVouchers = Array.from(
                new Set(
                  filteredJournals
                    .filter((j) => arr.includes(String(j.id)))
                    .map((j) => String(j.cvoucherno))
                )
              );
              setSelectedJVNumbers(selectedVouchers);
            }}
            getRowClassName={(params) => {
              const arr = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
              if (arr.includes(params.id)) return 'selected-row';
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
                '&:nth-of-type(odd)': {
                  backgroundColor: '#fafafa',
                },
                '&:nth-of-type(even)': {
                  backgroundColor: '#ffffff',
                },
                '&:hover': {
                  backgroundColor: '#f0f0f0 !important',
                },
                '&.selected-row, &.Mui-selected': {
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
              },
            }}
          />
        </Box>
        
        {!loading && filteredJournals.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary" variant="body2">
              ✅ No journals available for verification.
            </Typography>
          </Box>
        )}
        </Box>
      </Card>


      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ClearIcon />}
          onClick={handleClear}
          disabled={selectedIds.length === 0 && !verificationDetails.verificationCode}
          sx={{
            fontWeight: 600,
            paddingX: 3,
          }}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={() => setVerificationDialogOpen(true)}
          disabled={selectedIds.length === 0}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
        >
          Verify Selected ({selectedIds.length})
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)}>
        <DialogTitle>Confirm Verification</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              You are about to verify <strong>{selectedIds.length}</strong> journal transaction(s).
            </Typography>
            {selectedJVNumbers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  <strong>Unique Voucher Number(s) to be sent:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {selectedJVNumbers.map((jv, idx) => (
                    <Chip key={idx} label={jv} variant="outlined" color="primary" />
                  ))}
                </Box>
              </Box>
            )}
            {verificationDetails.referencNumber && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Reference Number:</strong> {verificationDetails.referencNumber}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
              This action cannot be undone. Please ensure all details are correct.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVerification} disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Confirm Verification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
