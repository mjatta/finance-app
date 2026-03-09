import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

export default function InterestCalculation() {
  const [interestDate, setInterestDate] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('average');
  const [annualRate, setAnnualRate] = useState('6');
  const [rows, setRows] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRows = async () => {
      try {
        const response = await fetch('/api/periodic-processing');
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        setRows(Array.isArray(payload?.interestRows) ? payload.interestRows : []);
      } catch {
        setRows([]);
      }
    };

    loadRows();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCalculate = async () => {
    const sanitizedRate = Number(annualRate) || 0;
    const baseBalance = 30000 + rows.length * 1250;
    const monthlyInterest = ((baseBalance * (sanitizedRate / 100)) / 12).toFixed(2);

    const nextRow = {
      id: `int-${Date.now()}`,
      accountNo: `SAV-${String((rows.length + 1) * 29).padStart(5, '0')}`,
      member: `${calculationMethod} method member`,
      averageBalance: `GMD ${baseBalance.toLocaleString()}`,
      rate: `${sanitizedRate}%`,
      interest: `GMD ${monthlyInterest}`,
      date: interestDate,
    };

    try {
      const response = await fetch('/api/periodic-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestRow: nextRow }),
      });

      if (!response.ok) {
        throw new Error('Failed to save interest calculation entry.');
      }

      const payload = await response.json();
      setRows(Array.isArray(payload?.interestRows) ? payload.interestRows : []);
      setStatusMessage('Interest calculation completed and saved.');
    } catch {
      setStatusMessage('Unable to calculate and save interest.');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Interest Calculation
      </Typography>

      {statusMessage && (
        <Typography
          variant="body2"
          sx={{ mb: 2, fontWeight: 700 }}
          color={statusMessage.toLowerCase().includes('unable') ? 'error.main' : 'success.main'}
        >
          {statusMessage}
        </Typography>
      )}

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Interest Date"
                type="date"
                fullWidth
                value={interestDate}
                onChange={(event) => setInterestDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Calculation Method"
                fullWidth
                value={calculationMethod}
                onChange={(event) => setCalculationMethod(event.target.value)}
              >
                <MenuItem value="average">Average Balance</MenuItem>
                <MenuItem value="minimum">Minimum Balance</MenuItem>
                <MenuItem value="maximum">Maximum Balance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Annual Rate (%)" fullWidth value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="contained" onClick={handleCalculate}>Calculate</Button>
              <Button variant="outlined">Post Interest</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Interest Calculation Preview
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Account No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Average Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Interest Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      No interest calculation records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id || `${row.accountNo}-${index}`} hover>
                      <TableCell>{row.accountNo}</TableCell>
                      <TableCell>{row.member}</TableCell>
                      <TableCell>{row.averageBalance}</TableCell>
                      <TableCell>{row.rate}</TableCell>
                      <TableCell>{row.interest}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
