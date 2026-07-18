import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { useLoanAmortization } from './Hooks/useLoanAmortization';

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
  const { fetchAmortization, loading, error } = useLoanAmortization();

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
            Customer
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
                  },
                }}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                style={{ height: 520 }}
              />
            )}
          </Box>

          {error ? <Typography color="error">{error}</Typography> : null}
        </CardContent>
      </Card>
    </Box>
  );
}

