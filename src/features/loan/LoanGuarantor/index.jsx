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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { useGuarantorLoad } from './Hooks/useGuarantorLoad';
import { useGuarantorValidate } from './Hooks/useGuarantorValidate';
import { useSaveGuarantor } from './Hooks/useSaveGuarantor';

const GUARANTOR_COLUMNS = [
  { field: 'guarantorId', headerName: 'Guarantor ID', flex: 1, minWidth: 120, sortable: true },
  { field: 'guarantorName', headerName: 'Guarantor Name', flex: 1.5, minWidth: 200, sortable: true },
  { field: 'savingBalance', headerName: 'Saving Balance', flex: 1, minWidth: 140, sortable: true },
  { field: 'collateralValue', headerName: 'Collateral Value', flex: 1, minWidth: 140, sortable: true },
  { field: 'loanBalance', headerName: 'Loan Balance', flex: 1, minWidth: 140, sortable: true },
  { field: 'guarantorRequired', headerName: 'Guarantor Required', flex: 1, minWidth: 140, sortable: true },
];

const GUARANTEE_COLUMNS = [
  { field: 'guarantorId', headerName: 'Guarantor ID', flex: 1, minWidth: 120, sortable: true },
  { field: 'guarantorName', headerName: 'Guarantor Name', flex: 1.5, minWidth: 200, sortable: true },
  { field: 'loanAmount', headerName: 'Loan Amount', flex: 1, minWidth: 140, sortable: true },
  { field: 'amountGuarantor', headerName: 'Amount Guarantor', flex: 1, minWidth: 140, sortable: true },
  { field: 'guaranteeDate', headerName: 'Guarantee Date', flex: 1, minWidth: 140, sortable: true },
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
  
  const [guaranteeRows, setGuaranteeRows] = useState([]);
  const [guarantorDetailsOpen, setGuarantorDetailsOpen] = useState(false);
  const [guarantorType, setGuarantorType] = useState(''); // '' (empty), 'memberGuarantors' or 'collateral'
  
  const [guarantorDetails, setGuarantorDetails] = useState({
    guarantorId: '',
    savingBalance: '',
    amountToGuarantee: '',
    guarantorName: '',
    collateralValue: '',
    loanBalance: '',
    guaranteeDate: '',
    totalGuaranteed: '',
    guarantorRequired: '',
  });

  const { fetchGuarantors } = useGuarantorLoad();
  const { validateGuarantor, loading: validateLoading, error: validateError } = useGuarantorValidate();
  const { saveGuarantor, loading: saveLoading, error: saveError } = useSaveGuarantor();

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

      const mappedGuarantors = clientList.map((item, index) => ({
        id: item.loan_id || index,
        guarantorId: item.ccustcode?.toString() || '',
        guarantorName: item.membername || '',
        savingBalance: item.principal_amt?.toString() || '0',
        collateralValue: (item.principal_amt * 1.2)?.toString() || '0', // 20% collateral value
        loanBalance: item.principal_amt?.toString() || '0',
        guarantorRequired: 'Yes',
        loanAmount: item.principal_amt || 0,
        repaymentAmount: item.repayment_amt || 0,
        numberOfPayments: item.nofpayments || 0,
        loanInterest: item.loan_interest || 0,
      }));

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
        collateralValue: '',
        loanBalance: '',
        guaranteeDate: '',
        totalGuaranteed: '',
        guarantorRequired: '',
      });
    } else {
      setSelectedIds([guarantorId]);
      if (selectedGuarantor) {
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
          // Member Guarantors mode: map fullName, balance, guarantorAmount
          setGuarantorDetails({
            guarantorId: data.guarantorCode || '',
            savingBalance: '',
            amountToGuarantee: '',
            guarantorName: data.fullName || '',
            collateralValue: '',
            loanBalance: data.balance || '',
            guaranteeDate: '',
            totalGuaranteed: '',
            guarantorRequired: 'Yes',
          });
        } else if (mode === 3) {
          // Collateral mode: map only balance and canGuarantee
          setGuarantorDetails({
            guarantorId: data.guarantorCode || '',
            savingBalance: data.balance || '', // balance maps to Saving Balance
            amountToGuarantee: '',
            guarantorName: '', // Not provided in collateral mode
            collateralValue: '',
            loanBalance: data.balance || '', // balance also used for Loan Balance
            guaranteeDate: '',
            totalGuaranteed: '',
            guarantorRequired: data.canGuarantee ? 'Yes' : 'No', // canGuarantee maps to Guarantor Required
          });
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

  const handleAddGuarantee = () => {
    if (!guarantorDetails.guarantorId) {
      setStatusMessage('Please select a guarantor first.');
      setStatusError(true);
      return;
    }

    const newGuarantee = {
      id: new Date().getTime(),
      guarantorId: guarantorDetails.guarantorId,
      guarantorName: guarantorDetails.guarantorName,
      loanAmount: guarantorDetails.loanBalance || '',
      amountGuarantor: guarantorDetails.amountToGuarantee || '',
      guaranteeDate: guarantorDetails.guaranteeDate || '',
    };

    setGuaranteeRows([...guaranteeRows, newGuarantee]);
    setStatusMessage('Guarantee added successfully.');
    setStatusError(false);
    notifySaveSuccess({
      page: 'Loan / Loan Guarantor',
      action: 'Add Guarantee',
      message: 'Guarantee added successfully.',
    });
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
  };

  const handleAmountToGuaranteeChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setGuarantorDetails((prev) => ({ ...prev, amountToGuarantee: cleanValue }));
  };

  const handleTotalGuaranteedChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setGuarantorDetails((prev) => ({ ...prev, totalGuaranteed: cleanValue }));
  };

  const handleSaveGuarantor = async () => {
    // Validate required fields
    if (!guarantorType) {
      setStatusMessage('Please select a guarantor type (Member Guarantors or Collateral).');
      setStatusError(true);
      return;
    }

    if (!guarantorDetails.guarantorId) {
      setStatusMessage('Please select a guarantor first.');
      setStatusError(true);
      return;
    }

    if (!guarantorDetails.amountToGuarantee) {
      setStatusMessage('Please enter the amount to guarantee.');
      setStatusError(true);
      return;
    }

    // Get the selected guarantor from the grid
    const selectedGuarantor = guarantors.find((g) => g.id === selectedIds[0]);
    if (!selectedGuarantor) {
      setStatusMessage('Error: Could not find selected guarantor.');
      setStatusError(true);
      return;
    }

    // TODO: Get compId and userId from store - for now using placeholder values
    // You may need to integrate with your state management (Redux, Context, etc.)
    const compId = 30; // Replace with store value
    const userId = 'Akh'; // Replace with store value

    // Build the save payload
    const savePayload = {
      MemberCode: selectedGuarantor.guarantorId || '',
      LoanID: selectedGuarantor.loanAmount || 0,
      GuarantorCode: selectedGuarantor.guarantorId || '',
      GuarantorAmount: parseFloat(guarantorDetails.amountToGuarantee) || 0,
      CollateralValue: parseFloat(guarantorDetails.collateralValue) || 0,
      CollateralDesc: '', // Blank for now as per requirement
      LoanAmount: parseFloat(guarantorDetails.loanBalance) || 0,
      CurrentGuaranteed: 0, // Blank for now as per requirement
      CompId: compId,
      UserId: userId,
      WorkStation: '', // Blank for now as per requirement
      WinUser: '', // Blank for now as per requirement
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

        // Add to guarantee table
        const newGuarantee = {
          id: new Date().getTime(),
          guarantorId: guarantorDetails.guarantorId,
          guarantorName: guarantorDetails.guarantorName,
          loanAmount: guarantorDetails.loanBalance || '',
          amountGuarantor: guarantorDetails.amountToGuarantee || '',
          guaranteeDate: guarantorDetails.guaranteeDate || '',
        };
        setGuaranteeRows([...guaranteeRows, newGuarantee]);

        // Reset form
        setGuarantorDetails({
          guarantorId: '',
          savingBalance: '',
          amountToGuarantee: '',
          guarantorName: '',
          collateralValue: '',
          loanBalance: '',
          guaranteeDate: '',
          totalGuaranteed: '',
          guarantorRequired: '',
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

  const guarantorCount = guarantors.length;

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
        <Box
          sx={{
            p: 2,
            bgcolor: '#e3f2fd',
            borderRadius: 1.5,
            border: '1px solid #bbdefb',
          }}
        >
          <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
            Total Guarantors
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1565c0' }}>
            {guarantorCount}
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
            Guarantees Documented
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#6a1b9a' }}>
            {guaranteeRows.length}
          </Typography>
        </Box>
      </Box>

      {/* Instructions */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: '#e8f5e9',
          borderRadius: 1.5,
          border: '1px solid #c8e6c9',
        }}
      >
        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
          💡 <strong>Tip:</strong> Click on any row to select a guarantor. Fill in the guarantee details form and click "Add Guarantee" to add a new guarantee.
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleAddGuarantee}
          disabled={selectedIds.length === 0 || loading}
          sx={{
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
        >
          ✓ Add Guarantee
        </Button>
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
        Guarantors
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
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, pb: 2, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Guarantor Details
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Radio Button Group for Guarantor Type Selection */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2, display: 'block', fontSize: '1.05rem' }}>
                Select Guarantor Type
              </Typography>
              <RadioGroup
                aria-label="guarantor-type"
                name="guarantor-type"
                value={guarantorType}
                onChange={handleGuarantorTypeChange}
                sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}
              >
                <FormControlLabel
                  value="memberGuarantors"
                  control={<Radio sx={{ display: 'none' }} />}
                  label="👥 Member Guarantors"
                  sx={{
                    flex: 1,
                    m: 0,
                    p: 1.5,
                    border: '2px solid',
                    borderColor: guarantorType === 'memberGuarantors' ? '#667eea' : '#e0e0e0',
                    borderRadius: 1.5,
                    bgcolor: guarantorType === 'memberGuarantors' ? '#f0f4ff' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: guarantorType === 'memberGuarantors' ? 700 : 500,
                    color: guarantorType === 'memberGuarantors' ? '#667eea' : '#2c3e50',
                    '&:hover': {
                      borderColor: '#667eea',
                      bgcolor: '#f0f4ff',
                    },
                  }}
                />
                <FormControlLabel
                  value="collateral"
                  control={<Radio sx={{ display: 'none' }} />}
                  label="💎 Collateral"
                  sx={{
                    flex: 1,
                    m: 0,
                    p: 1.5,
                    border: '2px solid',
                    borderColor: guarantorType === 'collateral' ? '#667eea' : '#e0e0e0',
                    borderRadius: 1.5,
                    bgcolor: guarantorType === 'collateral' ? '#f0f4ff' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: guarantorType === 'collateral' ? 700 : 500,
                    color: guarantorType === 'collateral' ? '#667eea' : '#2c3e50',
                    '&:hover': {
                      borderColor: '#667eea',
                      bgcolor: '#f0f4ff',
                    },
                  }}
                />
              </RadioGroup>
            </Box>

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
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Grid>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Collateral Value"
                  name="collateralValue"
                  value={guarantorDetails.collateralValue}
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
                  label="Total Guaranteed"
                  name="totalGuaranteed"
                  value={formatCurrency(guarantorDetails.totalGuaranteed)}
                  onChange={handleTotalGuaranteedChange}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                  }}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Guarantor Required"
                  name="guarantorRequired"
                  value={guarantorDetails.guarantorRequired}
                  onChange={handleGuarantorDetailsChange}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Grid>
            </Grid>
          </Box>
          </CardContent>
        </Card>

      {/* Save Button Below Guarantor Details Card */}
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
        >
          {saveLoading ? 'Saving...' : '💾 Save'}
        </Button>
      </Box>

      {/* Guarantee Table */}
      <>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
          Guarantee
        </Typography>
          <Box
            sx={{
              height: 300,
              width: '100%',
              borderRadius: 1.5,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
            }}
          >
            <DataGrid
              rows={guaranteeRows}
              columns={GUARANTEE_COLUMNS}
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
        </>
    </Box>
  );
}
