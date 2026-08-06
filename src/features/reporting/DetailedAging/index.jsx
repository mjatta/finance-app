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

const formatAmount = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const escapeCSV = (value) => {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function DetailedAging() {
  const { ranges, loading: rangesLoading } = useGetAgingRanges();
  const { products: productOptions, loading: productLoading } = useGetAgingProducts();
  const {
    categories: categoryOptions,
    loading: categoryLoading,
    refetchCategories,
  } = useGetAgingCategories();
  const { generateReport, loading: printLoading } = useGenerateAgingReport();

  const [rows, setRows] = useState(FALLBACK_ROWS);
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => dayjs());
  const [statusMessage, setStatusMessage] = useState('');
  const [savingRanges, setSavingRanges] = useState(false);
  const [rangesInitialized, setRangesInitialized] = useState(false);
  const isExportDisabled = printLoading;

  useEffect(() => {
    if (!rangesLoading && ranges.length > 0 && !rangesInitialized) {
      setRows(ranges);
      setRangesInitialized(true);
    }
  }, [ranges, rangesLoading, rangesInitialized]);

  // load loan officers


  const convertBandsToCSV = (rows) => {
    const headers = ['Days From', 'Days To', 'Percentage (%)'];
    const csvRows = rows.map((row) => [row.daysFrom || '', row.daysTo || '', row.percentage || '']);
    return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
  };

  const convertReportRowsToCSV = (data) => {
    // Group rows by days range / age category and emit per-account rows plus subtotals.
    const grouped = {};
    const order = [];

    data.forEach((row) => {
      const key = row.LoanAgeCategory || (row.DaysFrom || row.DaysTo ? `${row.DaysFrom || 'N/A'}-${row.DaysTo || 'N/A'}` : 'Ungrouped');
      if (!grouped[key]) {
        grouped[key] = [];
        order.push(key);
      }
      grouped[key].push(row);
    });

    const headers = ['Group', 'Account Number', 'Account Name', 'Amount Issued', 'Book Balance', 'Prepaid'];
    const csvRows = [];

    let grandAmount = 0;
    let grandBook = 0;
    let grandPrepaid = 0;

    order.forEach((key) => {
      const rowsInGroup = grouped[key] || [];
      let subAmount = 0;
      let subBook = 0;
      let subPrepaid = 0;

      // Add each account row with Group column
      rowsInGroup.forEach((r) => {
        const amount = Number(r.PRINCIPAL_AMT ?? 0) || 0;
        const book = Number(r.nbookbal ?? 0) || 0;
        const prepaid = Number(r.nnewbal ?? 0) || 0;
        subAmount += amount;
        subBook += book;
        subPrepaid += prepaid;
        csvRows.push([
          key,
          r.cacctnumb || '',
          r.cacctname || '',
          Math.abs(amount).toFixed(2),
          Math.abs(book).toFixed(2),
          Math.abs(prepaid).toFixed(2),
        ]);
      });

      // Group subtotal row
      csvRows.push([
        `${key} Total`,
        '',
        '',
        Math.abs(subAmount).toFixed(2),
        Math.abs(subBook).toFixed(2),
        Math.abs(subPrepaid).toFixed(2),
      ]);

      grandAmount += subAmount;
      grandBook += subBook;
      grandPrepaid += subPrepaid;
    });

    // Grand total row
    csvRows.push(['TOTAL', '', '', Math.abs(grandAmount).toFixed(2), Math.abs(grandBook).toFixed(2), Math.abs(grandPrepaid).toFixed(2)]);

    return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
  };

  const handleExportPDF = async (data) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
      return;
    }
    const dateStr = date.format('YYYY-MM-DD');
    const reportHtml = buildDetailedAgingPrintHtml(data, dateStr);
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportCSV = (data) => {
    const csvContent = convertReportRowsToCSV(data);
    const filename = `detailed-aging-${date.format('YYYY-MM-DD')}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const handleExportExcel = (data) => {
    const csvContent = convertReportRowsToCSV(data);
    const filename = `detailed-aging-${date.format('YYYY-MM-DD')}.xlsx`;
    downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleFetchAndExport = async (exportType) => {

    if (!date) {
      setStatusMessage('Please select a date before exporting.');
      return;
    }

    const payload = {
      ToDate: date.format('YYYY-MM-DD'),
      Product: Number(product) || 0,
      Category: Number(category) || 0,
    };

    const response = await generateReport(payload);
    if (!response.success) {
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
      setStatusMessage('No detailed aging data found for the selected filters.');
      return;
    }

    setStatusMessage('');

    if (exportType === 'pdf') {
      handleExportPDF(reportRows);
    } else if (exportType === 'csv') {
      handleExportCSV(reportRows);
    } else if (exportType === 'excel') {
      handleExportExcel(reportRows);
    }
  };

  const handleClear = () => {
    setRows(ranges.length > 0 ? ranges : FALLBACK_ROWS.map((row) => ({ ...row, daysFrom: '', daysTo: '', percentage: '' })));
    setRangesInitialized(false);
    setProduct('');
    setCategory('');
    setDate(dayjs());
    setStatusMessage('');
  };

  const handleCellChange = (rowId, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const handleAddColumn = () => {
    setRows((prevRows) => {
      const maxId = prevRows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
      return [...prevRows, { id: maxId + 1, daysFrom: '', daysTo: '', percentage: '' }];
    });
  };

  const handleSaveRanges = async () => {
    try {
      setSavingRanges(true);
      setStatusMessage('');

      const payload = rows.map((row) => ({
        daysFrom: Number(row.daysFrom) || 0,
        daysTo: Number(row.daysTo) || 0,
        percentage: Number(row.percentage) || 0,
      }));

      const response = await fetch('/api/loanaging/saveranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save aging ranges: ${response.status}`);
      }

      await refetchCategories();
      window.setTimeout(() => {
        refetchCategories();
      }, 700);

      setStatusMessage('Aging ranges saved successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(`Error saving ranges: ${error.message}`);
    } finally {
      setSavingRanges(false);
    }
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
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
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Aging Bands
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleAddColumn}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                Add Column
              </Button>
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
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 1 }}>
                      <TextField
                        type="number"
                        value={row.daysFrom}
                        onChange={(e) => handleCellChange(row.id, 'daysFrom', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 1 }}>
                      <TextField
                        type="number"
                        value={row.daysTo}
                        onChange={(e) => handleCellChange(row.id, 'daysTo', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 1 }}>
                      <TextField
                        type="number"
                        value={row.percentage}
                        onChange={(e) => handleCellChange(row.id, 'percentage', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
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
                    return productLoading ? 'Loading...' : 'All products';
                  }

                  const option = productOptions.find((item) => item.value === selected);
                  return option?.label || selected;
                },
              }}
            >
              <MenuItem value="">All products</MenuItem>
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
                    return categoryLoading ? 'Loading...' : 'All categories';
                  }

                  const option = categoryOptions.find((item) => item.value === selected);
                  return option?.label || selected;
                },
              }}
              disabled={categoryLoading}
            >
              <MenuItem value="">All categories</MenuItem>
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
              onClick={handleSaveRanges}
              disabled={savingRanges}
              startIcon={savingRanges ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {savingRanges ? 'Saving...' : 'Save Ranges'}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('pdf')}
              disabled={isExportDisabled}
              startIcon={printLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {printLoading ? 'Generating...' : 'PDF'}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('excel')}
              disabled={isExportDisabled}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('csv')}
              disabled={isExportDisabled}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              CSV
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
