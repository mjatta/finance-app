import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useBranches } from '../../hooks/useBranches';
import { useLoanOfficers } from '../../hooks/useLoanOfficers';
import { useGetBalanceSheet } from './BalanceSheet/hook/useGetBalanceSheet';
import { buildBalanceSheetPrintHtml } from './BalanceSheet/printSetup';

const normalizeBranchName = (branch) => (
  branch?.branchName
  || branch?.br_name
  || branch?.name
  || branch?.branch
  || ''
).toString().trim();

const normalizeBranchId = (branch) => (
  branch?.branchid
  ?? branch?.BranchID
  ?? branch?.branchId
  ?? branch?.id
  ?? ''
).toString().trim();

export default function BalanceSheet() {
  const { branches, loading: branchesLoading } = useBranches();
  const { officers, isLoading: officersLoading, fetchLoanOfficers } = useLoanOfficers();
  const { fetchBalanceSheet, loading: isFetching, error: fetchError } = useGetBalanceSheet();
  const [branchId, setBranchId] = useState('ALL');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loanOfficer, setLoanOfficer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchLoanOfficers();
  }, [fetchLoanOfficers]);

  const formatAmount = (value) => {
    const amount = Number(value ?? 0);
    if (Number.isNaN(amount)) return '0.00';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const escapeCSV = (value) => {
    const str = String(value ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const convertToCSV = (rows) => {
    const headers = ['Account Number', 'Account Name', 'Debit', 'Credit'];
    const csvRows = rows.map((row) => [
      row.cacctnumb || '',
      row.cacctname || '',
      formatAmount(row.debitClose || 0),
      formatAmount(row.creditClose || 0),
    ]);
    return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
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

  const handleExportPDF = (data) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
      return;
    }
    const reportHtml = buildBalanceSheetPrintHtml(data, date);
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportCSV = (data) => {
    const csvContent = convertToCSV(data);
    const filename = `balance-sheet-${date}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const handleExportExcel = (data) => {
    const csvContent = convertToCSV(data);
    const filename = `balance-sheet-${date}.xlsx`;
    downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleFetchAndExport = async (exportType) => {
    if (!date) {
      setStatusMessage('Please select a date before exporting.');
      return;
    }

    setStatusMessage('');

    // Always fetch fresh data
    const data = await fetchBalanceSheet(branchId === 'ALL' ? '' : branchId, date);
    if (!Array.isArray(data) || data.length === 0) {
      setStatusMessage(fetchError || 'No balance sheet data found for the selected date.');
      return;
    }

    if (exportType === 'pdf') {
      handleExportPDF(data);
    } else if (exportType === 'csv') {
      handleExportCSV(data);
    } else if (exportType === 'excel') {
      handleExportExcel(data);
    }
  };

  const branchOptions = useMemo(() => {
    const rows = Array.isArray(branches) ? branches : [];
    const byId = new Map();

    rows.forEach((item) => {
      const id = normalizeBranchId(item);
      const name = normalizeBranchName(item);

      if (!id || !name || byId.has(id)) {
        return;
      }

      byId.set(id, { id, name });
    });

    return Array.from(byId.values());
  }, [branches]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Balance Sheet
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Select a branch and date, then print the balance sheet.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          {statusMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
            <TextField
              select
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              size="small"
              fullWidth
              disabled={branchesLoading || isFetching}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (selected === 'ALL' || !selected) return 'All Branches';
                  const option = branchOptions.find((item) => item.id === selected);
                  return option?.name || 'All Branches';
                },
              }}
            >
              <MenuItem value="ALL">
                All Branches
              </MenuItem>
              {branchOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Date"
              value={date ? dayjs(date) : null}
              onChange={(value) => setDate(value ? value.format('YYYY-MM-DD') : '')}
              disabled={isFetching}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />

            <TextField
              select
              label="Loan Officer"
              value={loanOfficer}
              onChange={(e) => setLoanOfficer(e.target.value)}
              size="small"
              fullWidth
              disabled={officersLoading || isFetching}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return 'All Officers';
                  const option = officers.find((item) => String(item.value) === String(selected));
                  return option?.label || selected;
                },
              }}
            >
              <MenuItem value="">
                All Officers
              </MenuItem>
              {officers.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('pdf')}
              disabled={!date || branchesLoading || isFetching}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {isFetching ? 'Fetching...' : 'PDF'}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('excel')}
              disabled={!date || branchesLoading || isFetching}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleFetchAndExport('csv')}
              disabled={!date || branchesLoading || isFetching}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Backdrop
        open={isFetching}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}