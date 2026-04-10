import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
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

export default function LoanGuarantor() {
  const [searchMemberCode, setSearchMemberCode] = useState('');
  const [memberDetails, setMemberDetails] = useState(null);
  const [error, setError] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [guarantorFormData, setGuarantorFormData] = useState({
    guarantorId: '',
    savingBalance: '',
    amountToGuarantee: '',
    guarantorName: '',
    collateralValue: '',
    loanBalance: '',
    guaranteeDate: '',
    totalGuaranteed: '',
    guarantorRequired: '',
  });
  const [guarantorRows, setGuarantorRows] = useState([]);
  const { fetchMemberDetails, loading } = useGetMemberDetails();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchMemberCode.trim()) {
      setError('Please enter a member code');
      return;
    }

    setError('');
    setMemberDetails(null);
    setSelectedRows([]);

    try {
      const data = await fetchMemberDetails(searchMemberCode.trim());
      if (data) {
        setMemberDetails(data);
        setError('');
      } else {
        setError('Member not found');
        setMemberDetails(null);
      }
    } catch {
      setError('Failed to fetch member details');
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

  const handleGuarantorFormChange = (e) => {
    const { name, value } = e.target;
    setGuarantorFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuarantorIdBlur = async () => {
    // This would typically fetch guarantor data from an API
    // For now, it's a placeholder
    if (guarantorFormData.guarantorId.trim()) {
      // TODO: Fetch guarantor details and auto-fill other fields
      console.log('Fetch guarantor details for ID:', guarantorFormData.guarantorId);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedRows.length === 0) {
      setError('Please select a loan application');
      return;
    }
    // Confirmed selection - populate or process the selected loan
    const selectedLoanId = selectedRows[0];
    console.log('Confirmed selection of loan ID:', selectedLoanId);
    // TODO: Populate guarantor details form with selected loan data
    setError('');
  };

  // Columns for loan details table
  const columns = useMemo(() => [
    {
      field: 'CustomerCode',
      headerName: 'Customer Code',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'MemberName',
      headerName: 'Member Name',
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
  ], []);

  // Mock rows - placeholder data
  const rows = useMemo(() => {
    if (!memberDetails) return [];
    // This would be populated with actual loan data from an API
    return [];
  }, [memberDetails]);

  // Columns for guarantee table
  const guaranteeColumns = useMemo(() => [
    {
      field: 'GuarantorId',
      headerName: 'Guarantor ID',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'GuarantorName',
      headerName: 'Guarantor Name',
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
      field: 'AmountGuarantor',
      headerName: 'Amount Guarantor',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'GuaranteeDate',
      headerName: 'Guarantee Date',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
  ], []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#2c3e50', mb: 3 }}>
        Loan Guarantor
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
              Search Guarantor
            </Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 300 }}>
              <TextField
                label="Customer Code"
                value={searchMemberCode}
                onChange={(e) => setSearchMemberCode(e.target.value)}
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
                    alt="Member profile"
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
                    Member profile picture
                  </Typography>
                </Box>
                {/* Signature Column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={formatProfileImage(memberDetails.MemberSignature)}
                    alt="Member signature"
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
                    Member Signature
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Loan Details Table - Full Width */}
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

      {/* Confirm Selection Button */}
      {memberDetails && selectedRows.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleConfirmSelection}
            sx={{
              backgroundColor: '#667eea',
              '&:hover': { backgroundColor: '#5568d3' },
              fontWeight: 600,
              paddingX: 3,
              boxShadow: 'none',
              textTransform: 'none',
            }}
          >
            ✓ Confirm Selection
          </Button>
        </Box>
      )}

      {/* Guarantor Details Card */}
      {memberDetails && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, fontSize: '0.95rem', color: '#2c3e50' }}>
              Guarantor Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                label="Guarantor ID"
                name="guarantorId"
                value={guarantorFormData.guarantorId}
                onChange={handleGuarantorFormChange}
                onBlur={handleGuarantorIdBlur}
                size="small"
                placeholder="Enter guarantor ID"
              />
              <TextField
                label="Saving Balance"
                name="savingBalance"
                value={guarantorFormData.savingBalance}
                InputProps={{ readOnly: true }}
                disabled
                size="small"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Amount to Guarantee"
                name="amountToGuarantee"
                value={guarantorFormData.amountToGuarantee}
                onChange={handleGuarantorFormChange}
                size="small"
                placeholder="Enter amount"
              />
              <TextField
                label="Guarantor Name"
                name="guarantorName"
                value={guarantorFormData.guarantorName}
                InputProps={{ readOnly: true }}
                disabled
                size="small"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Collateral Value"
                name="collateralValue"
                value={guarantorFormData.collateralValue}
                InputProps={{ readOnly: true }}
                disabled
                size="small"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Loan Balance"
                name="loanBalance"
                value={guarantorFormData.loanBalance}
                InputProps={{ readOnly: true }}
                disabled
                size="small"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Guarantee Date"
                name="guaranteeDate"
                type="date"
                value={guarantorFormData.guaranteeDate}
                onChange={handleGuarantorFormChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Total Guaranteed"
                name="totalGuaranteed"
                value={guarantorFormData.totalGuaranteed}
                InputProps={{ readOnly: true }}
                disabled
                size="small"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                  },
                }}
              />
              <TextField
                label="Guarantor Required"
                name="guarantorRequired"
                value={guarantorFormData.guarantorRequired}
                InputProps={{ readOnly: true }}
                disabled
                size="small"
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

      {/* Guarantee Table */}
      {memberDetails && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mt: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Guarantee
              </Typography>
            </Box>
            <DataGrid
              rows={guarantorRows}
              columns={guaranteeColumns}
              density="compact"
              pageSizeOptions={[10, 25, 50]}
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
    </Box>
  );
}
