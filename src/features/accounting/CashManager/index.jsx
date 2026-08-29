import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import useCashManagerBranches from './hooks/useCashManagerBranches';
import { useCashAccounts } from './hooks/useCashAccounts';
import { useCashiersByBranch } from './hooks/useCashiersByBranch';
import { useSaveCashManagerTills } from './hooks/useSaveCashManagerTills';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { useAuthStore } from '../../../store/authStore';

export default function CashManager() {
  const { branches, loading: branchesLoading } = useCashManagerBranches();
  const { cashAccounts, loading: cashAccountsLoading } = useCashAccounts();
  const { cashiers, loading: cashiersLoading, fetchCashiersByBranch } = useCashiersByBranch();
  const { saveTillAmounts, saveLoading } = useSaveCashManagerTills();
  const { user } = useAuthStore();

  const [branch, setBranch] = useState(null);
  const [cashAccount, setCashAccount] = useState(null);
  const [processType, setProcessType] = useState('allocation');
  const [rows, setRows] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [saveAttempted, setSaveAttempted] = useState(false);

  const handleTillAmountChange = (rowId, newValue) => {
    setRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, tillAmount: newValue === '' ? '' : (parseFloat(newValue) || 0) } : row
      )
    );
  };

  const handleSaveAllChanges = async () => {
    setSaveAttempted(true);
    const result = await saveTillAmounts(rows, branch, cashAccount, processType, user?.username);
    
    if (result.success) {
      setAlertSeverity('success');
      setAlertMessage('✓ Till amounts saved successfully');
    } else {
      setAlertSeverity('error');
      setAlertMessage(`✗ ${result.errorMessage || 'Failed to save till amounts'}`);
    }
    setAlertOpen(true);
  };

  const totalTillAmount = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.tillAmount) || 0), 0),
    [rows],
  );

  const totalEndBalance = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.endBalance) || 0), 0),
    [rows],
  );

  const totalCurrentBalance = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.currentBalance) || 0), 0),
    [rows],
  );

  const columns = [
    { field: 'cashier', headerName: 'Cashier', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'accountName', headerName: 'Account Name', flex: 1.5, minWidth: 220, align: 'center', headerAlign: 'center' },
    {
      field: 'currentBalance',
      headerName: 'Current Balance',
      flex: 1,
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => formatCurrency(p.value || 0),
    },
    {
      field: 'tillAmount',
      headerName: 'Till Amount',
      flex: 1,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <input
          type="number"
          value={params.value}
          onChange={(e) => handleTillAmountChange(params.id, e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #2196f3',
            borderRadius: '4px',
            textAlign: 'center',
            fontFamily: 'inherit',
            backgroundColor: '#e3f2fd',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#000000',
          }}
          step="0.01"
        />
      ),
    },
    {
      field: 'endBalance',
      headerName: 'End Balance',
      flex: 1,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => formatCurrency(p.value || 0),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Cash Manager</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Manage cash allocations and retirements across cashier accounts</Typography>
        </CardContent>
      </Card>

      {alertOpen && (
        <Alert
          severity={alertSeverity}
          onClose={() => setAlertOpen(false)}
          sx={{ mb: 3, borderRadius: 1.5, fontSize: '0.95rem', fontWeight: 500 }}
        >
          {alertMessage}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, width: '100%', gridTemplateColumns: { xs: '1fr', md: '25% 1fr' } }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>Cash Details</Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Branch Name"
                  value={branch?.BranchCode || branch?.branchCode || ''}
                  onChange={async (e) => {
                    const b = branches.find((br) => (br.BranchCode || br.branchCode || '') === e.target.value);
                    setBranch(b || null);
                    
                    // Fetch cashiers for selected branch
                    if (b && (b.branchCode || b.branchid)) {
                      const branchId = b.branchCode || b.branchid;
                      const fetchedCashiers = await fetchCashiersByBranch(branchId);
                      setRows(fetchedCashiers);
                    } else {
                      setRows([]);
                    }
                  }}
                  disabled={branchesLoading}
                  size="small"
                  required
                  error={saveAttempted && !branch}
                  helperText={saveAttempted && !branch ? 'Branch is required' : ''}
                >
                  <MenuItem value="">Select Branch</MenuItem>
                  {(branches || []).map((b) => (
                    <MenuItem key={b.BranchCode || b.branchCode} value={b.BranchCode || b.branchCode}>
                      {String(b.BranchName || b.branchName || b.BranchCode || b.branchCode || '').trim()}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: '0.75rem' }}>Process Type</FormLabel>
                <RadioGroup
                  row
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value)}
                >
                  <FormControlLabel value="allocation" control={<Radio size="small" />} label="Allocation" />
                  <FormControlLabel value="retirement" control={<Radio size="small" />} label="Retirement" />
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Cash Account"
                  value={cashAccount?.accountNumber || ''}
                  onChange={(e) => {
                    const acc = cashAccounts.find((a) => a.accountNumber === e.target.value);
                    setCashAccount(acc || null);
                  }}
                  disabled={cashAccountsLoading}
                  size="small"
                  required
                  error={saveAttempted && !cashAccount}
                  helperText={saveAttempted && !cashAccount ? 'Cash Account is required' : ''}
                >
                  <MenuItem value="">Select Cash Account</MenuItem>
                  {(cashAccounts || []).map((a) => (
                    <MenuItem key={a.accountNumber} value={a.accountNumber}>
                      {a.accountNumber} - {a.accountName}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Cashier Accounts</Typography>
            </Box>

            <Box>
              <div style={{ width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  density="compact"
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                    '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                  }}
                />
              </div>
            </Box>

            {/* Totals Row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1fr',
                gap: 0,
                borderTop: '2px solid',
                borderColor: 'divider',
                bgcolor: '#f5f7fa',
              }}
            >
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#666' }}>
                  TOTALS
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider' }} />
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider' }} />
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                  {formatCurrency(totalCurrentBalance)}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                  {formatCurrency(totalTillAmount)}
                </Typography>
              </Box>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                  {formatCurrency(totalEndBalance)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Save Button */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSaveAllChanges}
          disabled={saveLoading || !branch || !cashAccount || rows.length === 0}
          startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            backgroundColor: '#667eea',
            '&:hover': { backgroundColor: '#5568d3' },
            fontWeight: 600,
            paddingX: 4,
            paddingY: 1.5,
            boxShadow: 'none',
            textTransform: 'none',
            color: 'white',
            fontSize: '1rem',
          }}
        >
          Save Changes
        </Button>
      </Box>

      {/* Loading Overlay */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
        open={saveLoading}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Saving Changes...
        </Typography>
      </Backdrop>
    </Box>
  );
}