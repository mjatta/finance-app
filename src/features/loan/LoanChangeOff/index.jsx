import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import loanChangeOffData from '../../../data/loan-change-off.json';

export default function LoanChangeOff() {
  const rows = Array.isArray(loanChangeOffData?.rows) ? loanChangeOffData.rows : [];
  const [selectedId, setSelectedId] = useState(rows[0]?.id || null);
  const [chargeOffDate, setChargeOffDate] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const selectedRow = rows.find((row) => row.id === selectedId) || rows[0] || null;

  const detailItems = [
    { label: 'initial prinicipal', value: selectedRow?.initialPrincipal || '0.00' },
    { label: 'loan Balance', value: selectedRow?.loanBalance || '0.00' },
    { label: 'gross interset', value: selectedRow?.grossInterest || '0.00' },
    { label: 'total amountm', value: selectedRow?.totalAmount || '0.00' },
    { label: 'current intertert', value: selectedRow?.currentInterest || '0.00' },
    { label: 'accured interesr', value: selectedRow?.accruedInterest || '0.00' },
    { label: 'total Oustanding', value: selectedRow?.totalOutstanding || '0.00' },
  ];

  const handleConfirmChargeOff = () => {
    if (!selectedRow || !chargeOffDate) {
      return;
    }

    setConfirmMessage(`Charge off confirmed for ${selectedRow.memberName} on ${chargeOffDate}.`);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Loan Change off
      </Typography>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
                md: 'repeat(3, minmax(0, 1fr))',
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
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}
                >
                  {item.label}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.4, fontWeight: 700 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Charge Off Action
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <DatePicker
                label="Charge Off Date"
                value={chargeOffDate ? dayjs(chargeOffDate) : null}
                onChange={(newValue) => {
                  setChargeOffDate(newValue ? newValue.format('YYYY-MM-DD') : '');
                  setConfirmMessage('');
                }}
                slotProps={{
                  textField: {
                    sx: { minWidth: 220 },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleConfirmChargeOff}
                disabled={!selectedRow || !chargeOffDate}
              >
                Confirm Charge Off
              </Button>
            </Box>
          </LocalizationProvider>
          {confirmMessage && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1.5, fontWeight: 700 }}>
              {confirmMessage}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <DataGrid
          rows={rows.map((row) => ({ ...row }))}
          columns={[
            { field: 'memberCode', headerName: 'Member Code', flex: 1, minWidth: 120 },
            { field: 'memberName', headerName: 'Member Name', flex: 1.2, minWidth: 140 },
            { field: 'loanType', headerName: 'Loan Type', flex: 1, minWidth: 110 },
            { field: 'loanAmount', headerName: 'Loan Amount', flex: 1, minWidth: 110 },
            { field: 'approvalDate', headerName: 'Approval Date', flex: 1, minWidth: 120 },
            { field: 'loanAccountNumber', headerName: 'Loan Account Number', flex: 1.2, minWidth: 150 },
          ]}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          density="compact"
          onRowClick={(params) => setSelectedId(params.row.id)}
          getRowClassName={(params) => params.row.id === selectedId ? 'selected-row' : ''}
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
        />
      </Paper>
    </Box>
  );
}
