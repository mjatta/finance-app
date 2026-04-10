import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useGetMemberDetails } from '../../../features/member/AccountEnquiries/hooks/useGetMemberDetails';

const defaultProfileImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="130" viewBox="0 0 180 130"><rect width="180" height="130" fill="#f1f5f9"/><circle cx="90" cy="48" r="18" fill="#cbd5e1"/><rect x="52" y="76" width="76" height="30" rx="15" fill="#cbd5e1"/></svg>',
)}`;

const formatProfileImage = (imageData) => {
  if (!imageData) return defaultProfileImage;
  if (imageData.startsWith('data:')) return imageData;
  return `data:image/jpeg;base64,${imageData}`;
};

export default function LoanDisbursement() {
  const [searchCustomerCode, setSearchCustomerCode] = useState('');
  const [memberDetails, setMemberDetails] = useState(null);
  const [error, setError] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [transactionDetails, setTransactionDetails] = useState({
    transactionType: '',
    transactionDate: '',
    bankName: '',
    bankAccount: '',
    amountDisbursed: '',
    topupAmount: '',
    checkNumber: '',
    checkDate: '',
    sendSms: false,
    fee: '',
  });
  const [appliedLoanDetails, setAppliedLoanDetails] = useState({
    paymentFrequency: '',
    grossInterest: '',
    totalAmount: '',
    economicSector: '',
    periodicPayment: '',
    totalDuration: '',
  });
  const [loanApplications, setLoanApplications] = useState([]);
  const { fetchMemberDetails, loading } = useGetMemberDetails();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchCustomerCode.trim()) {
      setError('Please enter a customer code');
      return;
    }

    setError('');
    setMemberDetails(null);
    setSelectedRows([]);

    try {
      const data = await fetchMemberDetails(searchCustomerCode.trim());
      if (data) {
        setMemberDetails(data);
        setError('');
      } else {
        setError('Customer not found');
        setMemberDetails(null);
      }
    } catch {
      setError('Failed to fetch customer details');
      setMemberDetails(null);
    }
  };

  const handleRowClick = useCallback((params) => {
    const loanId = params.id;
    if (selectedRows.includes(loanId)) {
      setSelectedRows([]);
    } else {
      setSelectedRows([loanId]);
    }
  }, [selectedRows]);

  const handleTransactionDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTransactionDetails((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAppliedLoanDetailsChange = (e) => {
    const { name, value } = e.target;
    setAppliedLoanDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleDisburseLoan = async () => {
    if (selectedRows.length === 0) {
      setError('Please select a loan application');
      return;
    }
    console.log('Disburse loan:', selectedRows[0]);
    // TODO: Implement API call to disburse loan
  };

  // Columns for loan applications table
  const columns = useMemo(() => [
    {
      field: 'CustomerCode',
      headerName: 'Customer Code',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'CustomerName',
      headerName: 'Customer Name',
      flex: 1,
      minWidth: 200,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'LoanAmount',
      headerName: 'Loan Amount',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'ApplicationDate',
      headerName: 'Application Date',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'CustomerAccountNumber',
      headerName: 'Customer Account Number',
      flex: 1,
      minWidth: 180,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'ContraAccount',
      headerName: 'Contra Account',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'PhoneNumber',
      headerName: 'Phone Number',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
  ], []);

  // Mock rows - placeholder data
  const rows = useMemo(() => {
    if (!memberDetails) return [];
    return [];
  }, [memberDetails]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#2c3e50', mb: 3 }}>
        Loan Disbursement
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' } }}>
        {/* Search Card */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
              Search Customer
            </Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 300 }}>
              <TextField
                label="Customer Code"
                value={searchCustomerCode}
                onChange={(e) => setSearchCustomerCode(e.target.value)}
                placeholder="Enter customer code"
                size="small"
                fullWidth
                disabled={loading}
              />
              <Button
                variant="contained"
                type="submit"
                startIcon={<SearchRoundedIcon />}
                fullWidth
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Contact Card - Profile Picture & Signature */}
        {memberDetails && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Contact
              </Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center' }}>
                {/* Profile Picture Column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Box
                    component="img"
                    src={formatProfileImage(memberDetails.MemberPicture)}
                    alt="Customer profile"
                    sx={{
                      width: 180,
                      height: 130,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      objectFit: 'cover',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Customer profile picture
                  </Typography>
                </Box>
                {/* Signature Column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={formatProfileImage(memberDetails.MemberSignature)}
                    alt="Customer signature"
                    sx={{
                      width: 180,
                      height: 130,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      objectFit: 'contain',
                      backgroundColor: '#fff',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Customer Signature
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Loan Applications Table - Full Width */}
      {memberDetails && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Loan Applications
              </Typography>
            </Box>
            <DataGrid
              rows={rows}
              columns={columns}
              density="compact"
              pageSizeOptions={[10, 25, 50]}
              onRowClick={handleRowClick}
              getRowClassName={(params) => {
                if (selectedRows.includes(params.id)) {
                  return 'selected-row';
                }
                return '';
              }}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                  borderRadius: 0,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  borderBottom: 'none',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  '&.selected-row': {
                    backgroundColor: '#bbdefb',
                    fontWeight: 500,
                  },
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:hover': {
                    backgroundColor: '#e9ecef',
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Card */}
      {memberDetails && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, fontSize: '0.95rem', color: '#2c3e50' }}>
              Transaction Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                select
                label="Transaction Type"
                name="transactionType"
                value={transactionDetails.transactionType}
                onChange={handleTransactionDetailsChange}
                size="small"
              >
                <MenuItem value="">Select transaction type</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="mobile_wallet">Mobile Wallet</MenuItem>
              </TextField>
              <TextField
                label="Transaction Date"
                name="transactionDate"
                type="date"
                value={transactionDetails.transactionDate}
                onChange={handleTransactionDetailsChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Bank Name"
                name="bankName"
                value={transactionDetails.bankName}
                onChange={handleTransactionDetailsChange}
                size="small"
                placeholder="Enter bank name"
              />
              <TextField
                label="Bank Account"
                name="bankAccount"
                value={transactionDetails.bankAccount}
                onChange={handleTransactionDetailsChange}
                size="small"
                placeholder="Enter bank account"
              />
              <TextField
                label="Amount Disbursed"
                name="amountDisbursed"
                value={transactionDetails.amountDisbursed}
                onChange={handleTransactionDetailsChange}
                size="small"
                placeholder="Enter amount disbursed"
              />
              <TextField
                label="Top up Amount"
                name="topupAmount"
                value={transactionDetails.topupAmount}
                onChange={handleTransactionDetailsChange}
                size="small"
                placeholder="Enter top up amount"
              />
              <TextField
                label="Check Number"
                name="checkNumber"
                value={transactionDetails.checkNumber}
                onChange={handleTransactionDetailsChange}
                size="small"
                placeholder="Enter check number"
              />
              <TextField
                label="Check Date"
                name="checkDate"
                type="date"
                value={transactionDetails.checkDate}
                onChange={handleTransactionDetailsChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fee"
                name="fee"
                value={transactionDetails.fee}
                onChange={handleTransactionDetailsChange}
                size="small"
                placeholder="Enter fee"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="sendSms"
                    checked={transactionDetails.sendSms}
                    onChange={handleTransactionDetailsChange}
                  />
                }
                label="Send SMS"
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Applied Loan Details Card */}
      {memberDetails && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, fontSize: '0.95rem', color: '#2c3e50' }}>
              Applied Loan Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                label="Payment Frequency"
                name="paymentFrequency"
                value={appliedLoanDetails.paymentFrequency}
                onChange={handleAppliedLoanDetailsChange}
                size="small"
                InputProps={{ readOnly: true }}
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Economic Sector"
                name="economicSector"
                value={appliedLoanDetails.economicSector}
                onChange={handleAppliedLoanDetailsChange}
                size="small"
                InputProps={{ readOnly: true }}
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Gross Interest"
                name="grossInterest"
                value={appliedLoanDetails.grossInterest}
                onChange={handleAppliedLoanDetailsChange}
                size="small"
                InputProps={{ readOnly: true }}
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Periodic Payment"
                name="periodicPayment"
                value={appliedLoanDetails.periodicPayment}
                onChange={handleAppliedLoanDetailsChange}
                size="small"
                InputProps={{ readOnly: true }}
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Total Amount"
                name="totalAmount"
                value={appliedLoanDetails.totalAmount}
                onChange={handleAppliedLoanDetailsChange}
                size="small"
                InputProps={{ readOnly: true }}
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Total Duration"
                name="totalDuration"
                value={appliedLoanDetails.totalDuration}
                onChange={handleAppliedLoanDetailsChange}
                size="small"
                InputProps={{ readOnly: true }}
                disabled
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {memberDetails && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleDisburseLoan}
            sx={{
              backgroundColor: '#667eea',
              '&:hover': { backgroundColor: '#5568d3' },
              fontWeight: 600,
              paddingX: 3,
              boxShadow: 'none',
              textTransform: 'none',
            }}
          >
            💰 Disburse Loan
          </Button>
        </Box>
      )}
    </Box>
  );
}
