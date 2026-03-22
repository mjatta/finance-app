import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
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

  const columns = [
    { field: 'id', headerName: 'ID', width: 80, hide: true },
    {
      field: 'timestamp',
      headerName: 'Date/Time',
      width: 180,
      valueFormatter: (value) => (value ? formatDateTime(value) : '-'),
    },
    { field: 'user', headerName: 'User', width: 130, valueFormatter: (value) => value || '-' },
    { field: 'page', headerName: 'Page', width: 130, valueFormatter: (value) => value || '-' },
    { field: 'action', headerName: 'Action', width: 130, valueFormatter: (value) => value || '-' },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value || '-'}
          color={params.value === 'error' ? 'error' : 'success'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'error',
      headerName: 'Error',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
  ];

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        user: log.user,
        page: log.page,
        action: log.action,
        status: log.status,
        message: log.message,
        error: log.error,
      })),
    [logs]
  );

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

      <DataGrid
        rows={rows}
        columns={columns}
        disableSelectionOnClick
        density="compact"
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
          sorting: { sortModel: [{ field: 'timestamp', sort: 'desc' }] },
        }}
        sx={{
          '& .MuiDataGrid-root': {
            border: 'none',
            borderRadius: 2,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 700,
            borderBottom: 'none',
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(odd)': {
              backgroundColor: '#f8f9fa',
            },
            '&:hover': {
              backgroundColor: '#e9ecef',
            },
          },
        }}
      />
    </Box>
  );
}
