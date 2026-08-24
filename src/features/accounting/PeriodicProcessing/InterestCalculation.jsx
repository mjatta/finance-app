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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { getFullApiUrl } from '../../../utils/apiConfig';
import { PercentAdornment } from '../../../components/FieldAdornments';

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
        // Use relative path so Vite middleware can intercept
        const url = getFullApiUrl('/api/periodic-processing');
        const response = await fetch(url);
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
      // Use relative path so Vite middleware can intercept
      const url = getFullApiUrl('/api/periodic-processing');
      const response = await fetch(url, {
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Savings Interest Calculation</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Manage savings interest rates and calculation methods by product</Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Savings Interest Products</Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={rows.map((row, index) => ({ ...row, id: row.id || `${row.category || 'cat'}-${index}` }))}
              columns={[
                { field: 'category', headerName: 'Category', flex: 0.9, minWidth: 120, align: 'center', headerAlign: 'center' },
                { field: 'productName', headerName: 'Product Name', flex: 1.2, minWidth: 140, align: 'center', headerAlign: 'center' },
                { field: 'interestRate', headerName: 'Interest Rate', flex: 0.9, minWidth: 110, align: 'center', headerAlign: 'center' },
                { field: 'interestScope', headerName: 'Interest Scope', flex: 1.1, minWidth: 130, align: 'center', headerAlign: 'center' },
                { field: 'calculationMethod', headerName: 'Calculation Method', flex: 1.2, minWidth: 140, align: 'center', headerAlign: 'center' },
                { field: 'mandate', headerName: 'Mandate', flex: 0.8, minWidth: 100, align: 'center', headerAlign: 'center' },
                { field: 'scope', headerName: 'Scope', flex: 0.8, minWidth: 100, align: 'center', headerAlign: 'center' },
              ]}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              checkboxSelection
              disableRowSelectionOnClick
              density="compact"
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
              }}
            />
          </Box>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}
