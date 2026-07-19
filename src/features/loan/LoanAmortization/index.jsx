import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { useLoanAmortization } from './Hooks/useLoanAmortization';
import { useCheckAmortization } from './Hooks/useCheckAmortization';
import { useDisplayAmortization } from './Hooks/useDisplayAmortization';
import { useGenerateAmortization } from './Hooks/useGenerateAmortization';
import { notifySaveSuccess, notifySaveError } from '../../../utils/saveNotifications';

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
  const { fetchAmortization, loading, error } = useLoanAmortization();
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
          notifySaveSuccess({ page: 'Loan Amortization', action: 'Check Amortization', message: 'Amortization Confirmed' });
        } else {
          setPendingLoanIds((prev) => new Set(prev).add(String(loanId)));
          notifySaveSuccess({ page: 'Loan Amortization', action: 'Check Amortization', message: 'Amortization Pending' });
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
    <Box>
      <Card>
        <CardContent>
          {/* Header Section */}
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
              Loan Amortization
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95 }}>
              Amortization client list
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 3, color: '#2c3e50' }}>
            Active Loans
          </Typography>
          <Box
            sx={{
              width: '100%',
              borderRadius: 1.5,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              mb: 3,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <DataGrid
                rows={rows}
                columns={COLUMNS}
                getRowClassName={(params) => (amortizedLoanIds.has(String(params.row.loan_id)) ? 'amortized' : (pendingLoanIds.has(String(params.row.loan_id)) ? 'pending' : ''))}
                onRowClick={handleRowClick}
                loading={loading}
                pageSizeOptions={[5, 10, 25]}
                autoHeight={false}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#ffffff',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    backgroundColor: '#2c3e50',
                    borderBottom: '2px solid #1a252f',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    backgroundColor: '#f5f5f5',
                    borderTop: '1px solid #e0e0e0',
                    fontWeight: 500,
                  },
                  '& .MuiTablePagination-root': {
                    color: '#2c3e50',
                    fontWeight: 500,
                  },
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#fafafa',
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: '#ffffff',
                    },
                    '&:hover': {
                      backgroundColor: '#f0f0f0 !important',
                    },
                    '&.amortized': {
                      backgroundColor: '#e6ffed !important',
                    },
                    '&.pending': {
                      backgroundColor: '#fff7e6 !important',
                    },
                  },
                }}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                style={{ height: 520 }}
              />
              )}
          </Box>

            {/* Preview Calculated Amortization (always visible, empty on load) */}
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 3, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
                Preview Calculated Amortization
                {checkLoading ? <CircularProgress size={16} sx={{ ml: 1 }} /> : null}
              </Typography>
              <Box sx={{ width: '100%', borderRadius: 1.5, border: '1px solid #e0e0e0', overflow: 'hidden', mb: 3 }}>
                <DataGrid
                  rows={previewRows}
                  columns={PREVIEW_COLUMNS}
                  pageSizeOptions={[5, 10, 25]}
                  autoHeight={false}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' },
                    '& .MuiDataGrid-columnHeader': { backgroundColor: '#2c3e50', borderBottom: '2px solid #1a252f' },
                    '& .MuiDataGrid-footerContainer': { backgroundColor: '#f5f5f5', borderTop: '1px solid #e0e0e0', fontWeight: 500 },
                    '& .MuiTablePagination-root': { color: '#2c3e50', fontWeight: 500 },
                    '& .MuiDataGrid-row': { '&:nth-of-type(odd)': { backgroundColor: '#fafafa' }, '&:nth-of-type(even)': { backgroundColor: '#ffffff' } },
                    '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
                  }}
                  initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                  style={{ height: 420 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedLoanId || generateLoading}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                  onClick={async () => {
                    if (!selectedLoanId) return;
                    setGenerateLoading(true);
                    try {
                      const res = await generateAmortization(selectedLoanId);
                      if (res && (res.message === 'Amortization generated successfully' || (typeof res.message === 'string' && res.message.includes('already has amortization')))) {
                        // Treat both success and "already has amortization" as successful outcomes
                        notifySaveSuccess({ page: 'Loan Amortization', action: 'Generate Amortization', message: res.message || 'Amortization generated successfully.' });
                        setAmortizedLoanIds((prev) => new Set(prev).add(String(selectedLoanId)));
                        setPendingLoanIds((prev) => { const s = new Set(prev); s.delete(String(selectedLoanId)); return s; });
                        // refresh list
                        await load();
                      } else {
                        notifySaveError({ page: 'Loan Amortization', action: 'Generate Amortization', message: 'Failed to generate amortization.' });
                      }
                    } catch (err) {
                      console.error(err);
                      notifySaveError({ page: 'Loan Amortization', action: 'Generate Amortization', message: 'Failed to generate amortization.', error: err });
                    } finally {
                      setGenerateLoading(false);
                    }
                  }}
                >
                  {generateLoading ? <CircularProgress size={18} color="inherit" /> : 'Save Amortization'}
                </Button>
              </Box>
            </>

          {error ? <Typography color="error">{error}</Typography> : null}
        </CardContent>
      </Card>
    </Box>
  );
}

