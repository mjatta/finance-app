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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Payroll Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>First Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contribution</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amended</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayrollRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.payrollNumber}</TableCell>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>{numberFormat(row.contribution)}</TableCell>
                    <TableCell>
                      <Checkbox checked={row.amended} onChange={() => handleToggleAmended(row.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Account Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Account Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Account Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Repayment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Accured Interest</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memberAccountDetails.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.accountNumber}</TableCell>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell>{row.accountType}</TableCell>
                    <TableCell>{numberFormat(row.accountBalance)}</TableCell>
                    <TableCell>{numberFormat(row.totalRepayment)}</TableCell>
                    <TableCell>{numberFormat(row.accruedInterest)}</TableCell>
                    <TableCell>{numberFormat(row.totalPayment)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
