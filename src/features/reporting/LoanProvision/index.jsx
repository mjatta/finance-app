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
import useGetLoanProvisionDetails from './hooks/useGetLoanProvisionDetails';
import { buildLoanProvisionDetailsPrintHtml } from './printSetup';

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

export default function LoanProvision() {
  const { ranges, loading: rangesLoading } = useGetAgingRanges();
  const { products: productOptions, loading: productLoading } = useGetAgingProducts();
  const { fetchDetails, loading: detailsLoading } = useGetLoanProvisionDetails();

  const [rows, setRows] = useState(FALLBACK_ROWS);
  const [product, setProduct] = useState('');
  const [runDate, setRunDate] = useState(() => dayjs());
  const [statusMessage, setStatusMessage] = useState('');
  const [rangesInitialized, setRangesInitialized] = useState(false);
  const [savingRanges, setSavingRanges] = useState(false);

  useEffect(() => {
    if (!rangesLoading && ranges.length > 0 && !rangesInitialized) {
      setRows(ranges);
      setRangesInitialized(true);
    }
  }, [ranges, rangesLoading, rangesInitialized]);

  const canRunAction = Boolean(product && runDate);

  const convertToCSV = (data) => {
    const groupedData = {};
    const ageRanges = [];

    data.forEach((row) => {
      const key = `${row.DaysFrom || 'N/A'}-${row.DaysTo || 'N/A'}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          daysFrom: row.DaysFrom,
          daysTo: row.DaysTo,
          ageCategory: row.LoanAgeCategory || '',
          rows: [],
          savingsBalance: 0,
          loanBalance: 0,
          netLoan: 0,
          provisioningAmount: 0,
        };
        ageRanges.push(key);
      }

      const group = groupedData[key];
      group.rows.push(row);
      group.savingsBalance += Number(row.SavingsBalance ?? 0);
      group.loanBalance += Number(row.LoanBalance ?? 0);
      group.netLoan += Number(row.nnewbal ?? 0) - Number(row.nbookbal ?? 0);
      group.provisioningAmount += Number(row.LoanProvision ?? 0);
    });

    let totalSavingsBalance = 0;
    let totalLoanBalance = 0;
    let totalNetLoan = 0;
    let totalProvisioningAmount = 0;

    data.forEach((row) => {
      totalSavingsBalance += Number(row.SavingsBalance ?? 0);
      totalLoanBalance += Number(row.LoanBalance ?? 0);
      totalNetLoan += Number(row.nnewbal ?? 0) - Number(row.nbookbal ?? 0);
      totalProvisioningAmount += Number(row.LoanProvision ?? 0);
    });

    const headers = ['Days (from - to)', 'Savings Balance', 'Loan Balance', 'Net Loan', 'Provisioning Amount', 'Percentage (%)'];
    const csvRows = ageRanges.map((key) => {
      const group = groupedData[key];
      const daysLabel = group.ageCategory || `${group.daysFrom || 'N/A'}-${group.daysTo || 'N/A'}`;
      const percentage = group.loanBalance !== 0 && group.provisioningAmount !== 0
        ? ((group.provisioningAmount / Math.abs(group.loanBalance)) * 100).toFixed(2)
        : '0.00';

      return [
        daysLabel,
        formatAmount(group.savingsBalance),
        formatAmount(group.loanBalance),
        formatAmount(group.netLoan),
        formatAmount(group.provisioningAmount),
        `${percentage}%`,
      ];
    });

    const totalPercentageCalc = totalLoanBalance !== 0 && totalProvisioningAmount !== 0
      ? ((totalProvisioningAmount / Math.abs(totalLoanBalance)) * 100).toFixed(2)
      : '0.00';

    csvRows.push([
      'TOTAL',
      formatAmount(totalSavingsBalance),
      formatAmount(totalLoanBalance),
      formatAmount(totalNetLoan),
      formatAmount(totalProvisioningAmount),
      `${totalPercentageCalc}%`,
    ]);

    return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
  };

  const handleExportPDF = async (data) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
      return;
    }
    const reportHtml = buildLoanProvisionDetailsPrintHtml(data, runDate.format('YYYY-MM-DD'));
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportCSV = (data) => {
    const csvContent = convertToCSV(data);
    const filename = `loan-provision-${runDate.format('YYYY-MM-DD')}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const handleExportExcel = (data) => {
    const csvContent = convertToCSV(data);
    const filename = `loan-provision-${runDate.format('YYYY-MM-DD')}.xlsx`;
    downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleFetchAndExport = async (exportType) => {
    if (!product) {
      setStatusMessage('Please select a product before exporting.');
      return;
    }

    if (!runDate) {
      setStatusMessage('Please select a run date before exporting.');
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

    const detailsData = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    if (detailsData.length === 0) {
      setStatusMessage('No loan provision details found for the selected filters.');
      return;
    }

    if (exportType === 'pdf') {
      handleExportPDF(detailsData);
    } else if (exportType === 'csv') {
      handleExportCSV(detailsData);
    } else if (exportType === 'excel') {
      handleExportExcel(detailsData);
    }
  };

  const handleCellChange = (rowId, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
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

      setStatusMessage('Aging ranges saved successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(`Error saving ranges: ${error.message}`);
    } finally {
      setSavingRanges(false);
    }
  };

  const handleClear = () => {
    setRows(ranges.length > 0 ? ranges : FALLBACK_ROWS.map((row) => ({ ...row, daysFrom: '', daysTo: '', percentage: '' })));
    setRangesInitialized(false);
    setProduct('');
    setRunDate(dayjs());
    setStatusMessage('');
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
              disabled={!canRunAction || detailsLoading}
              startIcon={detailsLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {detailsLoading ? 'Generating...' : 'PDF'}
            </Button>

            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('excel')}
              disabled={!canRunAction || detailsLoading}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Excel
            </Button>

            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('csv')}
              disabled={!canRunAction || detailsLoading}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              CSV
            </Button>

            <Button
              variant="text"
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