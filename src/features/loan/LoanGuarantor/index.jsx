import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  InputAdornment,
  Checkbox,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { useAuthStore } from '../../../store/authStore';
import { useGuarantorLoad } from './Hooks/useGuarantorLoad';
import { useGuarantorValidate } from './Hooks/useGuarantorValidate';
import { useSaveGuarantor } from './Hooks/useSaveGuarantor';
import { useGuaranteeHistory } from './Hooks/useGuaranteeHistory';

const GUARANTOR_COLUMNS = [
  { field: 'guarantorId', headerName: 'Guarantor ID', flex: 0.8, minWidth: 100, sortable: true },
  { field: 'guarantorName', headerName: 'Guarantor Name', flex: 1.5, minWidth: 180, sortable: true },
  { 
    field: 'loanAmount', 
    headerName: 'Loan Amount', 
    flex: 1, 
    minWidth: 140, 
    sortable: true,
    align: 'right',
    headerAlign: 'right',
  },
  { 
    field: 'lduration_num', 
    headerName: 'Duration (Months)', 
    flex: 0.9, 
    minWidth: 120, 
    sortable: true,
    align: 'center',
    headerAlign: 'center',
  },
  { 
    field: 'loanStart', 
    headerName: 'Loan Start Date', 
    flex: 1, 
    minWidth: 140, 
    sortable: true,
    align: 'center',
    headerAlign: 'center',
  },
  { 
    field: 'loan_interest', 
    headerName: 'Interest Rate', 
    flex: 0.9, 
    minWidth: 120, 
    sortable: true,
    align: 'center',
    headerAlign: 'center',
  },
  { 
    field: 'repaymentAmount', 
    headerName: 'Repayment Amount', 
    flex: 1, 
    minWidth: 140, 
    sortable: true,
    align: 'right',
    headerAlign: 'right',
  },
];

const GUARANTEE_HISTORY_COLUMNS = [
  { field: 'grantorcode', headerName: 'Grantor Code', flex: 0.8, minWidth: 100, sortable: true },
  { field: 'grantor', headerName: 'Grantor', flex: 1.5, minWidth: 180, sortable: true },
  { 
    field: 'loanamt', 
    headerName: 'Loan Amount', 
    flex: 1, 
    minWidth: 140, 
    sortable: true,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params) => formatCurrency(params.value || 0),
  },
  { 
    field: 'guaramt', 
    headerName: 'Amount Guaranteed', 
    flex: 1, 
    minWidth: 140, 
    sortable: true,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params) => formatCurrency(params.value || 0),
  },
];

export default function LoanGuarantor() {
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [sortModel, setSortModel] = useState([]);
  
  const [guaranteeHistoryData, setGuaranteeHistoryData] = useState(null);
  const [guaranteeHistoryRows, setGuaranteeHistoryRows] = useState([]);
  const [totalGuaranteed, setTotalGuaranteed] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  
  const [guarantorDetailsOpen, setGuarantorDetailsOpen] = useState(false);
  const [guarantorType, setGuarantorType] = useState(''); // '' (empty), 'memberGuarantors' or 'collateral'
  
  const [guarantorDetails, setGuarantorDetails] = useState({
    guarantorId: '',
    savingBalance: '',
    amountToGuarantee: '',
    guarantorName: '',
    collateralName: '',
    collateralValue: '',
    collateralDesc: '',
    loanBalance: '',
    guaranteeDate: '',
    guarantorRequired: false,
  });

  const { fetchGuarantors } = useGuarantorLoad();
  const { validateGuarantor, loading: validateLoading, error: validateError } = useGuarantorValidate();
  const { saveGuarantor, loading: saveLoading, error: saveError } = useSaveGuarantor();
  const { fetchGuaranteeHistory, loading: historyLoading, error: historyError } = useGuaranteeHistory();

  const loadGuarantors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGuarantors();

      if (!data || data.status !== 'success') {
        setGuarantors([]);
        setStatusMessage('No guarantors available.');
        setStatusError(false);
        return;
      }

      // Transform API response to table rows from clientList
      const clientList = data.clientList || [];
      if (clientList.length === 0) {
        setGuarantors([]);
        setStatusMessage('No client list available.');
        setStatusError(false);
        return;
      }

      const mappedGuarantors = clientList.map((item, index) => {
        const loanStartDate = item.loanstart_date 
          ? dayjs(item.loanstart_date).format('DD MMM YYYY')
          : '';

        return {
          id: `${item.loan_id}-${index}`,
          guarantorId: item.ccustcode?.toString() || '',
          guarantorName: item.membername || '',
          loanAmount: formatCurrency(item.principal_amt || 0),
          lduration_num: item.lduration_num || 0,
          loanStart: loanStartDate,
          loan_interest: `${item.loan_interest || 0}%`,
          repaymentAmount: formatCurrency(item.repayment_amt || 0),
          nofpayments: item.nofpayments || 0,
          rawPrincipalAmt: item.principal_amt || 0,
          rawRepaymentAmt: item.repayment_amt || 0,
          guaramt: item.guaramt || 0,
        };
      });

      setGuarantors(mappedGuarantors);
      setStatusMessage('');
      setStatusError(false);
    } catch (error) {
      console.error('Failed to load guarantors:', error);
      setStatusMessage('Failed to load guarantor data.');
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Guarantor',
        action: 'Load Guarantors',
        message: 'Failed to load guarantor data.',
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchGuarantors]);

  // Load guarantors on mount
  useEffect(() => {
    loadGuarantors();
  }, [loadGuarantors]);

  const loadGuaranteeHistory = useCallback(async (loanId) => {
    if (!loanId) {
      console.log('No loan ID provided');
      return;
    }
    
    try {
      const data = await fetchGuaranteeHistory(loanId);
      if (data) {
        console.log('✓ Guarantee history loaded:', data);
        setGuaranteeHistoryData(data);
        setTotalGuaranteed(data.TotalGuaranteed || 0);
        setRemainingAmount(data.RemainingAmount || 0);
        
        // Map the Data array to grid rows
        if (data.Data && Array.isArray(data.Data)) {
          const mappedRows = data.Data.map((item, index) => ({
            id: `${item.gid}-${index}`,
            grantorcode: item.grantorcode || '',
            grantor: item.grantor || '',
            loanamt: item.loanamt || 0,
            guaramt: item.guaramt || 0,
          }));
          setGuaranteeHistoryRows(mappedRows);
        } else {
          setGuaranteeHistoryRows([]);
        }
      } else {
        setGuaranteeHistoryData(null);
        setGuaranteeHistoryRows([]);
        setTotalGuaranteed(0);
        setRemainingAmount(0);
      }
    } catch (error) {
      console.error('Error loading guarantee history:', error);
      setGuaranteeHistoryRows([]);
    }
  }, [fetchGuaranteeHistory]);

  const handleRowClick = (params) => {
    const guarantorId = params.id;
    const selectedGuarantor = guarantors.find((g) => g.id === guarantorId);

    if (selectedIds.includes(guarantorId)) {
      setSelectedIds(selectedIds.filter((id) => id !== guarantorId));
      setGuarantorDetails({
        guarantorId: '',
        savingBalance: '',
        amountToGuarantee: '',
        guarantorName: '',
        collateralName: '',
        collateralValue: '',
        collateralDesc: '',
        loanBalance: '',
        guaranteeDate: '',
        guarantorRequired: false,
      });
      setSelectedLoanId(null);
      setGuaranteeHistoryRows([]);
      setTotalGuaranteed(0);
      setRemainingAmount(0);
    } else {
      setSelectedIds([guarantorId]);
      if (selectedGuarantor) {
        // Extract loanId from the id (format: loan_id-index)
        const loanId = parseInt(guarantorId.toString().split('-')[0]);
        setSelectedLoanId(loanId);
        
        // Load guarantee history for this loan
        loadGuaranteeHistory(loanId);
        
        // If member guarantors is selected, call validation endpoint with mode=4
        if (guarantorType === 'memberGuarantors') {
          performGuarantorValidation(selectedGuarantor.guarantorId, 4);
        } else if (guarantorType === 'collateral') {
          // If collateral is selected, call validation endpoint with mode=3
          performGuarantorValidation(selectedGuarantor.guarantorId, 3);
        }
        // If no type selected yet, do nothing
      }
    }
  };

  // Function to call the guarantor validation endpoint with mode parameter
  const performGuarantorValidation = async (guarantorCode, mode = 4) => {
    try {
      const data = await validateGuarantor(guarantorCode, mode);
      
      if (data && data.status !== 'error') {
        if (mode === 4) {
          // Member Guarantors mode: map fullName, balance to savingBalance, guarantorAmount to loanBalance
          setGuarantorDetails((prev) => ({
            ...prev,
            savingBalance: data.balance || '',
            guarantorName: data.fullName || '',
            loanBalance: data.guarantorAmount || '',
            guarantorRequired: true,
          }));
        } else if (mode === 3) {
          // Collateral mode: map balance to savingBalance and guarantorAmount to loanBalance
          setGuarantorDetails((prev) => ({
            ...prev,
            savingBalance: data.balance || '', // balance maps to Saving Balance
            collateralName: '', // Clear for collateral mode
            loanBalance: data.guarantorAmount || '', // guarantorAmount maps to Loan Balance
            guarantorRequired: data.canGuarantee ? true : false, // canGuarantee maps to Guarantor Required
          }));
        }
        setStatusMessage('Guarantor validated successfully.');
        setStatusError(false);
      } else {
        setStatusMessage(validateError || 'Failed to validate guarantor.');
        setStatusError(true);
      }
    } catch (error) {
      console.error('Error validating guarantor:', error);
      setStatusMessage('Error validating guarantor.');
      setStatusError(true);
    }
  };



  const handleGuarantorTypeChange = (e) => {
    const newType = e.target.value;
    setGuarantorType(newType);
    
    // If a row is already selected, revalidate with the new mode
    if (selectedIds.length > 0) {
      const selectedGuarantor = guarantors.find((g) => g.id === selectedIds[0]);
      if (selectedGuarantor) {
        if (newType === 'memberGuarantors') {
          performGuarantorValidation(selectedGuarantor.guarantorId, 4);
        } else if (newType === 'collateral') {
          performGuarantorValidation(selectedGuarantor.guarantorId, 3);
        }
      }
    }
  };

  const handleGuarantorDetailsChange = (e) => {
    const { name, value } = e.target;
    setGuarantorDetails((prev) => ({ ...prev, [name]: value }));
    
    // If guarantor ID is changed and a type is selected, trigger validation
    if (name === 'guarantorId' && value && guarantorType) {
      if (guarantorType === 'memberGuarantors') {
        performGuarantorValidation(value, 4);
      } else if (guarantorType === 'collateral') {
        performGuarantorValidation(value, 3);
      }
    }
  };

  const handleAmountToGuaranteeChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setGuarantorDetails((prev) => ({ ...prev, amountToGuarantee: cleanValue }));
  };



  const handleSaveGuarantor = async () => {
    console.log('=== handleSaveGuarantor CALLED ===');
    console.log('guarantorType:', guarantorType);
    console.log('selectedIds:', selectedIds);
    console.log('guarantorDetails.guarantorId:', guarantorDetails.guarantorId);
    console.log('guarantorDetails.amountToGuarantee:', guarantorDetails.amountToGuarantee);
    console.log('guarantors array length:', guarantors.length);

    // Validate required fields
    if (!guarantorType) {
      console.log('❌ Validation failed: No guarantor type selected');
      setStatusMessage('Please select a guarantor type (Member Guarantors or Collateral).');
      setStatusError(true);
      return;
    }

    if (!guarantorDetails.guarantorId) {
      console.log('❌ Validation failed: No guarantor ID');
      setStatusMessage('Please select a guarantor first.');
      setStatusError(true);
      return;
    }

    if (!guarantorDetails.amountToGuarantee) {
      console.log('❌ Validation failed: No amount to guarantee:', guarantorDetails.amountToGuarantee);
      setStatusMessage('Please enter the amount to guarantee.');
      setStatusError(true);
      return;
    }

    // Get the selected guarantor from the grid
    console.log('Looking for guarantor with id:', selectedIds[0]);
    const selectedGuarantor = guarantors.find((g) => {
      console.log(`Checking guarantor id=${g.id} against selectedId=${selectedIds[0]}`);
      return g.id === selectedIds[0];
    });
    console.log('✓ selectedGuarantor found:', selectedGuarantor);
    
    if (!selectedGuarantor) {
      console.log('❌ Validation failed: Could not find selected guarantor');
      console.log('Available guarantors:', guarantors);
      setStatusMessage('Error: Could not find selected guarantor.');
      setStatusError(true);
      return;
    }

    // Get auth and system values from localStorage
    const user = useAuthStore.getState().user;
    const compId = parseInt(user?.CompId) || 30;
    const userId = user?.username || 'SYSTEM';
    const workStation = localStorage.getItem('workstation') || 'DESKTOP01';
    const winUser = localStorage.getItem('winUser') || user?.username || 'AdminUser';

    // Helper function to pad member codes to 6 digits
    const padMemberCode = (code) => String(code || '').padStart(6, '0');

    // Build the save payload matching backend expectations
    const savePayload = {
      MemberCode: padMemberCode(selectedGuarantor.guarantorId),
      LoanID: parseInt(selectedGuarantor.id.toString().split('-')[0]) || 0,
      GuarantorCode: padMemberCode(guarantorDetails.guarantorId),
      GuarantorAmount: parseFloat(guarantorDetails.amountToGuarantee) || 0,
      CollateralValue: parseFloat(guarantorDetails.collateralValue) || 0,
      CollateralDesc: guarantorDetails.collateralDesc || '',
      LoanAmount: parseFloat(selectedGuarantor.rawPrincipalAmt) || 0,
      // Set to the guaramt value of the last row in guaranteeHistoryRows (last Amount Guaranteed)
      CurrentGuaranteed: guaranteeHistoryRows.length > 0 ? guaranteeHistoryRows[guaranteeHistoryRows.length - 1].guaramt : 0,
      CompId: compId,
      UserId: userId,
      WorkStation: workStation,
      WinUser: winUser,
    };

    try {
      const result = await saveGuarantor(savePayload);

      if (result) {
        setStatusMessage('Guarantor saved successfully.');
        setStatusError(false);
        notifySaveSuccess({
          page: 'Loan / Loan Guarantor',
          action: 'Save Guarantor',
          message: 'Guarantor saved successfully.',
        });

        // Reload guarantors list from endpoint
        await loadGuarantors();

        // Reload guarantee history for the selected loan
        if (selectedLoanId) {
          await loadGuaranteeHistory(selectedLoanId);
        }

        // Reset form
        setGuarantorDetails({
          guarantorId: '',
          savingBalance: '',
          amountToGuarantee: '',
          guarantorName: '',
          collateralName: '',
          collateralValue: '',
          collateralDesc: '',
          loanBalance: '',
          guaranteeDate: '',
          guarantorRequired: false,
        });
        setSelectedIds([]);
      } else {
        setStatusMessage(saveError || 'Failed to save guarantor.');
        setStatusError(true);
        notifySaveError({
          page: 'Loan / Loan Guarantor',
          action: 'Save Guarantor',
          message: saveError || 'Failed to save guarantor.',
        });
      }
    } catch (err) {
      console.error('Error in handleSaveGuarantor:', err);
      setStatusMessage('Error saving guarantor.');
      setStatusError(true);
      notifySaveError({
        page: 'Loan / Loan Guarantor',
        action: 'Save Guarantor',
        message: 'Error saving guarantor.',
        error: err,
      });
    }
  };



  return (
    <Box p={3} sx={{ position: 'relative' }}>
      {/* Loading Spinner */}
      <Backdrop
        open={saveLoading}
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
            Saving guarantor...
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Guarantor
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Manage loan guarantors and process guarantees
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
      </Box>



      {/* Action Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={loadGuarantors}
          disabled={loading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
          }}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </Button>
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

      {/* Guarantors DataGrid */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 3, color: '#2c3e50' }}>
        Customer
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
          rows={guarantors}
          columns={GUARANTOR_COLUMNS}
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

      {/* Guarantor Details Card */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2c3e50', mb: 2 }}>
              Guarantor Details
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              {/* Guarantee Required Block */}
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
                <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
                  Guarantee Required
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1565c0', mt: 0.5 }}>
                  {selectedIds.length > 0 && guarantors.find((g) => g.id === selectedIds[0]) ? formatCurrency(guarantors.find((g) => g.id === selectedIds[0]).rawPrincipalAmt || 0) : 'D 0.00'}
                </Typography>
              </Box>
              
              {/* Total Guaranteed Block */}
              <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 1, border: '1px solid #e1bee7' }}>
                <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600 }}>
                  Total Guaranteed
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#6a1b9a', mt: 0.5 }}>
                  {formatCurrency(totalGuaranteed || 0)}
                </Typography>
              </Box>
              
              {/* Remaining Amount Block */}
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffe0b2' }}>
                <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600 }}>
                  Remaining Amount
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: remainingAmount >= 0 ? '#e65100' : '#d32f2f', mt: 0.5 }}>
                  {formatCurrency(remainingAmount || 0)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Guarantor ID Field */}
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Guarantor ID"
                    name="guarantorId"
                    value={guarantorDetails.guarantorId}
                    onChange={handleGuarantorDetailsChange}
                    variant="outlined"
                    size="small"
                    placeholder="Enter Guarantor ID"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Radio Button Group for Guarantor Type Selection */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2, display: 'block', fontSize: '1.05rem' }}>
                Select Guarantor Type
              </Typography>
              <RadioGroup
                aria-label="guarantor-type"
                name="guarantor-type"
                value={guarantorType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setGuarantorType(newType);
                  // Validate if guarantor ID is entered
                  if (guarantorDetails.guarantorId) {
                    if (newType === 'memberGuarantors') {
                      performGuarantorValidation(guarantorDetails.guarantorId, 4);
                    } else if (newType === 'collateral') {
                      performGuarantorValidation(guarantorDetails.guarantorId, 3);
                    }
                  }
                }}
                sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}
              >
                <FormControlLabel
                  value="memberGuarantors"
                  control={<Radio />}
                  label="Member Guarantors"
                />
                <FormControlLabel
                  value="collateral"
                  control={<Radio />}
                  label="Collateral"
                />
              </RadioGroup>
            </Box>

            <Grid container spacing={2}>
              {/* Guarantor Name - Show only for Member Guarantors */}
              {guarantorType === 'memberGuarantors' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Guarantor Name"
                    name="guarantorName"
                    value={guarantorDetails.guarantorName}
                    onChange={handleGuarantorDetailsChange}
                    variant="outlined"
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
              )}
              
              {/* Collateral Name - Show only for Collateral */}
              {guarantorType === 'collateral' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Collateral Name"
                    name="collateralName"
                    value={guarantorDetails.collateralName}
                    onChange={handleGuarantorDetailsChange}
                    variant="outlined"
                    size="small"
                    placeholder="Enter Collateral Name"
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Saving Balance"
                  name="savingBalance"
                  value={guarantorDetails.savingBalance}
                  onChange={handleGuarantorDetailsChange}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Enter amount"
                  name="amountToGuarantee"
                  value={formatCurrency(guarantorDetails.amountToGuarantee)}
                  onChange={handleAmountToGuaranteeChange}
                  variant="outlined"
                  size="small"
                  placeholder="Amount to Guarantee"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                  }}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                />
              </Grid>
              
              {/* Collateral Value - Show only for Collateral, editable */}
              {guarantorType === 'collateral' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Collateral Value"
                    name="collateralValue"
                    value={guarantorDetails.collateralValue}
                    onChange={handleGuarantorDetailsChange}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Guarantee Date"
                    value={guarantorDetails.guaranteeDate ? dayjs(guarantorDetails.guaranteeDate) : null}
                    onChange={(newValue) => {
                      const formatted = newValue ? newValue.format('YYYY-MM-DD') : '';
                      setGuarantorDetails((prev) => ({
                        ...prev,
                        guaranteeDate: formatted,
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Loan Balance"
                  name="loanBalance"
                  value={guarantorDetails.loanBalance}
                  onChange={handleGuarantorDetailsChange}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={guarantorDetails.guarantorRequired === true || guarantorDetails.guarantorRequired === 'Yes'}
                      onChange={(e) => {
                        setGuarantorDetails((prev) => ({
                          ...prev,
                          guarantorRequired: e.target.checked,
                        }));
                      }}
                      name="guarantorRequired"
                    />
                  }
                  label="Guarantor Required"
                  sx={{ display: 'flex', alignItems: 'center' }}
                />
              </Grid>
            </Grid>
          </Box>
          </CardContent>
        </Card>

      {/* Save Button */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveGuarantor}
          disabled={selectedIds.length === 0 || saveLoading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
          startIcon={saveLoading ? <CircularProgress size={18} /> : <SaveIcon />}
        >
          {saveLoading ? 'Saving...' : 'Save Guarantor'}
        </Button>
      </Box>

      {/* Guarantee History DataGrid */}
      {guaranteeHistoryRows.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
            Guarantee History
          </Typography>
          <Box
            sx={{
              height: 350,
              width: '100%',
              borderRadius: 1.5,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
            }}
          >
            <DataGrid
              rows={guaranteeHistoryRows}
              columns={GUARANTEE_HISTORY_COLUMNS}
              pageSizeOptions={[5, 10, 25]}
              paginationModel={{ pageSize: 10, page: 0 }}
              onPaginationModelChange={(newModel) => {}}
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
                '& .MuiDataGrid-row': {
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
        </Box>
      )}


    </Box>
  );
}
