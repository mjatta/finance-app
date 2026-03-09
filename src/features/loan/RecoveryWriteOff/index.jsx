import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import recoveryWriteOffData from '../../../data/loan-recovery-write-off.json';

export default function RecoveryWriteOff() {
  const rows = Array.isArray(recoveryWriteOffData?.rows) ? recoveryWriteOffData.rows : [];
  const [selectedId, setSelectedId] = useState(rows[0]?.id || null);
  const [writeOffDate, setWriteOffDate] = useState('');
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
    { label: 'Loan Amount to be Wriiten off', value: selectedRow?.loanAmountToBeWrittenOff || '0.00' },
  ];

  const handleConfirmWriteOff = () => {
    if (!selectedRow || !writeOffDate) {
      return;
    }

    setConfirmMessage(`Write-off confirmed for ${selectedRow.memberName} on ${writeOffDate}.`);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Loan Recovery &amp; Write-off
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
            Write-off Action
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <DatePicker
                label="Write-off Date"
                value={writeOffDate ? dayjs(writeOffDate) : null}
                onChange={(newValue) => {
                  setWriteOffDate(newValue ? newValue.format('YYYY-MM-DD') : '');
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
                onClick={handleConfirmWriteOff}
                disabled={!selectedRow || !writeOffDate}
              >
                Confirm Write-off
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
        <TableContainer sx={{ width: '100%', maxHeight: 460, overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Member Code</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Member Name</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Loan type</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Laon Amoount</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Approal Date</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Laon Account Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => {
                const isSelected = row.id === selectedId;

                return (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => setSelectedId(row.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'primary.50' : idx % 2 === 0 ? 'background.paper' : 'grey.50',
                      '& td': {
                        fontWeight: isSelected ? 700 : 500,
                      },
                    }}
                  >
                    <TableCell>{row.memberCode}</TableCell>
                    <TableCell>{row.memberName}</TableCell>
                    <TableCell>{row.loanType}</TableCell>
                    <TableCell>{row.loanAmount}</TableCell>
                    <TableCell>{row.approvalDate}</TableCell>
                    <TableCell>{row.loanAccountNumber}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
