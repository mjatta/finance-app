import React, { useMemo, useState } from 'react';
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
import { useGetTrialBalance } from './hooks/useGetTrialBalance';
import { buildTrialBalancePrintHtml } from './TrialBalance/printSetup';

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

export default function TrialBalance() {
  const { branches, loading: branchesLoading } = useBranches();
  const { fetchTrialBalance, loading: isFetching, error: trialBalanceError } = useGetTrialBalance();
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusMessage, setStatusMessage] = useState('');

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

  const handlePrint = async () => {
    if (!branchId || !date) {
      setStatusMessage('Please select a branch and date before printing.');
      return;
    }

    setStatusMessage('');

    // Fetch trial balance data
    const data = await fetchTrialBalance(branchId, date);

    if (Array.isArray(data) && data.length > 0) {
      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
        return;
      }

      const reportHtml = buildTrialBalancePrintHtml(data, date);
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      setStatusMessage(trialBalanceError || 'No trial balance data found for the selected date.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Trial Balance
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Select a branch and date, then print the trial balance.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {statusMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
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
                  if (!selected) {
                    return 'Select a branch';
                  }

                  const option = branchOptions.find((item) => item.id === selected);
                  return option?.name || 'Select a branch';
                },
              }}
            >
              <MenuItem value="" disabled>
                Select a branch
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
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={!branchId || !date || branchesLoading || isFetching}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {isFetching ? 'Fetching...' : 'Print'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
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