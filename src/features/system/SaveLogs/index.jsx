import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { clearSaveLogs, getSaveLogs, SAVE_LOG_KEY } from '../../../utils/saveNotifications';

const formatDateTime = (isoDate) => {
  if (!isoDate) {
    return '-';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return String(isoDate);
  }

  return date.toLocaleString();
};

export default function SaveLogs() {
  const [logs, setLogs] = useState(() => getSaveLogs());

  const successCount = useMemo(() => logs.filter((log) => log?.status === 'success').length, [logs]);
  const errorCount = useMemo(() => logs.filter((log) => log?.status === 'error').length, [logs]);

  const handleRefresh = () => {
    setLogs(getSaveLogs());
  };

  const handleClear = () => {
    clearSaveLogs();
    setLogs([]);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `save-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Save Logs
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Logs are stored in browser storage key: {SAVE_LOG_KEY}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Card sx={{ minWidth: 180, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Total entries</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{logs.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Successful saves</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{successCount}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Failed saves</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>{errorCount}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={handleRefresh}>Refresh</Button>
        <Button variant="outlined" onClick={handleExport} disabled={logs.length === 0}>Export JSON</Button>
        <Button variant="contained" color="error" onClick={handleClear} disabled={logs.length === 0}>
          Clear Logs
        </Button>
      </Stack>

      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date/Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Page</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    No save logs yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>{log.user || '-'}</TableCell>
                  <TableCell>{log.page || '-'}</TableCell>
                  <TableCell>{log.action || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={log.status || '-'}
                      color={log.status === 'error' ? 'error' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{log.message || '-'}</TableCell>
                  <TableCell>{log.error || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
