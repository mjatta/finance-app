import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

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
      notifySaveSuccess({
        page: 'Processing / Interest Calculation',
        action: 'Save Interest Calculation',
        message: 'Interest calculation completed and saved.',
      });
    } catch (error) {
      setStatusMessage('Unable to calculate and save interest.');
      notifySaveError({
        page: 'Processing / Interest Calculation',
        action: 'Save Interest Calculation',
        message: 'Unable to calculate and save interest.',
        error,
      });
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
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <DataGrid
              rows={rows.map((row, index) => ({ ...row, id: row.id || `${row.accountNo}-${index}` }))}
              columns={[
                { field: 'accountNo', headerName: 'Account No', flex: 1, minWidth: 120 },
                { field: 'member', headerName: 'Member', flex: 1.2, minWidth: 140 },
                { field: 'averageBalance', headerName: 'Average Balance', flex: 1, minWidth: 130 },
                { field: 'rate', headerName: 'Rate', flex: 0.6, minWidth: 80 },
                { field: 'interest', headerName: 'Interest Amount', flex: 1, minWidth: 130 },
              ]}
              pageSizeOptions={[10, 25, 50]}
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
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
