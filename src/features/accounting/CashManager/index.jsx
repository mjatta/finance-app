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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import useCashManagerBranches from './hooks/useCashManagerBranches';
import { useCashAccounts } from './hooks/useCashAccounts';
import { useCashiersByBranch } from './hooks/useCashiersByBranch';
import { formatCurrency } from '../../../utils/currencyFormatter';

export default function CashManager() {
  const { branches, loading: branchesLoading } = useCashManagerBranches();
  const { cashAccounts, loading: cashAccountsLoading } = useCashAccounts();
  const { cashiers, loading: cashiersLoading, fetchCashiersByBranch } = useCashiersByBranch();

  const [branch, setBranch] = useState(null);
  const [cashAccount, setCashAccount] = useState(null);
  const [processType, setProcessType] = useState('allocation');
  const [rows, setRows] = useState([]);
  const [editingRows, setEditingRows] = useState({});

  const handleSaveRow = (rowId) => {
    // TODO: Call API to save the till amount for this cashier
    console.log('Saving row:', rowId, rows.find(r => r.id === rowId));
    setEditingRows(prev => ({ ...prev, [rowId]: false }));
  };

  const handleTillAmountChange = (rowId, newValue) => {
    setRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, tillAmount: parseFloat(newValue) || 0 } : row
      )
    );
  };

  const totalCurrentBalance = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.currentBalance) || 0), 0),
    [rows],
  );

  const columns = [
    { field: 'cashier', headerName: 'Cashier', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'accountName', headerName: 'Account Name', flex: 1.5, minWidth: 220, align: 'center', headerAlign: 'center' },
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
          value={params.value || 0}
          onChange={(e) => handleTillAmountChange(params.id, e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            textAlign: 'center',
            fontFamily: 'inherit',
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
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleSaveRow(params.id)}
          sx={{
            backgroundColor: '#667eea',
            '&:hover': { backgroundColor: '#5568d3' },
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.85rem',
          }}
        >
          Save
        </Button>
      ),
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Cashier Accounts</Typography>
                <Chip
                  label={`Total: ${formatCurrency(totalCurrentBalance)}`}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.85rem' }}
                />
              </Box>
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
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

