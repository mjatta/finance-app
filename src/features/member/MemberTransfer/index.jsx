import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function MemberTransfer({ user }) {
  const initialForm = {
    transactionType: 'member-transfer',
    fromPostingAccount: '',
    fromAccountNumber: '',
    fromAccountBalance: '',
    transactionDate: '',
    phoneNumber: '',
    amount: '',
    comments: '',
    sendSms: false,
    feeAccount: '',
    toPostingAccount: '',
    toAccountNumber: '',
    toAccountBalance: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [saveMessage, setSaveMessage] = useState('');

  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  const formatAmount = (value) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);

  const summaryValues = useMemo(() => {
    const loanBalance = Number(String(formData.fromAccountBalance || '').replace(/,/g, '')) || 0;
    const calculatedInterest = 0;
    const accruedInterest = 0;

    return {
      loanBalance,
      calculatedInterest,
      accruedInterest,
    };
  }, [formData.fromAccountBalance]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSaveMessage('');

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReadOnlyRole) {
      return;
    }

    const transferLabel = formData.transactionType === 'account-transfer' ? 'Account transfer' : 'Member transfer';

    try {
      setSaveMessage(`${transferLabel} saved successfully.`);
      setFormData(initialForm);
      notifySaveSuccess({
        page: 'Member Administration / Member Transfer',
        action: `Save ${transferLabel}`,
        message: `${transferLabel} saved successfully.`,
      });
    } catch (error) {
      const failedMessage = `Failed to save ${transferLabel.toLowerCase()}.`;
      setSaveMessage(failedMessage);
      notifySaveError({
        page: 'Member Administration / Member Transfer',
        action: `Save ${transferLabel}`,
        message: failedMessage,
        error,
      });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Member Transfer
      </Typography>

      <Box
        sx={{
          mb: 2,
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Loan Balance
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(summaryValues.loanBalance)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Calculated Interest
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(summaryValues.calculatedInterest)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Accrued Interest
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(summaryValues.accruedInterest)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view this page, but cannot save member transfers.
        </Typography>
      )}

      {saveMessage && (
        <Typography variant="body2" color="success.main" sx={{ mb: 2, fontWeight: 700 }}>
          {saveMessage}
        </Typography>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          component="fieldset"
          disabled={isReadOnlyRole}
          sx={{ border: 'none', p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1, pointerEvents: isReadOnlyRole ? 'none' : 'auto' }}
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                  Transaction
                </Typography>
                <TextField
                  select
                  label="Transfer Type"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  sx={{ width: { xs: '100%', md: 300 } }}
                >
                  <MenuItem value="account-transfer">Account Transfer</MenuItem>
                  <MenuItem value="member-transfer">Member Transfer</MenuItem>
                </TextField>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                  Transfer From
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    label="Posting Account"
                    name="fromPostingAccount"
                    value={formData.fromPostingAccount}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  >
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="shares">Shares</MenuItem>
                    <MenuItem value="deposits">Deposits</MenuItem>
                  </TextField>

                  <TextField
                    label="Account Number"
                    name="fromAccountNumber"
                    value={formData.fromAccountNumber}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />

                  <TextField
                    label="Account Balance"
                    name="fromAccountBalance"
                    value={formData.fromAccountBalance}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />

                  <DatePicker
                    label="Transaction Date"
                    value={formData.transactionDate ? dayjs(formData.transactionDate) : null}
                    onChange={(newValue) => {
                      setFormData((prev) => ({
                        ...prev,
                        transactionDate: newValue ? newValue.format('YYYY-MM-DD') : '',
                      }));
                    }}
                    slotProps={{
                      textField: {
                        sx: { flex: '1 1 220px', minWidth: 220 },
                      },
                    }}
                  />

                  <TextField
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />

                  <TextField
                    label="Amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />

                  <TextField
                    label="Comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    sx={{ flex: '1 1 100%', minWidth: 320 }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                  Transfer To
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ width: '100%' }}>
                    <FormControlLabel
                      control={<Checkbox name="sendSms" checked={formData.sendSms} onChange={handleChange} />}
                      label="Check to Send SMS"
                    />
                  </FormControl>

                  <TextField
                    label="Fee Account"
                    name="feeAccount"
                    value={formData.feeAccount}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />

                  <TextField
                    select
                    label="Posting Account"
                    name="toPostingAccount"
                    value={formData.toPostingAccount}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  >
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="shares">Shares</MenuItem>
                    <MenuItem value="deposits">Deposits</MenuItem>
                  </TextField>

                  <TextField
                    label="Account Number"
                    name="toAccountNumber"
                    value={formData.toAccountNumber}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />

                  <TextField
                    label="Account Balance"
                    name="toAccountBalance"
                    value={formData.toAccountBalance}
                    onChange={handleChange}
                    sx={{ flex: '1 1 220px', minWidth: 220 }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Button variant="contained" color="primary" type="submit">
              Save
            </Button>
          </Box>
        </Box>
      </LocalizationProvider>
    </Box>
  );
}
