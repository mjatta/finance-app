import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Box, Typography, Card, CardContent, CircularProgress, Button, Paper, Skeleton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { useLoanAmortization } from './Hooks/useLoanAmortization';
import { useCheckAmortization } from './Hooks/useCheckAmortization';
import { useDisplayAmortization } from './Hooks/useDisplayAmortization';
import { useGenerateAmortization } from './Hooks/useGenerateAmortization';

const COLUMNS = [
  { field: 'loan_id', headerName: 'Loan Id', flex: 0.6, minWidth: 100 },
  { field: 'membername', headerName: 'Member Name', flex: 1.5, minWidth: 180 },
  { field: 'loanamt', headerName: 'Principal', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (params) => formatCurrency(params.value || 0) },
  { field: 'loan_interest', headerName: 'Interest rate', flex: 0.7, minWidth: 110, align: 'center', headerAlign: 'center', renderCell: (p) => `${p.value ?? 0}%` },
  { field: 'loandur', headerName: 'Duration', flex: 0.6, minWidth: 100, align: 'center', headerAlign: 'center' },
  { field: 'totinterest', headerName: 'Total Interest', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
  { field: 'grossTotal', headerName: 'Gross Total', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
];

export default function LoanAmortization() {
  const [rows, setRows] = useState([]);
  const [amortizedLoanIds, setAmortizedLoanIds] = useState(new Set());
  const [previewRows, setPreviewRows] = useState([]);
  const [pendingLoanIds, setPendingLoanIds] = useState(new Set());
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const { fetchAmortization, loading } = useLoanAmortization();
  const { checkAmortization } = useCheckAmortization();
  const { displayAmortization } = useDisplayAmortization();
  const { generateAmortization } = useGenerateAmortization();

  const load = useCallback(async () => {
    const data = await fetchAmortization(1, 30);
    // Expecting an array of loan objects
    if (Array.isArray(data)) {
      const mapped = data.map((item, idx) => ({
        id: `${item.loan_id}-${idx}`,
        loan_id: item.loan_id,
        membername: item.membername || '',
        loanamt: item.loanamt || 0,
        loan_interest: item.loan_interest || 0,
        loandur: item.loandur || 0,
        totinterest: item.totinterest || 0,
        grossTotal: (Number(item.loanamt || 0) + Number(item.totinterest || 0)),
      }));
      setRows(mapped);
    } else if (data && Array.isArray(data.Data)) {
      const mapped = data.Data.map((item, idx) => ({
        id: `${item.loan_id || idx}-${idx}`,
        loan_id: item.loan_id,
        membername: item.membername || '',
        loanamt: item.loanamt || 0,
        loan_interest: item.loan_interest || 0,
        loandur: item.loandur || 0,
        totinterest: item.totinterest || 0,
        grossTotal: (Number(item.loanamt || 0) + Number(item.totinterest || 0)),
      }));
      setRows(mapped);
    } else {
      setRows([]);
    }
  }, [fetchAmortization]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await load();
    })();
    return () => { mounted = false; };
  }, [load]);

  const handleRowClick = async (params) => {
    const loanId = params?.row?.loan_id;
    if (!loanId) return;
    setSelectedLoanId(loanId);
    setCheckLoading(true);
    try {
      const check = await checkAmortization(loanId);
        if (check && check.message === 'This loan already has amortization') {
          setAmortizedLoanIds((prev) => new Set(prev).add(String(loanId)));
          setPendingLoanIds((prev) => { const s = new Set(prev); s.delete(String(loanId)); return s; });
          setAlertMessage('✓ Amortization Confirmed');
          setAlertSeverity('success');
          setAlertOpen(true);
        } else {
          setPendingLoanIds((prev) => new Set(prev).add(String(loanId)));
          setAlertMessage('⏳ Loan Pending - Amortization Not Yet Generated');
          setAlertSeverity('warning');
          setAlertOpen(true);
        }

      const disp = await displayAmortization(loanId);
      const schedule = disp?.Schedule || disp?.schedule || disp?.data?.Schedule || [];
      if (Array.isArray(schedule)) {
        const mapped = schedule.map((s, idx) => ({
          id: `${loanId}-sch-${idx}`,
          duedate: s.duedate,
          npayment: s.npayment,
          nprinpay: s.nprinpay,
          nintpay: s.nintpay,
          begbal: s.begbal,
          endbal: s.namount ?? s.endbal,
          cumInt: s.cumInt,
          dperiod: s.dperiod,
        }));
        setPreviewRows(mapped);
      } else {
        setPreviewRows([]);
      }
    } catch (err) {
      console.error('Error loading amortization preview', err);
    } finally {
      setCheckLoading(false);
    }
  };

  const PREVIEW_COLUMNS = [
    { field: 'duedate', headerName: 'Due Date', flex: 1, minWidth: 140, renderCell: (p) => p.value ? new Date(p.value).toISOString().slice(0,10) : '' },
    { field: 'npayment', headerName: 'Periodic Payment', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'nprinpay', headerName: 'Prinicipal Payment', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'nintpay', headerName: 'Interest Payment', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'begbal', headerName: 'Begining Balance', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'endbal', headerName: 'End Balance', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'cumInt', headerName: 'Cumulative Interest', flex: 1, minWidth: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'dperiod', headerName: 'Period', flex: 0.5, minWidth: 80, align: 'center', headerAlign: 'center' },
  ];

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
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Amortization
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Amortization client list and schedule
        </Typography>
      </Box>

      {alertOpen && (
        <Alert
          severity={alertSeverity}
          onClose={() => setAlertOpen(false)}
          sx={{ mb: 3, borderRadius: 1.5, fontSize: '0.95rem', fontWeight: 500 }}
        >
          {alertMessage}
        </Alert>
      )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
              Active Loans
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={load}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </Button>
          </Box>
          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <div style={{ height: 420, width: '100%' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DataGrid
                  rows={rows}
                  columns={COLUMNS}
                  getRowClassName={(params) => (amortizedLoanIds.has(String(params.row.loan_id)) ? 'amortized' : (pendingLoanIds.has(String(params.row.loan_id)) ? 'pending' : ''))}
                  onRowClick={handleRowClick}
                  loading={loading}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                  density="compact"
                  sx={{
                    border: 'none',
                    cursor: 'pointer',
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 700,
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 700,
                    },
                    '& .MuiDataGrid-row:nth-of-type(even)': {
                      backgroundColor: '#f8f9fa',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#e9ecef !important',
                    },
                    '& .MuiDataGrid-cell': {
                      borderColor: '#dee2e6',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      backgroundColor: '#f5f5f5',
                      borderTop: '1px solid #dee2e6',
                      fontWeight: 500,
                    },
                    '& .amortized': {
                      backgroundColor: '#d4edda !important',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#c3e6cb !important',
                      },
                    },
                    '& .pending': {
                      backgroundColor: '#fff3cd !important',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#ffe69c !important',
                      },
                    },
                  }}
                  slots={{
                    noRowsOverlay: () => (
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          No records found.
                        </Typography>
                      </Box>
                    ),
                  }}
                />
              )}
            </div>
          </Paper>

            {/* Preview Calculated Amortization (always visible, empty on load) */}
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 3, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
                Preview Calculated Amortization
                {checkLoading ? <CircularProgress size={16} sx={{ ml: 1 }} /> : null}
              </Typography>
              <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
                <div style={{ height: 420, width: '100%' }}>
                  {checkLoading ? (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <Skeleton key={idx} variant="rounded" height={40} />
                      ))}
                    </Box>
                  ) : (
                    <DataGrid
                      rows={previewRows}
                      columns={PREVIEW_COLUMNS}
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                      density="compact"
                      sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeader': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 700,
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                          fontWeight: 700,
                        },
                        '& .MuiDataGrid-row:nth-of-type(even)': {
                          backgroundColor: '#f8f9fa',
                        },
                        '& .MuiDataGrid-row:hover': {
                          backgroundColor: '#e9ecef !important',
                        },
                        '& .MuiDataGrid-cell': {
                          borderColor: '#dee2e6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                        '& .MuiDataGrid-footerContainer': {
                          backgroundColor: '#f5f5f5',
                          borderTop: '1px solid #dee2e6',
                          fontWeight: 500,
                        },
                      }}
                      slots={{
                        noRowsOverlay: () => (
                          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography variant="body2" color="text.secondary">
                              Select a loan to preview amortization.
                            </Typography>
                          </Box>
                        ),
                      }}
                    />
                  )}
                </div>
              </Paper>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedLoanId || generateLoading}
                  sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, fontWeight: 600, backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, boxShadow: 'none' }}
                  onClick={async () => {
                    if (!selectedLoanId) return;
                    setGenerateLoading(true);
                    try {
                      const res = await generateAmortization(selectedLoanId);
                      if (res && (res.message === 'Amortization generated successfully' || (typeof res.message === 'string' && res.message.includes('already has amortization')))) {
                        // Treat both success and "already has amortization" as successful outcomes
                        setAlertMessage('✓ ' + (res.message || 'Amortization generated successfully.'));
                        setAlertSeverity('success');
                        setAlertOpen(true);
                        setAmortizedLoanIds((prev) => new Set(prev).add(String(selectedLoanId)));
                        setPendingLoanIds((prev) => { const s = new Set(prev); s.delete(String(selectedLoanId)); return s; });
                        // refresh list
                        await load();
                      } else {
                        setAlertMessage('Failed to generate amortization.');
                        setAlertSeverity('error');
                        setAlertOpen(true);
                      }
                    } catch (err) {
                      console.error(err);
                      setAlertMessage('Failed to generate amortization.');
                      setAlertSeverity('error');
                      setAlertOpen(true);
                    } finally {
                      setGenerateLoading(false);
                    }
                  }}
                >
                  {generateLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
                      Processing...
                    </>
                  ) : (
                    '✓ Save Amortization'
                  )}
                </Button>
              </Box>
            </>
    </Box>
  );
}

