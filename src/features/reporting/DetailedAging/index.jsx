import React, { useState, useEffect } from 'react';
import {
  Alert,
  Backdrop,
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
import useGetAgingRanges from './hooks/useGetAgingRanges';
import useGetAgingProducts from './hooks/useGetAgingProducts';
import useGetAgingCategories from './hooks/useGetAgingCategories';
import useGenerateAgingReport from './hooks/useGenerateAgingReport';
import { buildDetailedAgingPrintHtml } from './printSetup';

const FALLBACK_ROWS = [
  { id: 1, daysFrom: '', daysTo: '', percentage: '' },
  { id: 2, daysFrom: '', daysTo: '', percentage: '' },
  { id: 3, daysFrom: '', daysTo: '', percentage: '' },
];

export default function DetailedAging() {
  const { ranges, loading: rangesLoading } = useGetAgingRanges();
  const { products: productOptions, loading: productLoading } = useGetAgingProducts();
  const { categories: categoryOptions, loading: categoryLoading } = useGetAgingCategories();
  const { generateReport, loading: printLoading } = useGenerateAgingReport();

  const [rows, setRows] = useState(FALLBACK_ROWS);
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => dayjs());
  const [statusMessage, setStatusMessage] = useState('');
  const [rangesInitialized, setRangesInitialized] = useState(false);
  const isPrintDisabled = !product || !category || printLoading;

  useEffect(() => {
    if (!rangesLoading && ranges.length > 0 && !rangesInitialized) {
      setRows(ranges);
      setRangesInitialized(true);
    }
  }, [ranges, rangesLoading, rangesInitialized]);

  const handlePrint = async () => {
    if (!product) {
      setStatusMessage('Please select a product before printing.');
      return;
    }

    if (!date) {
      setStatusMessage('Please select a date before printing.');
      return;
    }

    // Open preview window synchronously to avoid browser popup blocking
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
      return;
    }

    const payload = {
      ToDate: date.format('YYYY-MM-DD'),
      Product: Number(product) || 0,
      Category: Number(category) || 0,
      ByLoanOfficer: '',
    };

    const response = await generateReport(payload);
    if (!response.success) {
      printWindow.close();
      setStatusMessage('Failed to generate detailed aging report. Please try again.');
      return;
    }

    const reportRows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.rows)
          ? response.data.rows
          : [];

    if (reportRows.length === 0) {
      printWindow.close();
      setStatusMessage('No detailed aging data found for the selected filters.');
      return;
    }

    const reportHtml = buildDetailedAgingPrintHtml(reportRows, payload.ToDate);
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();

    setStatusMessage('');
    printWindow.print();
  };

  const handleClear = () => {
    setRows(ranges.length > 0 ? ranges : FALLBACK_ROWS.map((row) => ({ ...row, daysFrom: '', daysTo: '', percentage: '' })));
    setRangesInitialized(false);
    setProduct('');
    setCategory('');
    setDate(dayjs());
    setStatusMessage('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop
        open={printLoading}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Page header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Detailed Aging
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Configure aging bands, then select a product, category, and date before printing.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 840, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {statusMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          {/* Aging bands grid */}
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

          {/* Filters */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, mb: 3 }}>
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

            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return categoryLoading ? 'Loading...' : 'Select category';
                  }

                  const option = categoryOptions.find((item) => item.value === selected);
                  return option?.label || selected;
                },
              }}
              disabled={categoryLoading}
            >
              <MenuItem value="" disabled>
                Select category
              </MenuItem>
              {categoryOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Date"
              value={date}
              onChange={(value) => setDate(value)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={isPrintDisabled}
              startIcon={printLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {printLoading ? 'Generating...' : 'Print'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
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
