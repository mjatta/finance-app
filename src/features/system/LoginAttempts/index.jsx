import React, { useMemo, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RefreshIcon from '@mui/icons-material/Refresh';
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
import { clearLoginAttempts, getLoginAttempts, LOGIN_LOG_KEY } from '../../../utils/loginAttemptLogs';

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

export default function LoginAttempts() {
  const [logs, setLogs] = useState(() => getLoginAttempts());

  const handleDownloadLog = (log) => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `login-attempt-${log.id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80, sortable: false, filterable: false },
    {
      field: 'timestamp',
      headerName: 'Date/Time',
      flex: 1.2,
      minWidth: 180,
      valueFormatter: (value) => (value ? formatDateTime(value) : '-'),
    },
    { field: 'username', headerName: 'User', flex: 1, minWidth: 130, valueFormatter: (value) => value || '-' },
    { field: 'ip', headerName: 'IP Address', flex: 1, minWidth: 130, valueFormatter: (value) => value || '-' },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 150, valueFormatter: (value) => value || '-' },
    { field: 'device', headerName: 'Device', flex: 1, minWidth: 130, valueFormatter: (value) => value || '-' },
    { field: 'os', headerName: 'OS', flex: 1, minWidth: 130, valueFormatter: (value) => value || '-' },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === 'success' ? 'Success' : 'Failure'}
          color={params.value === 'success' ? 'success' : 'error'}
          variant="outlined"
        />
      ),
    },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 150, valueFormatter: (value) => value || '-' },
    {
      field: 'download',
      headerName: 'Download',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleDownloadLog(logs.find((l) => l.id === params.row.id))}
        >
          JSON
        </Button>
      ),
    },
  ];

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        username: log.username,
        ip: log.ip,
        location: log.location,
        device: log.device,
        os: log.os,
        status: log.status,
        reason: log.reason,
      })),
    [logs]
  );

  const successCount = useMemo(() => logs.filter((log) => log?.status === 'success').length, [logs]);
  const failureCount = useMemo(() => logs.filter((log) => log?.status !== 'success').length, [logs]);

  const handleRefresh = () => {
    setLogs(getLoginAttempts());
  };

  const handleClear = () => {
    clearLoginAttempts();
    setLogs([]);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `login-attempts-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Box p={3}>
      <Box
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Login Attempts
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Track and audit user login activity across the system
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Logs are stored in browser storage key: {LOGIN_LOG_KEY}
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
            <Typography variant="caption" color="text.secondary">Successful logins</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{successCount}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Failed logins</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>{failureCount}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>Refresh</Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={logs.length === 0}>
          Export JSON
        </Button>
        <Button variant="contained" color="error" startIcon={<DeleteSweepIcon />} onClick={handleClear} disabled={logs.length === 0}>
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

