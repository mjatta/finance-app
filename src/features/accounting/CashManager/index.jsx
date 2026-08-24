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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useBranches } from '../../../hooks/useBranches';
import { useCashAccounts } from './hooks/useCashAccounts';
import { formatCurrency } from '../../../utils/currencyFormatter';

export default function CashManager() {
  const { branches, loading: branchesLoading } = useBranches();
  const { cashAccounts, loading: cashAccountsLoading } = useCashAccounts();

  const [branch, setBranch] = useState(null);
  const [cashAccount, setCashAccount] = useState(null);
  const [voucherNumber, setVoucherNumber] = useState('');
  const [processType, setProcessType] = useState('allocation');

  const [rows] = useState([]);

  const totalCurrentBalance = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.currentBalance) || 0), 0),
    [rows],
  );

  const columns = [
    { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'accountName', headerName: 'Account Name', flex: 1.5, minWidth: 220, align: 'center', headerAlign: 'center' },
    { field: 'cashier', headerName: 'Cashier', flex: 1, minWidth: 180, align: 'center', headerAlign: 'center' },
    {
      field: 'currentBalance',
      headerName: 'Current Balance',
      flex: 1,
      minWidth: 160,
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

      <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>Cash Details</Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Branch Name"
                  value={branch?.BranchCode || branch?.branchCode || ''}
                  onChange={(e) => {
                    const b = branches.find((br) => (br.BranchCode || br.branchCode || '') === e.target.value);
                    setBranch(b || null);
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

                <TextField
                  label="Account Number"
                  value={cashAccount?.accountNumber || ''}
                  size="small"
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Account Balance"
                  value={formatCurrency(0)}
                  size="small"
                  InputProps={{ readOnly: true }}
                  fullWidth
                />

                <TextField
                  label="Voucher Number"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  size="small"
                  fullWidth
                />

                <FormControl component="fieldset" sx={{ justifyContent: 'center' }}>
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

