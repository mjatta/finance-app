import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

export default function LoanSchedule() {
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const handleCustomerCodeChange = (e) => {
    const code = e.target.value;
    setCustomerCode(code);
    if (code.trim()) {
      // Reset customer name to trigger fresh fetch
      setCustomerName('');
    }
  };

  const handleCustomerCodeBlur = async () => {
    if (!customerCode.trim()) {
      setCustomerName('');
      return;
    }

    // Simulate fetching customer details
    // In production, this would call an API endpoint
    setIsLoadingCustomer(true);
    // Simulate fetching customer details
    // In production, this would call an API endpoint
    setCustomerName('Customer Name');
    setIsLoadingCustomer(false);
  };

  const handlePrint = () => {
    if (!customerCode.trim() || !accountNumber.trim()) {
      setStatusMessage('Please enter customer code and account number before printing.');
      return;
    }

    setStatusMessage('');
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Schedule
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Enter customer details to generate and print loan schedule.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {statusMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              label="Customer Code"
              value={customerCode}
              onChange={handleCustomerCodeChange}
              onBlur={handleCustomerCodeBlur}
              size="small"
              fullWidth
              placeholder="Enter customer code"
              disabled={isLoadingCustomer}
            />

            <TextField
              label="Customer Name"
              value={customerName}
              size="small"
              fullWidth
              disabled
              placeholder="Auto-filled after customer code"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              size="small"
              fullWidth
              placeholder="Enter account number"
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={!customerCode.trim() || !accountNumber.trim() || isLoadingCustomer}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Print
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
