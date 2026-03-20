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
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function SubscriptionProcessing() {
  const [processingDate, setProcessingDate] = useState('');
  const [branch, setBranch] = useState('All Branches');
  const [subscriptionType, setSubscriptionType] = useState('All');
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
        setRows(Array.isArray(payload?.subscriptionRows) ? payload.subscriptionRows : []);
      } catch {
        setRows([]);
      }
    };

    loadRows();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunProcessing = async () => {
    const nextRow = {
      id: `sub-${Date.now()}`,
      memberNo: `MBR-${String((rows.length + 1) * 37).padStart(4, '0')}`,
      name: `${branch === 'All Branches' ? 'Batch' : branch} Member`,
      product: subscriptionType === 'All' ? 'Monthly Savings' : subscriptionType,
      expected: subscriptionType === 'Group Subscription' ? 'GMD 750' : 'GMD 500',
      status: processingDate ? `Processed ${processingDate}` : 'Processed',
    };

    try {
      const response = await fetch('/api/periodic-processing', {
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
              <TextField
                label="Processing Date"
                type="date"
                fullWidth
                value={processingDate}
                onChange={(event) => setProcessingDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Branch" fullWidth value={branch} onChange={(event) => setBranch(event.target.value)}>
                <MenuItem value="All Branches">All Branches</MenuItem>
                <MenuItem value="Banjul Main">Banjul Main</MenuItem>
                <MenuItem value="Serekunda">Serekunda</MenuItem>
                <MenuItem value="Brikama">Brikama</MenuItem>
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

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Member No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Member Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expected Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      No subscription records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id || `${row.memberNo}-${index}`} hover>
                      <TableCell>{row.memberNo}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.expected}</TableCell>
                      <TableCell>{row.status}</TableCell>
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
