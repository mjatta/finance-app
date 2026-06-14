import React, { useMemo, useState } from 'react';
import { Box, Card, CardContent, CircularProgress, Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { CURRENCY_SYMBOL, formatCurrency } from '../../../utils/currencyFormatter';
import { useActivateClients } from './hooks/useActivateClients';

export default function LoanActivate() {
  const { rows, isLoading, error } = useActivateClients();
  const [selectedId, setSelectedId] = useState(null);

  const normalizedRows = useMemo(
    () => rows.map((row) => ({
      id: row.LoanId,
      customerCode: row.CustCode || '',
      customerName: row.MemberName || '',
      loanType: row.LoanType || '',
      loanAmount: Number(row.PrincipalAmount ?? 0),
      approvalDate: row.IssuedDate || null,
      loanNumber: row.MemberAccount || '',
      initialPrincipal: Number(row.InitialPrincipal ?? row.PrincipalAmount ?? 0),
      grossInterest: Number(row.GrossInterest ?? 0),
      totalAmount: Number(row.TotalAmount ?? row.PrincipalAmount ?? 0),
      loanBalance: Number(row.LoanBalance ?? row.PrincipalAmount ?? 0),
      currentInterest: Number(row.CurrentInterest ?? 0),
      accruedInterest: Number(row.AccruedInterest ?? row.AccuredInterest ?? 0),
      totalOutstanding: Number(row.TotalOutstanding ?? row.PrincipalAmount ?? 0),
    })),
    [rows],
  );

  const selectedRow =
    normalizedRows.find((row) => row.id === selectedId) || normalizedRows[0] || null;

  const money = (value) => `${CURRENCY_SYMBOL} ${formatCurrency(Number(value || 0).toFixed(2))}`;

  const detailItems = [
    { label: 'Initial Principal', value: money(selectedRow?.initialPrincipal) },
    { label: 'Gross Interest', value: money(selectedRow?.grossInterest) },
    { label: 'Total Amount', value: money(selectedRow?.totalAmount) },
    { label: 'Loan Balance', value: money(selectedRow?.loanBalance) },
    { label: 'Current Interest', value: money(selectedRow?.currentInterest) },
    { label: 'Accured Interest', value: money(selectedRow?.accruedInterest) },
    { label: 'Total Oustanding', value: money(selectedRow?.totalOutstanding) },
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
          Loan Activate
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Process and manage loan activation for clients
        </Typography>
      </Box>

      <Paper sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <div style={{ height: 420, width: '100%' }}>
          <DataGrid
            rows={normalizedRows}
            columns={[
              { field: 'customerCode', headerName: 'Customer Code', flex: 1, minWidth: 130 },
              { field: 'customerName', headerName: 'Customer Name', flex: 1.4, minWidth: 180 },
              { field: 'loanType', headerName: 'Loan Type', flex: 1.1, minWidth: 150 },
              {
                field: 'loanAmount',
                headerName: 'Loan Amount',
                flex: 1,
                minWidth: 140,
                valueFormatter: (value) => money(value),
              },
              {
                field: 'approvalDate',
                headerName: 'Approval Date',
                flex: 1,
                minWidth: 130,
                valueFormatter: (value) => (value ? dayjs(value).format('YYYY-MM-DD') : ''),
              },
              { field: 'loanNumber', headerName: 'Loan Number', flex: 1.2, minWidth: 170 },
            ]}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            density="compact"
            loading={isLoading}
            onRowClick={(params) => setSelectedId(params.row.id)}
            getRowClassName={(params) => (params.row.id === selectedRow?.id ? 'selected-row' : '')}
            sx={{
              cursor: 'pointer',
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              },
              '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
              '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
              '& .selected-row': { backgroundColor: '#cfe2ff !important', fontWeight: 700 },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {error ? 'Failed to load Loan Activate clients.' : 'No records found.'}
                  </Typography>
                </Box>
              ),
              loadingOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={28} />
                </Box>
              ),
            }}
          />
        </div>
      </Paper>

      <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Loan Details
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {detailItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: 1.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  bgcolor: 'grey.50',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
