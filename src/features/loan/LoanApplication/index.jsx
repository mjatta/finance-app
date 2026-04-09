import React, { useEffect, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useAuthStore } from '../../../store/authStore';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useLoanProducts } from './hooks/useLoanProducts';
import { useNewLoanDetails } from './hooks/useNewLoanDetails';
import { useLoanTopup } from './hooks/useLoanTopup';
import { useLoanSetupDetails } from './hooks/useLoanSetupDetails';

const todayIso = new Date().toISOString().split('T')[0];

const defaultProfileImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="130" viewBox="0 0 180 130"><rect width="180" height="130" fill="#f1f5f9"/><circle cx="90" cy="48" r="18" fill="#cbd5e1"/><rect x="52" y="76" width="76" height="30" rx="15" fill="#cbd5e1"/></svg>',
)}`;

const formatProfileImage = (imageData) => {
  if (!imageData) return defaultProfileImage;
  if (imageData.startsWith('data:')) return imageData;
  return `data:image/jpeg;base64,${imageData}`;
};

const interestMethods = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'reducing', label: 'Reducing Balance' },
  { value: 'compound', label: 'Compound Interest' },
];

const yearlyFrequencies = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Semi-Annually' },
  { value: '4', label: 'Quarterly' },
  { value: '12', label: 'Monthly' },
  { value: '24', label: 'Bi-Monthly' },
  { value: '52', label: 'Weekly' },
];

const transactionTypes = [
  { value: 'new', label: 'New Loan Details' },
  { value: 'topup_reschedule', label: 'Top-up or Reschedule Loans' },
  { value: 'topup_details', label: 'Loans Top up Details' },
];

const economicSectors = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'trade', label: 'Trade & Commerce' },
  { value: 'services', label: 'Services' },
  { value: 'construction', label: 'Construction' },
  { value: 'transport', label: 'Transport' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

export default function LoanApplication() {
  const user = useAuthStore((state) => state.user);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loanProducts, setLoanProducts] = useState([]);
  const [searchMemberCode, setSearchMemberCode] = useState('');
  const [transactionTypeData, setTransactionTypeData] = useState(null);
  const [loadingTxType, setLoadingTxType] = useState(false);

  const { fetchMemberDetails, loading: loadingMember } = useGetMemberDetails();
  const { fetchLoanProducts, loading: loadingProducts } = useLoanProducts();
  const { fetchNewLoanDetails } = useNewLoanDetails();
  const { fetchLoanTopup } = useLoanTopup();
  const { fetchLoanSetupDetails } = useLoanSetupDetails();

  const [sourceFundsOptions, setSourceFundsOptions] = useState([]);

  const [formData, setFormData] = useState({
    memberCode: '',
    memberName: '',
    transactionType: '',
    currentLoanBalance: '',
    loanProduct: '',
    principalAmount: '',
    interestMethod: '',
    interestRate: '',
    yearlyFrequency: '',
    loanDuration: '',
    gracePeriod: '',
    savingBalance: '',
    economicSector: '',
    startDate: todayIso,
    loanLimit: '',
    purposeOfLoan: '',
    sourceOfFunds: '',
    guarantorSourceOfFunds: '',
    gracePeriodInterest: '',
  });

  // Fetch loan products on mount
  useEffect(() => {
    const loadProducts = async () => {
      const products = await fetchLoanProducts();
      if (products) {
        setLoanProducts(products);
      }
    };
    loadProducts();
  }, []);

  // Fetch loan setup details (source of funds) on mount
  useEffect(() => {
    const loadSetupDetails = async () => {
      const response = await fetchLoanSetupDetails();
      if (response && response.data && response.data.sourceOfFunds) {
        // Map the source of funds to dropdown options
        const funds = response.data.sourceOfFunds.map((item) => ({
          value: item.sou_id,
          label: item.sou_name.trim(),
        }));
        setSourceFundsOptions(funds);
      }
    };
    loadSetupDetails();
  }, []);

  // When transaction type changes, fetch relevant data
  useEffect(() => {
    if (formData.transactionType) {
      handleTransactionTypeChange(formData.transactionType, formData.loanProduct);
    }
  }, [formData.transactionType]);

  // When loan product changes and transaction type needs product details, fetch them
  useEffect(() => {
    if (formData.loanProduct && (formData.transactionType === 'new' || formData.transactionType === 'topup_details')) {
      fetchLoanProductDetails(formData.loanProduct, formData.transactionType === 'new' ? 'new' : 'topup');
    }
  }, [formData.loanProduct, formData.transactionType]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchMemberCode.trim()) {
      setStatusMessage('Please enter a member code');
      setStatusError(true);
      return;
    }

    setStatusMessage('');
    setStatusError(false);
    setIsLoadingMember(true);
    setMemberDetails(null);

    try {
      const data = await fetchMemberDetails(searchMemberCode.trim());
      if (data) {
        setMemberDetails(data);

        // Parse member name from first account's AccountName
        let memberName = '';
        if (data.Accounts && data.Accounts.length > 0) {
          const accountName = data.Accounts[0].AccountName || '';
          const parts = accountName.split('<<');
          memberName = parts[0].trim();
        }

        setFormData((prev) => ({
          ...prev,
          memberCode: searchMemberCode.trim(),
          memberName: memberName || data.MemberName || '',
          currentLoanBalance: data.LoanBalance || '',
          savingBalance: data.SavingBalance || '',
          loanLimit: data.LoanLimit || '',
        }));
      } else {
        setStatusMessage('Member not found');
        setStatusError(true);
      }
    } catch {
      setStatusMessage('Failed to fetch member details');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchLoanProductDetails = async (prdId, loanType = 'new') => {
    setLoadingTxType(true);
    try {
      const data = await fetchNewLoanDetails(prdId, loanType);
      if (data) setTransactionTypeData(data);
    } catch {
      setStatusMessage('Failed to fetch loan details');
      setStatusError(true);
    } finally {
      setLoadingTxType(false);
    }
  };

  const handleTransactionTypeChange = async (txType, loanProduct) => {
    setTransactionTypeData(null);
    setLoadingTxType(true);
    try {
      if (txType === 'new') {
        if (loanProduct) {
          const data = await fetchNewLoanDetails(loanProduct, 'new');
          if (data) setTransactionTypeData(data);
        }
      } else if (txType === 'topup_reschedule') {
        const data = await fetchLoanTopup(user?.CompId, formData.memberCode);
        if (data) setTransactionTypeData(data);
      } else if (txType === 'topup_details') {
        if (loanProduct) {
          const data = await fetchNewLoanDetails(loanProduct, 'topup');
          if (data) setTransactionTypeData(data);
        }
      }
    } catch {
      setStatusMessage('Failed to fetch transaction type data');
      setStatusError(true);
    } finally {
      setLoadingTxType(false);
    }
  };

  const handleDateChange = (name, newValue) => {
    const iso = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
    setFormData((prev) => ({ ...prev, [name]: iso }));
  };

  const handleSave = async () => {
    setStatusMessage('Loan application saved.');
    setStatusError(false);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  const readOnlyFieldSx = {
    '& .MuiInputBase-root': {
      backgroundColor: '#f5f5f5',
    },
  };

  return (
    <Box
      component="fieldset"
      sx={{
        border: 'none',
        p: 3,
        m: 0,
        position: 'relative',
        '& .MuiInputLabel-root, & .MuiFormLabel-root': {
          fontWeight: 600,
          fontSize: '1.2rem',
        },
        '& .MuiFormLabel-asterisk': {
          color: 'error.main',
          fontSize: '1.2rem',
          fontWeight: 800,
        },
      }}
    >
      <Backdrop sx={{ color: '#fff', zIndex: 1301 }} open={isSaving}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 3 }}>
        Loan Application
      </Typography>

      {statusMessage && (
        <Alert severity={statusError ? 'error' : 'success'} sx={{ mb: 2 }}>
          {statusMessage}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, maxWidth: '80%' }}>

        {/* Row 1: Search + Contact */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {/* Search Card */}
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
                Search Member
              </Typography>
              <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 400 }}>
                <TextField
                  label="Member Code"
                  value={searchMemberCode}
                  onChange={(e) => setSearchMemberCode(e.target.value)}
                  placeholder="Enter member code"
                  size="small"
                  fullWidth
                  disabled={loadingMember}
                />
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={loadingMember ? <CircularProgress size={18} /> : <SearchRoundedIcon />}
                  disabled={loadingMember}
                  sx={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#667eea',
                    '&:hover': { backgroundColor: '#5568d3' },
                    fontWeight: 600,
                    paddingX: 3,
                    boxShadow: 'none',
                    textTransform: 'none',
                  }}
                >
                  {loadingMember ? 'Searching...' : 'Search'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Contact Card */}
          {memberDetails && (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
                  Contact
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'auto 1fr', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={formatProfileImage(memberDetails.MemberPicture)}
                      alt="Member profile"
                      sx={{ width: 180, height: 130, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                    />
                    <Typography variant="body2" color="text.secondary">Profile Picture</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      component="img"
                      src={formatProfileImage(memberDetails.MemberSignature)}
                      alt="Member signature"
                      sx={{ width: 180, height: 130, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', objectFit: 'contain', backgroundColor: '#fff' }}
                    />
                    <Typography variant="body2" color="text.secondary">Member Signature</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Loan Details Card */}
        {memberDetails && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, fontSize: '0.95rem', color: '#2c3e50' }}>
                Loan Details
              </Typography>

              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
                {/* Transaction Type */}
                <TextField
                  select
                  label="Transaction Type"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Transaction Type</em>
                  </MenuItem>
                  {transactionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Member Name - readonly */}
                <TextField
                  label="Member Name"
                  value={formData.memberName}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={readOnlyFieldSx}
                />

                {/* Current Loan Balance - readonly */}
                <TextField
                  label="Current Loan Balance"
                  value={formData.currentLoanBalance}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={readOnlyFieldSx}
                />

                {/* Loan Product */}
                <TextField
                  select
                  label="Loan Product"
                  name="loanProduct"
                  value={formData.loanProduct}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Loan Product</em>
                  </MenuItem>
                  {loanProducts.map((product) => (
                    <MenuItem key={product.prd_id} value={product.prd_id}>
                      {(product.prd_name || '').trim()}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Principal Amount */}
                <TextField
                  label="Principal Amount"
                  name="principalAmount"
                  value={formData.principalAmount}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  type="number"
                />

                {/* Interest Method */}
                <TextField
                  select
                  label="Interest Method"
                  name="interestMethod"
                  value={formData.interestMethod}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Interest Method</em>
                  </MenuItem>
                  {interestMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Interest Rate */}
                <TextField
                  label="Interest Rate (%)"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  type="number"
                />

                {/* Yearly Frequency */}
                <TextField
                  select
                  label="Yearly Frequency"
                  name="yearlyFrequency"
                  value={formData.yearlyFrequency}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Frequency</em>
                  </MenuItem>
                  {yearlyFrequencies.map((freq) => (
                    <MenuItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Loan Duration */}
                <TextField
                  label="Loan Duration (Months)"
                  name="loanDuration"
                  value={formData.loanDuration}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  type="number"
                />

                {/* Grace Period */}
                <TextField
                  label="Grace Period (Months)"
                  name="gracePeriod"
                  value={formData.gracePeriod}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  type="number"
                />

                {/* Saving Balance - readonly */}
                <TextField
                  label="Saving Balance"
                  value={formData.savingBalance}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={readOnlyFieldSx}
                />

                {/* Economic Sector */}
                <TextField
                  select
                  label="Economic Sector"
                  name="economicSector"
                  value={formData.economicSector}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Sector</em>
                  </MenuItem>
                  {economicSectors.map((sector) => (
                    <MenuItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Start Date */}
                <DatePicker
                  label="Start Date"
                  value={formData.startDate ? dayjs(formData.startDate) : null}
                  onChange={(val) => handleDateChange('startDate', val)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />

                {/* Loan Limit - readonly */}
                <TextField
                  label="Loan Limit"
                  value={formData.loanLimit}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={readOnlyFieldSx}
                />

                {/* Purpose of Loan */}
                <TextField
                  label="Purpose of Loan"
                  name="purposeOfLoan"
                  value={formData.purposeOfLoan}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />

                {/* Source of Funds */}
                <TextField
                  select
                  label="Source of Funds"
                  name="sourceOfFunds"
                  value={formData.sourceOfFunds}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Source of Funds</em>
                  </MenuItem>
                  {sourceFundsOptions.map((fund) => (
                    <MenuItem key={fund.value} value={fund.value}>
                      {fund.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Guarantor Source of Funds */}
                <TextField
                  select
                  label="Guarantor Source of Funds"
                  name="guarantorSourceOfFunds"
                  value={formData.guarantorSourceOfFunds}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Source of Funds</em>
                  </MenuItem>
                  {sourceFundsOptions.map((fund) => (
                    <MenuItem key={fund.value} value={fund.value}>
                      {fund.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Grace Period Interest */}
                <TextField
                  label="Grace Period Interest (%)"
                  name="gracePeriodInterest"
                  value={formData.gracePeriodInterest}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  type="number"
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {memberDetails && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              {isSaving ? 'Saving...' : '💾 Save Application'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
