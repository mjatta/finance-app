import React, { useState } from 'react';
import { Box, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TRANSACTION_TYPES = [
  { value: 'reversal', label: 'Transaction Reversal' },
  { value: 'adjustment', label: 'Transaction Adjustment' },
];

const ADJUST_BY_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'voucher', label: 'Voucher' },
];

export default function TransactionReversalAdjustment() {
  const [transactionType, setTransactionType] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => dayjs());
  const [adjustBy, setAdjustBy] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [voucherNo, setVoucherNo] = useState('');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Transaction Reversal / Adjustment
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Reverse or adjust transactions by customer or voucher.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Transaction Type"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">-- select --</MenuItem>
              {TRANSACTION_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Transaction Date"
              value={transactionDate}
              onChange={(v) => setTransactionDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Adjust By"
              value={adjustBy}
              onChange={(e) => setAdjustBy(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">-- select --</MenuItem>
              {ADJUST_BY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Box>

          {adjustBy === 'customer' && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
              <TextField
                label="Customer Code"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                size="small"
                fullWidth
                placeholder="Enter or search customer code"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Customer Name:
                </Typography>
                <Typography variant="body2">{customerName ? String(customerName).trim() : 'N/A'}</Typography>
              </Box>
            </Box>
          )}

          {adjustBy === 'voucher' && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
              <TextField
                label="Voucher Number"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                size="small"
                fullWidth
                placeholder="Enter voucher number"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
