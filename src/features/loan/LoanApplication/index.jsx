import React, { useEffect, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useAuthStore } from '../../../store/authStore';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';
import { useGetMemberDetails } from './hooks/useGetMemberDetails';
import { useLoanSetupDetails } from './hooks/useLoanSetupDetails';
import { useLoanCalculate } from './hooks/useLoanCalculate';
import { useLoanSave } from './hooks/useLoanSave';
import { useLoanReasons } from '../../../hooks/useLoanReasons';

const todayIso = new Date().toISOString().split('T')[0];

const initialFormData = {
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
  loanPurpose: '',
  sourceOfFunds: '',
  guarantorSourceOfFunds: '',
  gracePeriodInterest: '',
  // Calculated Items
  paymentFrequency: '',
  grossInterest: '',
  firstPaymentDate: '',
  finalPaymentDate: '',
  periodicPayment: '',
  totalDuration: '',
  totalAmount: '',
  calculatedInterestRate: '',
  totalInterest: '',
  totalPayment: '',
};

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
  { value: 'new', label: 'New Loan' },
  { value: 'topup_reschedule', label: 'Top-up Loan' },
  { value: 'topup_details', label: 'Rescheduled Loan' },
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
  const authBranchId = useAuthStore((state) => state.user?.branchId);
  const branchId = parseInt(localStorage.getItem('branchID')) || parseInt(authBranchId) || 1;
  const setLoanProducts = useAuthStore((state) => state.setLoanProducts);
  const setLoanProductDetails = useAuthStore((state) => state.setLoanProductDetails);
  const storeProducts = useAuthStore((state) => state.loanProducts);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);
  const [searchMemberCode, setSearchMemberCode] = useState('');

  const { fetchMemberDetails, loading: loadingMember } = useGetMemberDetails();
  const { fetchLoanSetupDetails } = useLoanSetupDetails();
  const { calculateLoan } = useLoanCalculate();
  const { saveLoan } = useLoanSave();
  const { loanReasons, fetchLoanReasons } = useLoanReasons();

  const [sourceFundsOptions, setSourceFundsOptions] = useState([]);

  const [formData, setFormData] = useState(initialFormData);


  // Fetch loan products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products/types');
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data) {
            setLoanProducts(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch loan products:', error);
      }
    };
    loadProducts();
  }, [setLoanProducts]);

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

  // Fetch loan reasons on mount
  useEffect(() => {
    fetchLoanReasons();
  }, []);

  // When transaction type changes, fetch relevant data
  useEffect(() => {
    if (formData.transactionType) {
      handleTransactionTypeChange(formData.transactionType, formData.loanProduct);
    }
  }, [formData.transactionType]);

  // When loan product changes and transaction type is "New Loan", fetch product details
  useEffect(() => {
    if (formData.loanProduct && formData.transactionType === 'new') {
      (async () => {
        try {
          const response = await fetch(
            `/api/loanproducts/select?prd_id=${formData.loanProduct}&loanType=new`
          );
          if (response.ok) {
            const result = await response.json();
            console.log('API Response:', result);
            
            if (result.status === 'success' && result.data) {
              // Store in Zustand store
              setLoanProductDetails(result.data);
              
              // Try multiple field name patterns for API response
              let intMethod = result.data.interestMethod || result.data.int_method || result.data.intMethod || result.data.method || '';
              const intRate = result.data.interestRate || result.data.int_rate || result.data.intRate || result.data.rate || '';
              const loanLimitVal = result.data.maxAmount || result.data.max_amount || result.data.maxAmount || '';
              
              // Map interest method label from API to internal value format
              // API returns labels like "Reducing Balance", we need to map to "reducing"
              const interestMethodMap = {
                'Reducing Balance': 'reducing',
                'Flat Rate': 'flat',
                'Compound Interest': 'compound',
                'reducing': 'reducing',
                'flat': 'flat',
                'compound': 'compound',
              };
              intMethod = interestMethodMap[intMethod] || intMethod;
              
              console.log('Mapped values - Method:', intMethod, 'Rate:', intRate, 'Limit:', loanLimitVal);
              
              // Apply mappings to form fields
              setFormData((prev) => ({
                ...prev,
                interestMethod: intMethod || prev.interestMethod,
                interestRate: intRate || prev.interestRate,
                loanLimit: loanLimitVal || prev.loanLimit,
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch loan product details:', error);
        }
      })();
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
    setMemberDetails(null);

    try {
      const payload = await fetchMemberDetails(searchMemberCode.trim());
      const data = payload && payload.data ? payload.data : null;
      if (data) {
        setMemberDetails(data);

        // Map fields from API response
        const memberName = data.fullName || data.MemberName || '';
        const savingsBalance = data.savingsBalance || data.SavingBalance || '';
        const memberPic = data.memberPic || data.MemberPicture || '';
        const memberSign = data.memberSign || data.MemberSignature || '';

        setFormData((prev) => ({
          ...prev,
          memberCode: searchMemberCode.trim(),
          memberName,
          savingBalance: savingsBalance,
          memberPic,
          memberSign,
          currentLoanBalance: data.LoanBalance || '',
          loanLimit: data.LoanLimit || '',
        }));
      } else {
        setStatusMessage('Member not found');
        setStatusError(true);
      }
    } catch {
      setStatusMessage('Failed to fetch member details');
      setStatusError(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle principal amount input - only allow numbers and format with commas
  const handlePrincipalAmountChange = (e) => {
    const { value } = e.target;
    // Use utility function to clean numeric input
    const cleanValue = cleanNumericInput(value);
    // Store the clean numeric value
    setFormData((prev) => ({ ...prev, principalAmount: cleanValue }));
  };

  // Handle loan purpose selection
  const handleLoanPurposeChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, loanPurpose: value }));
  };

  // Validation function for required fields before loan calculation
  const validateRequiredFields = () => {
    const errors = [];
    
    if (!formData.startDate) errors.push('Start Date is required');
    if (!formData.principalAmount) errors.push('Principal Amount is required');
    if (!formData.interestRate) errors.push('Interest Rate is required');
    if (!formData.loanDuration) errors.push('Loan Duration is required');
    if (!formData.yearlyFrequency) errors.push('Yearly Frequency is required');
    
    return errors;
  };

  // Handle Loan Duration onBlur - call calculation endpoint
  const handleLoanDurationBlur = async () => {
    const validationErrors = validateRequiredFields();
    
    if (validationErrors.length > 0) {
      setStatusMessage(validationErrors.join(', '));
      setStatusError(true);
      return;
    }

    try {
      // Build payload with mapped field names
      const payload = {
        StartDate: new Date(formData.startDate).toISOString(),
        Principal: parseFloat(formData.principalAmount) || 0,
        InterestRate: parseFloat(formData.interestRate) || 0,
        Duration: parseFloat(formData.loanDuration) || 0,
        FrequencyValue: parseFloat(formData.yearlyFrequency) || 0,
        PaymentsPerYear: 12, // Hard coded to 12
      };

      console.log('Calling loan calculation with payload:', payload);
      
      const result = await calculateLoan(payload);
      
      if (result && result.data) {
        console.log('Loan calculation result:', result.data);
        
        // Helper function to parse string values with commas
        const parseStringValue = (value) => {
          if (!value) return '';
          return String(value).replace(/,/g, '');
        };
        
        // Map the returned calculated fields to formData
        setFormData((prev) => ({
          ...prev,
          principalAmount: parseStringValue(result.data.principal || result.data.Principal || prev.principalAmount),
          firstPaymentDate: result.data.startDate || '',
          finalPaymentDate: result.data.endDate || '',
          calculatedInterestRate: parseStringValue(result.data.interestRate || result.data.InterestRate || ''),
          totalInterest: parseStringValue(result.data.totalInterest || result.data.TotalInterest || result.data.Total_Interest || ''),
          totalPayment: parseStringValue(result.data.totalPayment || result.data.TotalPayment || result.data.Total_Payment || ''),
          periodicPayment: parseStringValue(result.data.paymentPerPeriod || result.data.PaymentPerPeriod || result.data.payment_per_period || ''),
          paymentFrequency: result.data.paymentFrequency || result.data.payment_frequency || prev.yearlyFrequency,
          totalDuration: result.data.duration || result.data.total_duration || prev.loanDuration,
          grossInterest: parseStringValue(result.data.totalInterest || result.data.TotalInterest || result.data.gross_interest || ''),
        }));
        
        setStatusMessage('Loan calculation completed successfully');
        setStatusError(false);
      } else {
        setStatusMessage('Failed to calculate loan details');
        setStatusError(true);
      }
    } catch (error) {
      console.error('Error during loan calculation:', error);
      setStatusMessage('Error calculating loan: ' + error.message);
      setStatusError(true);
    }
  };

  const handleTransactionTypeChange = async (txType, loanProduct) => {
    try {
      if (txType === 'new') {
        // For "New Loan", fetch and map product details
        if (loanProduct) {
          const response = await fetch(
            `/api/loanproducts/select?prd_id=${loanProduct}&loanType=new`
          );
          if (response.ok) {
            const result = await response.json();
            console.log('Transaction Type Change - API Response:', result);
            
            if (result.status === 'success' && result.data) {
              // Store in Zustand store
              setLoanProductDetails(result.data);
              
              // Try multiple field name patterns for API response
              const intMethod = result.data.interestMethod || result.data.int_method || result.data.intMethod || result.data.method || '';
              const intRate = result.data.interestRate || result.data.int_rate || result.data.intRate || result.data.rate || '';
              const loanLimitVal = result.data.maxAmount || result.data.max_amount || result.data.maxAmount || '';
              
              console.log('Mapped values - Method:', intMethod, 'Rate:', intRate, 'Limit:', loanLimitVal);
              
              // Apply mappings to form fields
              setFormData((prev) => ({
                ...prev,
                interestMethod: intMethod || prev.interestMethod,
                interestRate: intRate || prev.interestRate,
                loanLimit: loanLimitVal || prev.loanLimit,
              }));
            }
          }
        }
      } else {
        // For other transaction types, clear the mappings
        setLoanProductDetails(null);
        setFormData((prev) => ({
          ...prev,
          interestMethod: '',
          interestRate: '',
          loanLimit: '',
        }));
      }
    } catch {
      setStatusMessage('Failed to fetch transaction type data');
      setStatusError(true);
    }
  };

  const handleDateChange = (name, newValue) => {
    const iso = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
    setFormData((prev) => ({ ...prev, [name]: iso }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Build the payload according to backend requirements
      const payload = {
        gnNewLoanID: '',
        membcode: String(formData.memberCode).padStart(6, '0'), // Pad to 6 digits like "000001"
        lNET_SAVINGS: parseInt(formData.savingBalance) || 0, // Convert to number, not empty string
        gnPrdId: parseInt(formData.productId) || 1,
        lLOAN_INTEREST: parseFloat(formData.calculatedInterestRate) || parseFloat(formData.interestRate) || 0,
        lPRINCIPAL_AMT: parseFloat(formData.principalAmount) || 0,
        lLDURATION_NUM: parseInt(formData.loanDuration) || 0,
        txtStartDate: dayjs(formData.startDate).isValid() ? dayjs(formData.startDate).format('YYYY-MM-DD') : formData.startDate,
        txtEndDate: dayjs(formData.finalPaymentDate).isValid() ? dayjs(formData.finalPaymentDate).format('YYYY-MM-DD') : formData.finalPaymentDate,
        lREPAYMENT_AMT: parseFloat(formData.totalPayment) || 0,
        lNOFPAYMENTS: parseInt(formData.totalDuration) || 0,
        lTOTAL_INTEREST: parseFloat(formData.totalInterest) || 0,
        gcUserid: user?.username || user?.userId || user?.id || 'SYSTEM', // Use username (SUPER) not user ID
        lBRANCH_ID: parseInt(branchId) || 1, // Don't allow 0, use valid branch ID
        nleconsec: 1,
        nlloanpurpos: parseInt(formData.loanPurpose) || 1,
        nmemsourcefunds: parseInt(formData.sourceOfFunds) || 1,
        nguasourcefunds: parseInt(formData.guarantorSourceOfFunds) || 1,
        lnofpayperyear: 12, // Always 12 for monthly payments
        lgraceperiod: parseInt(formData.gracePeriod) || 0,
        lgraceperiodinterest: parseInt(formData.gracePeriodInterest) || 0,
        gnCompid: parseInt(user?.CompId) || 3,
        glTopup: formData.topup === true || formData.topup === 'true' || false,
        glResched: formData.reschedule === true || formData.reschedule === 'true' || false,
        dPrinPay: parseFloat(formData.principalAmount * 0.9) || 0,
      };

      console.log('Saving loan application with payload:', payload);
      
      const result = await saveLoan(payload);
      console.log('Save result (full object):', result);
      console.log('Save result (stringified):', JSON.stringify(result, null, 2));
      console.log('Save result keys:', Object.keys(result || {}));
      console.log('Save result.message:', result?.message);
      console.log('Save result.Message:', result?.Message);
      console.log('Save result.status:', result?.status);
      console.log('Save result.Status:', result?.Status);
      console.log('Save result.code:', result?.code);
      console.log('Save result.text:', result?.text);
      
      // Check if response indicates success
      // Look in multiple possible message fields and check for success keywords
      const messageContent = (result?.message || result?.Message || result?.msg || result?.text || result?.raw || '').toLowerCase();
      const isSuccess = result && (
        result.success === true ||
        result.status === 'success' || 
        result.Status === 'success' ||
        result.statusCode === 200 || 
        result.Code === 200 || 
        messageContent.includes('successfully') ||
        messageContent.includes('inserted') ||
        messageContent.includes('saved') ||
        messageContent.includes('created') ||
        messageContent.includes('loan details') ||
        result.data
      );
      
      console.log('Is Success (based on checks):', isSuccess);
      console.log('Message content:', messageContent);
      console.log('Result object:', result);
      console.log('Result statusCode:', result?.statusCode);
      
      if (isSuccess) {
        setStatusMessage('✓ Loan application saved successfully! Resetting form...');
        setStatusError(false);
        
        // Reset form after successful save - delay for 8 seconds so user can see success message
        setTimeout(() => {
          setFormData(initialFormData);
          setMemberDetails(null);
          setSearchMemberCode('');
          setStatusMessage('');
        }, 8000);
      } else {
        setStatusMessage('Error saving loan application: Invalid response from server');
        setStatusError(true);
      }
    } catch (error) {
      console.error('Error saving loan application:', error);
      setStatusMessage('❌ Error saving loan application: ' + (error.message || 'Unknown error'));
      setStatusError(true);
      // Do NOT reset the form on error - keep it for user to correct and retry
    } finally {
      setIsSaving(false);
    }
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
      <Backdrop
        open={isSaving}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={96} thickness={5} />
          <Typography variant="h6" fontWeight={800}>Saving loan application...</Typography>
        </Box>
      </Backdrop>

      {/* Header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Application
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Capture and process new loan requests with product-based controls
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, maxWidth: '80%' }}>

        {/* Row 1: Search + Contact */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {/* Search Card */}
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Search Customer
              </Typography>
              <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2, maxWidth: 400 }}>
                <TextField
                  label="Customer Code"
                  value={searchMemberCode}
                  onChange={(e) => setSearchMemberCode(e.target.value)}
                  placeholder="Enter customer code"
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
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Contact
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={formatProfileImage(formData.memberPic)}
                      alt="Member profile"
                      sx={{ width: 180, height: 130, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                    />
                    <Typography variant="body2" color="text.secondary">Profile Picture</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={formatProfileImage(formData.memberSign)}
                      alt="Member signature"
                      sx={{ width: 180, height: 130, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', objectFit: 'contain', backgroundColor: '#fff' }}
                    />
                    <Typography variant="body2" color="text.secondary">Member Signature</Typography>
                  </Box>
                </Box>
                <Box sx={{ borderTop: '1px solid', borderColor: '#e0e0e0', pt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Phone:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {memberDetails.Phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Loan Details - 2 Column Layout */}
        {memberDetails && (
          <>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {/* Card 1: Primary Loan Details */}
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    Loan Details
                  </Typography>

                  <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: '1fr' }}>
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
                      {storeProducts.map((product) => (
                        <MenuItem key={product.prd_id} value={product.prd_id}>
                          {(product.prd_name || '').trim()}
                        </MenuItem>
                      ))}
                    </TextField>

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

                    {/* Yearly Frequency */}
                    <TextField
                      select
                      label="Yearly Frequency"
                      name="yearlyFrequency"
                      value={formData.yearlyFrequency}
                      onChange={handleChange}
                      size="small"
                      fullWidth
                      required
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

                    {/* Principal Amount */}
                    <TextField
                      label="Principal Amount"
                      name="principalAmount"
                      value={formatCurrency(formData.principalAmount)}
                      onChange={handlePrincipalAmountChange}
                      size="small"
                      fullWidth
                      required
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9.]*',
                        placeholder: '0',
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                        ),
                      }}
                    />

                    {/* Loan Duration */}
                    <TextField
                      label="Loan Duration (Months)"
                      name="loanDuration"
                      value={formData.loanDuration}
                      onChange={handleChange}
                      onBlur={handleLoanDurationBlur}
                      size="small"
                      fullWidth
                      type="number"
                      required
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Card 2: Additional Details */}
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    Additional Details
                  </Typography>


                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Customer Name (was Member Name) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Customer Name:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {formData.memberName || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Current Loan Amount - only show if Top-up Loan */}
                    {formData.transactionType === 'topup_reschedule' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                          Current Loan Amount:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.currentLoanBalance !== '' ? formData.currentLoanBalance : 'N/A'}
                        </Typography>
                      </Box>
                    )}

                    {/* Interest Method as text */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Interest Method:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {formData.interestMethod || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Interest Rate as text */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Interest Rate:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {formData.interestRate || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Saving Balance as text */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Saving Balance:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {formData.savingBalance || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Loan Limit as text */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                        Loan Limit:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                        {formData.loanLimit || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Start Date */}
                    <DatePicker
                      label="Start Date"
                      value={formData.startDate ? dayjs(formData.startDate) : null}
                      onChange={(val) => handleDateChange('startDate', val)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          required: true,
                        },
                      }}
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

                    {/* Purpose of Loan */}
                    <TextField
                      select
                      label="Purpose of Loan"
                      name="loanPurpose"
                      value={formData.loanPurpose}
                      onChange={handleLoanPurposeChange}
                      size="small"
                      fullWidth
                    >
                      <MenuItem value="">
                        <em>Select Purpose</em>
                      </MenuItem>
                      {loanReasons.map((reason) => (
                        <MenuItem key={reason.id} value={reason.id}>
                          {reason.name}
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
            </Box>

            {statusMessage && (
              <Alert severity={statusError ? 'error' : 'success'} sx={{ mb: 2 }}>
                {statusMessage}
              </Alert>
            )}

            {/* Card 3: Calculated Items - Full Width */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Calculated Items
                </Typography>

                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  {/* Principal */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Principal:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.principalAmount || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Periodic Payment */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Periodic Payment:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.periodicPayment || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Interest Rate (Calculated) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Interest Rate (%):
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.calculatedInterestRate || 'N/A'}
                    </Typography>
                  </Box>

                  {/* First Payment Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      First Payment Date:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.firstPaymentDate || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Gross Interest */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Gross Interest:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.grossInterest || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Final Payment Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Final Payment Date:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.finalPaymentDate || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Total Interest */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Total Interest:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.totalInterest || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Payment Frequency */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Payment Frequency:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.paymentFrequency || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Total Payment */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Total Payment:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.totalPayment || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Total Duration */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Total Duration (Months):
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.totalDuration || 'N/A'}
                    </Typography>
                  </Box>

                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        {memberDetails && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving || !formData.loanDuration}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                '&:disabled': { backgroundColor: '#ccc', color: '#999' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
              title={!formData.loanDuration ? 'Please enter Loan Duration before saving' : ''}
            >
              {isSaving ? 'Saving...' : '💾 Save Application'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
