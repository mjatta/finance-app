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

    // Add unique ID to each row based on index
    const withIds = filtered.map((journal, index) => ({
      ...journal,
      uid: index + 1,
    }));

    setFilteredJournals(withIds);
  }, [journals, selectedTransactionType]);

  /**
   * Select all rows
   */
  const handleSelectAll = useCallback(() => {
    const allUids = filteredJournals.map(j => j.uid);
    setSelectedIds(allUids);
    setSelectedJVNumbers(allUids);
  }, [filteredJournals]);

  /**
   * Deselect all rows
   */
  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedJVNumbers([]);
  }, []);

  /**
   * Handle saving verification for selected rows
   */
  const handleSaveVerification = useCallback(async () => {
    
    if (!selectedIds || selectedIds.length === 0) {
      setStatusMessage('Please select at least one row.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);

    try {
      // Extract voucher numbers using uid to look up the actual row data
      const vouchers = Array.from(new Set(
        selectedIds.map(uid => {
          const row = filteredJournals.find(j => j.uid === parseInt(uid));
          return row ? String(row.cvoucherno) : null;
        })
        .filter(voucher => voucher)
      ));
      

      
      if (!vouchers || vouchers.length === 0) {
        setStatusMessage('No valid vouchers found in selected rows');
        setStatusError(true);
        setIsSaving(false);
        return;
      }
      
      const payload = {
        companyId: authUser?.CompId || 30,
        branchId: parseInt(authUser?.BranchId) || 16,
        userId: authUser?.username || 'SYSTEM',
        workStation: 'SERVER01',
        windowsUser: authUser?.name || authUser?.username || 'Unknown',
        vouchers,
      };

      await confirmVouchers(payload);

      notifySaveSuccess(`Successfully verified ${selectedIds.length} journal(s)`);
      setStatusMessage(`Successfully verified ${selectedIds.length} journal(s)`);
      setStatusError(false);
      setSelectedIds([]);
      setSelectedJVNumbers([]);
      setGridKey((k) => k + 1);

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
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
        <Alert
          severity={statusError ? 'error' : 'success'}
          sx={{
            mb: 3,
            borderRadius: 1.5,
            fontWeight: 500,
          }}
        >
          {statusMessage}
        </Alert>
      )}

      {/* Filter and Sorting Section */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
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
                  fontWeight: 600,
                }}
              >
                {type.label}
              </Button>
            ))}
          </Box>
          {filteredJournals.length > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', fontWeight: 500 }}>
              Showing {filteredJournals.length} of {journals.length} transactions
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
              Unverified Journal Transactions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Total Debit: D ${filteredTotalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
            />
            <Chip
              label={`Total Credit: D ${filteredTotalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
            />
          </Box>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              width: '100%',
              borderRadius: 0,
              border: 'none',
              overflow: 'hidden',
              mt: 0,
              height: 400,
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
              checkboxSelection={false}
              getRowId={(row) => row.uid}
              onRowClick={(params) => {
                const clickedRow = params.row;
                const rowVoucher = String(clickedRow.cvoucherno);
                
                // Find all rows with the same voucher number
                const sameVoucherRows = filteredJournals
                  .filter((j) => String(j.cvoucherno) === rowVoucher)
                  .map((j) => j.uid);
                
                let arr = Array.isArray(selectedIds) ? [...selectedIds] : [];
                const allSelected = sameVoucherRows.every((uid) => arr.includes(uid));
                
                if (allSelected) {
                  // Deselect all with same voucher
                  arr = arr.filter((uid) => !sameVoucherRows.includes(uid));
                } else {
                  // Select all with same voucher
                  arr = Array.from(new Set([...arr, ...sameVoucherRows]));
                }
                
                setSelectedIds(arr);
                setSelectedJVNumbers(arr);
              }}
              getRowClassName={(params) => {
                const arr = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
                if (arr.includes(params.id)) return 'selected-row';
                return '';
              }}
              sx={{
                border: 'none',
                borderRadius: 0,
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-row': {
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#f5f5f5 !important',
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
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">
                ✅ No journals available for verification.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>


      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={handleSelectAll}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
          }}
        >
          ✓ Select All Rows
        </Button>
        <Button
          variant="outlined"
          onClick={handleClearSelection}
          disabled={selectedIds.length === 0}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
          }}
        >
          ✕ Clear Selection
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveVerification}
          disabled={selectedIds.length === 0}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            boxShadow: 1,
          }}
        >
          Save Verification
        </Button>
      </Box>

      {/* Confirmation Dialog removed: verification is now one-click with confirmation prompt */}
    </Box>
  );
}
