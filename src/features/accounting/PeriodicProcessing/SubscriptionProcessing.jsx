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

export default function SubscriptionProcessing() {
  const [processingDate, setProcessingDate] = useState('');
  const [branch, setBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [subscriptionType, setSubscriptionType] = useState('All');
  const [rows, setRows] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      try {
        const url = getFullApiUrl('/api/remote-branches/branches');
        const response = await fetch(url);
        if (!response.ok || !isMounted) {
          return;
        }

        const payload = await response.json();
        const branchOptions = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item) => (item?.br_name || item?.branchName || item?.name || '').toString().trim())
              .filter(Boolean),
          ),
        );

        setBranches(branchOptions);
      } catch {
        if (isMounted) {
          setBranches([]);
        }
      }
    };

    const loadRows = async () => {
      try {
        const url = getFullApiUrl('/api/periodic-processing');
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        setRows(Array.isArray(payload?.subscriptionRows) ? payload.subscriptionRows : []);
      } catch {
        setRows([]);
      }
    };

    loadBranches();
    loadRows();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunProcessing = async () => {
    const nextRow = {
      id: `sub-${Date.now()}`,
      memberNo: `MBR-${String((rows.length + 1) * 37).padStart(4, '0')}`,
      name: `${branch || 'Batch'} Member`,
      product: subscriptionType === 'All' ? 'Monthly Savings' : subscriptionType,
      expected: subscriptionType === 'Group Subscription' ? 'GMD 750' : 'GMD 500',
      status: processingDate ? `Processed ${processingDate}` : 'Processed',
    };

    try {
      const url = getFullApiUrl('/api/periodic-processing');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionRow: nextRow }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription processing entry.');
      }

      const payload = await response.json();
      setRows(Array.isArray(payload?.subscriptionRows) ? payload.subscriptionRows : []);
      setStatusMessage('Subscription batch processed and saved.');
      notifySaveSuccess({
        page: 'Processing / Periodic Subscription Processing',
        action: 'Save Subscription Processing',
        message: 'Subscription batch processed and saved.',
      });
    } catch (error) {
      setStatusMessage('Unable to process subscription batch.');
      notifySaveError({
        page: 'Processing / Periodic Subscription Processing',
        action: 'Save Subscription Processing',
        message: 'Unable to process subscription batch.',
        error,
      });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Periodic Subscription Processing
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
              <DatePicker
                label="Processing Date"
                value={processingDate ? dayjs(processingDate) : null}
                onChange={(value) => setProcessingDate(value ? value.format('YYYY-MM-DD') : '')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Branch"
                fullWidth
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => selected || 'Select branch',
                }}
              >
                <MenuItem value="" disabled>Select branch</MenuItem>
                {branches.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Subscription Type"
                fullWidth
                value={subscriptionType}
                onChange={(event) => setSubscriptionType(event.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Monthly Savings">Monthly Savings</MenuItem>
                <MenuItem value="Welfare Contribution">Welfare Contribution</MenuItem>
                <MenuItem value="Group Subscription">Group Subscription</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="contained" onClick={handleRunProcessing}>Run Processing</Button>
              <Button variant="outlined">Preview</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Due Subscription Batch
          </Typography>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <DataGrid
              rows={rows.map((row, index) => ({ ...row, id: row.id || `${row.memberNo}-${index}` }))}
              columns={[
                { field: 'memberNo', headerName: 'Member No', flex: 1, minWidth: 120 },
                { field: 'name', headerName: 'Member Name', flex: 1.2, minWidth: 140 },
                { field: 'product', headerName: 'Product', flex: 1, minWidth: 120 },
                { field: 'expected', headerName: 'Expected Amount', flex: 1, minWidth: 130 },
                { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
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
