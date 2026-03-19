import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const mockMemberDeposits = {
  MEM001: {
    branchName: 'Banjul Branch',
    mainCashAccount: 'MAIN-CASH-001',
    accountNumber: '1000012345',
    accountBalance: '18,500.00',
    voucherNumber: 'VCH-2026-0001',
    total: '3,500.00',
    transactions: [
      {
        id: 1,
        cashier: 'Awa Jallow',
        accountNumber: '1000012345',
        accountName: 'John Doe',
        currentBalance: '15,000.00',
        tillAmount: '2,000.00',
        endBalance: '17,000.00',
      },
      {
        id: 2,
        cashier: 'Lamin Sanyang',
        accountNumber: '1000012345',
        accountName: 'John Doe',
        currentBalance: '17,000.00',
        tillAmount: '1,500.00',
        endBalance: '18,500.00',
      },
    ],
  },
  MEM002: {
    branchName: 'Serrekunda Branch',
    mainCashAccount: 'MAIN-CASH-002',
    accountNumber: '1000098765',
    accountBalance: '9,200.00',
    voucherNumber: 'VCH-2026-0002',
    total: '1,200.00',
    transactions: [
      {
        id: 1,
        cashier: 'Fatou Camara',
        accountNumber: '1000098765',
        accountName: 'Awa Jallow',
        currentBalance: '8,000.00',
        tillAmount: '1,200.00',
        endBalance: '9,200.00',
      },
    ],
  },
  MEM003: {
    branchName: 'Brikama Branch',
    mainCashAccount: 'MAIN-CASH-003',
    accountNumber: '1000044455',
    accountBalance: '22,100.00',
    voucherNumber: 'VCH-2026-0003',
    total: '2,100.00',
    transactions: [
      {
        id: 1,
        cashier: 'Mariama Touray',
        accountNumber: '1000044455',
        accountName: 'Lamin Sanyang',
        currentBalance: '20,000.00',
        tillAmount: '2,100.00',
        endBalance: '22,100.00',
      },
    ],
  },
};

export default function DepositManagement() {
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    branchName: '',
    mainCashAccount: '',
    accountNumber: '',
    accountBalance: '',
    voucherNumber: '',
    processType: 'allocation',
    total: '',
  });
  const [rows, setRows] = useState([]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberIdBlur = async () => {
    if (!formData.memberId.trim()) {
      return;
    }

    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const member = mockMemberDeposits[formData.memberId.trim().toUpperCase()];

      if (!member) {
        setFormData((prev) => ({
          ...prev,
          branchName: '',
          mainCashAccount: '',
          accountNumber: '',
          accountBalance: '',
          voucherNumber: '',
          total: '',
        }));
        setRows([]);
        setStatusMessage('Member ID not found.');
        setStatusError(true);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        branchName: member.branchName,
        mainCashAccount: member.mainCashAccount,
        accountNumber: member.accountNumber,
        accountBalance: member.accountBalance,
        voucherNumber: member.voucherNumber,
        total: member.total,
      }));
      setRows(member.transactions);
      setStatusMessage('Member deposit details loaded successfully.');
      setStatusError(false);
    } catch {
      setStatusMessage('Failed to load member deposit details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  };

  const gridRows = useMemo(() => rows, [rows]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Member Deposit
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Member Details
            </Typography>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <TextField
                label="Member ID"
                name="memberId"
                value={formData.memberId}
                onChange={handleChange}
                onBlur={handleMemberIdBlur}
                disabled={isLoadingMember}
                placeholder="e.g. MEM001"
              />
              <TextField
                label="Branch Name"
                name="branchName"
                value={formData.branchName}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />

              <TextField
                label="Main Cash Account"
                name="mainCashAccount"
                value={formData.mainCashAccount}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />
              <TextField
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />

              <TextField
                label="Account Balance"
                name="accountBalance"
                value={formData.accountBalance}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />
              <TextField
                label="Voucher Number"
                name="voucherNumber"
                value={formData.voucherNumber}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Process Type
            </Typography>

            <FormControl>
              <RadioGroup row name="processType" value={formData.processType} onChange={handleChange}>
                <FormControlLabel value="allocation" control={<Radio />} label="Allocation" />
                <FormControlLabel value="retirement" control={<Radio />} label="Retirement" />
              </RadioGroup>
            </FormControl>

            <TextField
              sx={{ mt: 2, maxWidth: 260 }}
              label="Total"
              name="total"
              value={formData.total}
              onChange={handleChange}
            />
          </CardContent>
        </Card>
      </Box>

      {statusMessage && (
        <Typography
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: statusError ? 'error.light' : 'success.light',
            color: statusError ? 'error.dark' : 'success.dark',
          }}
        >
          {statusMessage}
        </Typography>
      )}

      <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Deposit Transactions
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Cashier</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Account Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Current Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Till Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>End Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gridRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.cashier}</TableCell>
                    <TableCell>{row.accountNumber}</TableCell>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell>{row.currentBalance}</TableCell>
                    <TableCell>{row.tillAmount}</TableCell>
                    <TableCell>{row.endBalance}</TableCell>
                  </TableRow>
                ))}
                {gridRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No deposit transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
