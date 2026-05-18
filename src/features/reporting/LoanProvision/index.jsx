import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useGetAgingRanges from '../DetailedAging/hooks/useGetAgingRanges';
import useGetAgingProducts from '../DetailedAging/hooks/useGetAgingProducts';
import useGetLoanProvisionSummary from './hooks/useGetLoanProvisionSummary';
import useGetLoanProvisionDetails from './hooks/useGetLoanProvisionDetails';

const FALLBACK_ROWS = [
  { id: 1, daysFrom: '', daysTo: '', percentage: '' },
  { id: 2, daysFrom: '', daysTo: '', percentage: '' },
  { id: 3, daysFrom: '', daysTo: '', percentage: '' },
];

export default function LoanProvision() {
  const { ranges, loading: rangesLoading } = useGetAgingRanges();
  const { products: productOptions, loading: productLoading } = useGetAgingProducts();
  const { fetchSummary, loading: printLoading } = useGetLoanProvisionSummary();
  const { fetchDetails, loading: detailsLoading } = useGetLoanProvisionDetails();

  const [rows, setRows] = useState(FALLBACK_ROWS);
  const [product, setProduct] = useState('');
  const [runDate, setRunDate] = useState(() => dayjs());
  const [statusMessage, setStatusMessage] = useState('');
  const [workingButton, setWorkingButton] = useState('');
  const [rangesInitialized, setRangesInitialized] = useState(false);

  useEffect(() => {
    if (!rangesLoading && ranges.length > 0 && !rangesInitialized) {
      setRows(ranges);
      setRangesInitialized(true);
    }
  }, [ranges, rangesLoading, rangesInitialized]);

  const canRunAction = Boolean(product && runDate);

  const simulateAction = (actionLabel) => {
    if (!canRunAction) {
      setStatusMessage('Please select Product and Run Date first.');
      return;
    }

    setStatusMessage('');
    setWorkingButton(actionLabel);
    setTimeout(() => {
      setWorkingButton('');
      if (actionLabel === 'Print') {
        window.print();
      } else {
        setStatusMessage(`${actionLabel} completed.`);
      }
    }, 800);
  };

  const handlePrint = async () => {
    if (!canRunAction) {
      setStatusMessage('Please select Product and Run Date first.');
      return;
    }

    setStatusMessage('');
    const response = await fetchSummary({
      toDate: runDate.format('YYYY-MM-DD'),
      productId: product,
    });

    if (!response.success) {
      setStatusMessage('Failed to fetch loan provision summary. Please try again.');
      return;
    }

    window.print();
  };

  const handleDetailsProvisioning = async () => {
    if (!canRunAction) {
      setStatusMessage('Please select Product and Run Date first.');
      return;
    }

    setStatusMessage('');
    const response = await fetchDetails({
      toDate: runDate.format('YYYY-MM-DD'),
      productId: product,
    });

    if (!response.success) {
      setStatusMessage('Failed to fetch loan provision details. Please try again.');
      return;
    }

    setStatusMessage('Details provisioning completed.');
  };

  const handleClear = () => {
    setRows(ranges.length > 0 ? ranges : FALLBACK_ROWS.map((row) => ({ ...row, daysFrom: '', daysTo: '', percentage: '' })));
    setRangesInitialized(false);
    setProduct('');
    setRunDate(dayjs());
    setStatusMessage('');
    setWorkingButton('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Provision
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Review aging bands, select product and run date, then execute provisioning actions.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 980, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          {statusMessage && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Aging Bands
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, borderBottom: 'none' }}>Days From</TableCell>
                  <TableCell sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, borderBottom: 'none' }}>Days To</TableCell>
                  <TableCell sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, borderBottom: 'none' }}>Percentage (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      backgroundColor: index % 2 !== 0 ? '#fff' : '#f8f9fa',
                      '&:hover': { backgroundColor: '#e9ecef' },
                    }}
                  >
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{row.daysFrom}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{row.daysTo}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{row.percentage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              size="small"
              fullWidth
              disabled={productLoading}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return productLoading ? 'Loading...' : 'Select product';
                  }

                  const option = productOptions.find((item) => item.value === selected);
                  return option?.label || selected;
                },
              }}
            >
              <MenuItem value="" disabled>
                Select product
              </MenuItem>
              {productOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Run Date"
              value={runDate}
              onChange={(value) => setRunDate(value)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => simulateAction('Reschedule Provisioning')}
              disabled={!canRunAction || Boolean(workingButton)}
              startIcon={workingButton === 'Reschedule Provisioning' ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Reschedule Provisioning
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleDetailsProvisioning}
              disabled={!canRunAction || Boolean(workingButton) || detailsLoading}
              startIcon={detailsLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {detailsLoading ? 'Loading...' : 'Details Provisioning'}
            </Button>

            <Button
              variant="outlined"
              onClick={handlePrint}
              disabled={!canRunAction || Boolean(workingButton) || printLoading}
              startIcon={printLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {printLoading ? 'Loading...' : 'Print'}
            </Button>

            <Button
              variant="text"
              onClick={handleClear}
              disabled={Boolean(workingButton)}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}