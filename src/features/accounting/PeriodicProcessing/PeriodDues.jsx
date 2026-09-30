import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import useGetPeriodicDues from './hooks/useGetPeriodicDues';

export default function PeriodDues() {
  const { fetchPeriodicDues, loading } = useGetPeriodicDues();
  const [rows, setRows] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
  const [runDate, setRunDate] = useState(dayjs());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetchPeriodicDues();
      if (!mounted) return;
      if (!res.success) {
        setStatusMessage(res.error || 'Failed to load periodic dues');
        setRows([]);
        return;
      }
      const data = res.data || [];
      // Add id field if missing for DataGrid
      const dataWithIds = data.map((r, idx) => ({
        id: r.id || idx,
        ...r,
      }));
      setRows(dataWithIds);
      setStatusMessage('');
    })();
    return () => { mounted = false };
  }, [fetchPeriodicDues]);

  const handleRunProcess = async () => {
    if (!runDate) {
      setStatusMessage('Please select a run date');
      return;
    }

    const selectedId = Array.from(rowSelectionModel?.ids || [])[0];
    if (!selectedId) {
      setStatusMessage('Please select a periodic due entry to process');
      return;
    }

    setProcessing(true);
    setStatusMessage('');

    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await fetch('/api/periodic-dues/run-process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ dueId: selectedId, runDate: runDate.format('YYYY-MM-DD') })
      // });
      
      setStatusMessage(`Process initiated for ${runDate.format('YYYY-MM-DD')}`);
    } catch (err) {
      setStatusMessage(`Error: ${err.message || 'Failed to run process'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Periodic Dues</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>View and manage periodic subscription dues</Typography>
        </CardContent>
      </Card>

      {statusMessage && (
        <Alert
          severity="error"
          onClose={() => setStatusMessage('')}
          sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.95rem', fontWeight: 500 }}
        >
          {statusMessage}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Periodic Dues List</Typography>
          </Box>
          <Box sx={{ width: '100%', minHeight: 400 }}>
            {loading ? (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={rows}
                columns={[
                  { field: 'SubscriptionDescription', headerName: 'Subscription Description', flex: 1.5, minWidth: 180, align: 'center', headerAlign: 'center' },
                  { field: 'PaymentFrequency', headerName: 'Payment Frequency', flex: 1, minWidth: 130, align: 'center', headerAlign: 'center' },
                  { field: 'ProcessingFrequency', headerName: 'Processing Frequency', flex: 1, minWidth: 140, align: 'center', headerAlign: 'center' },
                  { 
                    field: 'Amount', 
                    headerName: 'Amount', 
                    flex: 0.9, 
                    minWidth: 120, 
                    align: 'right', 
                    headerAlign: 'center',
                    renderCell: (params) => Number(params.value || 0).toFixed(2),
                  },
                ]}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                checkboxSelection
                disableMultipleRowSelection
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
                density="compact"
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'end' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            </LocalizationProvider>
            <Button
              variant="contained"
              onClick={handleRunProcess}
              disabled={processing}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
              }}
            >
              {processing ? 'Processing...' : 'Run Process'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
