import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getFullApiUrl } from '../../../utils/apiConfig';

export default function LoginAttempts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { field: 'ts', headerName: 'ts', hide: true },
    { field: 'timestamp', headerName: 'Timestamp', flex: 2 },
    { field: 'username', headerName: 'User', flex: 1 },
    { field: 'ip', headerName: 'IP Address', flex: 1 },
    { field: 'location', headerName: 'Location', flex: 1 },
    { field: 'device', headerName: 'Device', flex: 1 },
    { field: 'os', headerName: 'OS', flex: 1 },
    { field: 'browser', headerName: 'Browser', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 0.8 },
  ];

  useEffect(() => {
    let mounted = true;

    const formatTimestamp = (val) => {
      if (val === null || val === undefined || val === '') return '';
      const num = typeof val === 'number' ? val : Number(val);
      let date = null;
      if (Number.isFinite(num) && num > 0) {
        // handle seconds vs milliseconds heuristics
        date = new Date(num > 1e12 ? num : num * (num < 1e11 ? 1000 : 1));
      } else {
        const parsed = new Date(String(val));
        if (!Number.isNaN(parsed.getTime())) date = parsed;
      }
      if (!date) return String(val || '');
      return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    };

    const parseToEpoch = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'number' ? val : Number(val);
      if (Number.isFinite(num) && num > 0) {
        return num > 1e12 ? Math.floor(num) : Math.floor(num * (num < 1e11 ? 1000 : 1));
      }
      const parsed = new Date(String(val));
      if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
      return null;
    };

    const mapItem = (item, idx) => {
      const fingerprint = item.deviceFingerprint || item.deviceInfo || item.device || {};
      const browser = item.browser || item.userAgent || fingerprint.userAgent || fingerprint.browser || '';
      const os = item.os || item.platform || fingerprint.platform || fingerprint.os || '';
      const device = item.device || fingerprint.device || fingerprint.vendor || '';
      const raw = item.timestamp || item.time || item.createdAt || item.dt || '';
      const ts = parseToEpoch(raw) || Date.now();
      return {
        id: idx + 1,
        ts,
        timestamp: formatTimestamp(raw),
        username: item.username || item.userId || item.user || '',
        ip: item.ip || item.ipAddress || item.remoteIp || '',
        location: item.location || item.city || item.country || '',
        device,
        os,
        browser,
        status: item.status || (item.success ? 'success' : 'failure') || '',
      };
    };

    const load = async () => {
      try {
        const url = getFullApiUrl('/api/system/login-attempts');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch login attempts');
        const data = await res.json();
        if (!mounted) return;
        const payload = Array.isArray(data) ? data : (data.items || []);

        if ((!payload || payload.length === 0) && typeof localStorage !== 'undefined') {
          const queued = JSON.parse(localStorage.getItem('loginAttempts:fallback') || '[]');
          if (Array.isArray(queued) && queued.length > 0) {
            setRows(queued.map(mapItem));
            setLoading(false);
            return;
          }
        }

        setRows(payload.map(mapItem));
      } catch (err) {
        // best-effort fallback to local queued attempts
        try {
          const queued = JSON.parse(localStorage.getItem('loginAttempts:fallback') || '[]');
          if (Array.isArray(queued) && queued.length > 0) {
            setRows(queued.map(mapItem));
          }
        } catch (e) {
          console.error('LoginAttempts load error', e.message || e);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const intervalId = setInterval(load, 8000);
    const onStorage = (evt) => {
      if (evt.key === 'loginAttempts:fallback') load();
    };
    window.addEventListener('storage', onStorage);

    return () => { mounted = false; clearInterval(intervalId); window.removeEventListener('storage', onStorage); };
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Login Attempts</Typography>
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ height: 520, width: '100%', overflowY: 'auto' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={30}
                rowsPerPageOptions={[30, 50, 100]}
                initialState={{ sorting: { sortModel: [{ field: 'ts', sort: 'desc' }] } }}
                sx={{
                  '& .MuiDataGrid-virtualScroller': {
                    overflowY: 'auto !important',
                  },
                  '& .MuiDataGrid-viewport': {
                    overflowY: 'auto !important',
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
