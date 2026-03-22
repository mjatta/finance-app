import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const todayIso = new Date().toISOString().split('T')[0];

const defaultPayrollRows = [
  {
    id: 'P001',
    payrollNumber: 'PAY-0001',
    firstName: 'Awa',
    lastName: 'Jallow',
    contribution: 2500,
    status: 'confirmed',
    amended: false,
  },
  {
    id: 'P002',
    payrollNumber: 'PAY-0002',
    firstName: 'Lamin',
    lastName: 'Sanyang',
    contribution: 1800,
    status: 'pending',
    amended: false,
  },
  {
    id: 'P003',
    payrollNumber: 'PAY-0003',
    firstName: 'Fatou',
    lastName: 'Camara',
    contribution: 3100,
    status: 'confirmed',
    amended: false,
  },
];

const memberAccountDetails = [
  {
    id: 'A001',
    accountNumber: '100001',
    accountName: 'Awa Jallow',
    accountType: 'Savings',
    accountBalance: 12000,
    totalRepayment: 900,
    accruedInterest: 120,
    totalPayment: 1020,
  },
  {
    id: 'A002',
    accountNumber: '100002',
    accountName: 'Lamin Sanyang',
    accountType: 'Regular',
    accountBalance: 8700,
    totalRepayment: 700,
    accruedInterest: 85,
    totalPayment: 785,
  },
  {
    id: 'A003',
    accountNumber: '100003',
    accountName: 'Fatou Camara',
    accountType: 'Savings',
    accountBalance: 15000,
    totalRepayment: 1000,
    accruedInterest: 140,
    totalPayment: 1140,
  },
];

const numberFormat = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function MemberPayrollManagement() {
  const [processingLegend, setProcessingLegend] = useState('automatic');
  const [selectedPayroll, setSelectedPayroll] = useState('monthly-deduction');
  const [selectedBatch, setSelectedBatch] = useState('batch-001');
  const [selectedContra, setSelectedContra] = useState('main-cash');
  const [processDate, setProcessDate] = useState(todayIso);
  const [filterLegend, setFilterLegend] = useState('all');
  const [checkToSms, setCheckToSms] = useState(false);
  const [fileName, setFileName] = useState('No file selected');
  const [payrollRows, setPayrollRows] = useState(defaultPayrollRows);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePayrollFile = async (event) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFileName(uploadedFile.name);

    try {
      const text = await uploadedFile.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) {
        setPayrollRows(defaultPayrollRows);
        return;
      }

      const rows = lines.slice(1).map((line, index) => {
        const [payrollNumber, firstName, lastName, contribution, status = 'pending'] = line.split(',').map((item) => item.trim());
        return {
          id: `UP-${index + 1}`,
          payrollNumber: payrollNumber || `PAY-UP-${index + 1}`,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'Member',
          contribution: Number(contribution || 0),
          status: status.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending',
          amended: false,
        };
      });

      setPayrollRows(rows.length > 0 ? rows : defaultPayrollRows);
    } catch {
      setPayrollRows(defaultPayrollRows);
    }
  };

  const filteredPayrollRows = useMemo(() => {
    if (filterLegend === 'confirmed') {
      return payrollRows.filter((row) => row.status === 'confirmed');
    }
    if (filterLegend === 'pending') {
      return payrollRows.filter((row) => row.status === 'pending');
    }
    return payrollRows;
  }, [payrollRows, filterLegend]);

  const memberContribution = useMemo(
    () => filteredPayrollRows.reduce((sum, row) => sum + Number(row.contribution || 0), 0),
    [filteredPayrollRows],
  );

  const totalPayment = useMemo(
    () => memberAccountDetails.reduce((sum, row) => sum + Number(row.totalPayment || 0), 0),
    [],
  );

  const processBalance = useMemo(() => memberContribution - totalPayment, [memberContribution, totalPayment]);

  const payrollColumns = useMemo(
    () => [
      { field: 'payrollNumber', headerName: 'Payroll Number', flex: 1, minWidth: 120 },
      { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 100 },
      { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 100 },
      {
        field: 'contribution',
        headerName: 'Contribution',
        flex: 1,
        minWidth: 100,
        valueFormatter: (value) => numberFormat(value),
      },
      {
        field: 'amended',
        headerName: 'Amended',
        flex: 0.8,
        minWidth: 80,
        renderCell: (params) => (
          <Checkbox checked={params.value} onChange={() => handleToggleAmended(params.row.id)} />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const payrollGridRows = useMemo(
    () => filteredPayrollRows.map((row) => ({ ...row, _originalData: row })),
    [filteredPayrollRows],
  );

  const accountColumns = useMemo(
    () => [
      { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 120 },
      { field: 'accountName', headerName: 'Account Name', flex: 1, minWidth: 120 },
      { field: 'accountType', headerName: 'Account Type', flex: 1, minWidth: 100 },
      {
        field: 'accountBalance',
        headerName: 'Account Balance',
        flex: 1,
        minWidth: 120,
        valueFormatter: (value) => numberFormat(value),
      },
      {
        field: 'totalRepayment',
        headerName: 'Total Repayment',
        flex: 1,
        minWidth: 120,
        valueFormatter: (value) => numberFormat(value),
      },
      {
        field: 'accruedInterest',
        headerName: 'Accured Interest',
        flex: 1,
        minWidth: 120,
        valueFormatter: (value) => numberFormat(value),
      },
      {
        field: 'totalPayment',
        headerName: 'Total Payment',
        flex: 1,
        minWidth: 120,
        valueFormatter: (value) => numberFormat(value),
      },
    ],
    [],
  );

  const accountGridRows = useMemo(
    () => memberAccountDetails.map((row) => ({ ...row, _originalData: row })),
    [memberAccountDetails],
  );

  const handleToggleAmended = (id) => {
    setPayrollRows((prev) => prev.map((row) => (row.id === id ? { ...row, amended: !row.amended } : row)));
  };

  const handleAction = (message) => {
    setStatusMessage(message);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Member Payroll Management
      </Typography>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Select Payroll File
          </Typography>
          <TextField
            type="file"
            fullWidth
            inputProps={{ accept: '.csv,.txt' }}
            onChange={handlePayrollFile}
          />
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, mb: 2 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Processing Legend
            </Typography>
            <FormControl>
              <RadioGroup value={processingLegend} onChange={(e) => setProcessingLegend(e.target.value)}>
                <FormControlLabel value="automatic" control={<Radio />} label="Automatic" />
                <FormControlLabel value="manual" control={<Radio />} label="Manual" />
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Select Payroll
            </Typography>
            <FormControl>
              <RadioGroup value={selectedPayroll} onChange={(e) => setSelectedPayroll(e.target.value)}>
                <FormControlLabel value="monthly-deduction" control={<Radio />} label="Monthly Deduction" />
                <FormControlLabel value="salary-payment" control={<Radio />} label="Salary Payment" />
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Processing Setup
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField select label="Select Batch" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                <MenuItem value="batch-001">Batch 001</MenuItem>
                <MenuItem value="batch-002">Batch 002</MenuItem>
              </TextField>
              <TextField select label="Select Contra" value={selectedContra} onChange={(e) => setSelectedContra(e.target.value)}>
                <MenuItem value="main-cash">Main Cash</MenuItem>
                <MenuItem value="payroll-clearing">Payroll Clearing</MenuItem>
              </TextField>
              <TextField
                label="Process Date"
                type="date"
                value={processDate}
                onChange={(e) => setProcessDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
            Payroll Members
          </Typography>
          <DataGrid
            rows={payrollGridRows}
            columns={payrollColumns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            density="compact"
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              },
              '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
              '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
            }}
          />
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, mb: 2 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <TextField label="File Name" fullWidth value={fileName} InputProps={{ readOnly: true }} />
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Filtering Legend
            </Typography>
            <FormControl>
              <RadioGroup value={filterLegend} onChange={(e) => setFilterLegend(e.target.value)}>
                <FormControlLabel value="all" control={<Radio />} label="All" />
                <FormControlLabel value="confirmed" control={<Radio />} label="Payroll Confirmed" />
                <FormControlLabel value="pending" control={<Radio />} label="Payroll Pending" />
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <TextField label="Member Contribution" fullWidth value={numberFormat(memberContribution)} InputProps={{ readOnly: true }} sx={{ mb: 1.5 }} />
            <FormControlLabel
              control={<Checkbox checked={checkToSms} onChange={(e) => setCheckToSms(e.target.checked)} />}
              label="Check to SMS"
            />
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
            Member Account Details
          </Typography>
          <DataGrid
            rows={accountGridRows}
            columns={accountColumns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            density="compact"
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              },
              '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
              '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
            }}
          />
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="outlined" onClick={() => handleAction('Loaded processed members.')}>View Processed Member</Button>
        <Button variant="outlined" onClick={() => handleAction('Batch setup opened.')}>Batch Setup</Button>
      </Box>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
            Process Monitor
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
            <TextField label="Total Record" value={String(filteredPayrollRows.length)} InputProps={{ readOnly: true }} />
            <TextField label="Total Contribution" value={numberFormat(memberContribution)} InputProps={{ readOnly: true }} />
            <TextField label="Balance" value={numberFormat(processBalance)} InputProps={{ readOnly: true }} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => handleAction('Process batch completed successfully.')}>Process Batch</Button>
        <Button variant="contained" color="secondary" onClick={() => handleAction('Payroll confirmed and posted successfully.')}>Confirm and Post Payroll</Button>
      </Box>

      {statusMessage && (
        <Typography
          sx={{
            mt: 2,
            p: 1.25,
            borderRadius: 1,
            bgcolor: 'success.light',
            color: 'success.dark',
            fontWeight: 600,
          }}
        >
          {statusMessage}
        </Typography>
      )}
    </Box>
  );
}
