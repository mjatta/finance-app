import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { useTopupLoans } from './hooks/useTopupLoans';
import { useLoanDetails } from './hooks/useLoanDetails';
import { useUpdateLoan } from './hooks/useUpdateLoan';
import { useLoanReasons } from '../../../hooks/useLoanReasons';

const todayIso = new Date().toISOString().split('T')[0];

const initialFormData = {
  memberCode: '',
  memberName: '',
  transactionType: '',
  currentLoanBalance: '',
  loanProduct: '',
  principalAmount: '',
  loanId: '',
  newPrincipal: '',
  interestMethod: '',
  interestRate: '',
  interestScope: '',
  yearlyFrequency: '',
  loanDuration: '',
  gracePeriod: '',
  savingBalance: '',
  economicSector: '',
  startDate: todayIso,
  loanLimit: '',
  loanPurpose: '',
  profitAmount: '',
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
  const { fetchTopupLoans } = useTopupLoans();
  const { fetchLoanDetails } = useLoanDetails();
  const { updateLoan } = useUpdateLoan();
  const { loanReasons, fetchLoanReasons } = useLoanReasons();

  const [sourceFundsOptions, setSourceFundsOptions] = useState([]);
  const [sectorOptions, setSectorOptions] = useState([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersSaving, setMembersSaving] = useState(false);
  const [membersStatusMessage, setMembersStatusMessage] = useState('');
  const [membersStatusError, setMembersStatusError] = useState(false);

  const [formData, setFormData] = useState(initialFormData);
  const [applicationFormPreviewUrl, setApplicationFormPreviewUrl] = useState('');
  const applicationFormFileRef = useRef(null);


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
      if (response && response.data && Array.isArray(response.data.sectors)) {
        const sectors = response.data.sectors.map((item) => ({
          value: String(item.sec_id),
          label: String(item.sec_name || '').trim(),
        }));
        setSectorOptions(sectors);
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
            
            if (result.status === 'success' && result.data) {
              // Store in Zustand store
              setLoanProductDetails(result.data);
              
              // Try multiple field name patterns for API response
              let intMethod = result.data.interestMethod || result.data.int_method || result.data.intMethod || result.data.method || '';
              const intRate = result.data.interestRate || result.data.int_rate || result.data.intRate || result.data.rate || '';
              const loanLimitVal = result.data.maxAmount || result.data.max_amount || result.data.maxAmount || '';
              const intScope = result.data.interestScope || result.data.interest_scope || result.data.IntScope || '';
              
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
              
              // Apply mappings to form fields
              setFormData((prev) => ({
                ...prev,
                interestMethod: intMethod || prev.interestMethod,
                interestRate: intRate || prev.interestRate,
                loanLimit: loanLimitVal || prev.loanLimit,
                interestScope: intScope || prev.interestScope,
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch loan product details:', error);
        }
      })();
    }
  }, [formData.loanProduct, formData.transactionType]);

  const handleClear = () => {
    setFormData(initialFormData);
    setMemberDetails(null);
    setSearchMemberCode('');
    applicationFormFileRef.current = null;
    setApplicationFormPreviewUrl('');
    setStatusMessage('');
    setStatusError(false);
  };

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
        const applicationForm = data.ApplicationForm || data.applicationForm || null;

        // Convert ApplicationForm base64 to preview URL if available
        if (applicationForm) {
          const previewUrl = base64ToPreviewUrl(applicationForm);
          setApplicationFormPreviewUrl(previewUrl);
        }

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

  // Convert base64 string to preview URL (for displaying backend data)
  const base64ToPreviewUrl = (base64Data) => {
    if (!base64Data) return '';
    // If it doesn't have data URI prefix, add it
    if (base64Data.startsWith('data:')) {
      return base64Data;
    }
    // Assume it's JPEG if no format specified
    return `data:image/jpeg;base64,${base64Data}`;
  };

  const handleApplicationFormFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    applicationFormFileRef.current = selectedFile;
    setApplicationFormPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return selectedFile ? URL.createObjectURL(selectedFile) : '';
    });
  };

  const handleRemoveApplicationFormFile = () => {
    applicationFormFileRef.current = null;
    setApplicationFormPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return '';
    });
  };

  // Handle principal amount input - only allow numbers and format with commas
  const handlePrincipalAmountChange = (e) => {
    const { value } = e.target;
    // Use utility function to clean numeric input
    const cleanValue = cleanNumericInput(value);
    // Store the clean numeric value
    setFormData((prev) => ({ ...prev, principalAmount: cleanValue }));
  };

  const handleNewPrincipalChange = (e) => {
    const { value } = e.target;
    const cleanValue = cleanNumericInput(value);
    setFormData((prev) => ({ ...prev, newPrincipal: cleanValue }));
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
    // Top-up vs Reschedule validation
    const isTopupReschedule = formData.transactionType === 'topup_reschedule'
    const isReschedule = formData.transactionType === 'topup_details'
    if (isTopupReschedule) {
      if (!formData.newPrincipal) errors.push('New Principal is required');
    } else if (isReschedule) {
      // For reschedule, principalAmount may come from currentLoanBalance so allow that
      if (!formData.principalAmount && !formData.currentLoanBalance) errors.push('Principal Amount is required');
    } else {
      if (!formData.principalAmount) errors.push('Principal Amount is required');
    }
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
      const isTopup = formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details'
      // If principalAmount wasn't prefilled, fall back to currentLoanBalance for existing principal
      const existingPrincipal = parseFloat(formData.principalAmount) || parseFloat(formData.currentLoanBalance) || 0
      const payload = {
        StartDate: new Date(formData.startDate).toISOString(),
        // For top-up/reschedule: Principal = existing loan balance + newPrincipal
        Principal: isTopup
          ? (existingPrincipal + (parseFloat(formData.newPrincipal) || 0))
          : (parseFloat(formData.principalAmount) || 0),
        InterestRate: parseFloat(formData.interestRate) || 0,
        Duration: parseFloat(formData.loanDuration) || 0,
        FrequencyValue: parseFloat(formData.yearlyFrequency) || 0,
        PaymentsPerYear: 12, // Hard coded to 12
      };
      
      const result = await calculateLoan(payload);
      
      if (result && result.data) {
        
        // Helper function to parse string values with commas
        const parseStringValue = (value) => {
          if (!value) return '';
          return String(value).replace(/,/g, '');
        };
        
        // Map the returned calculated fields to formData
        setFormData((prev) => ({
          ...prev,
          // Map calculated principal from response.principal (preferred) into the principalAmount field.
          principalAmount: parseStringValue(result.data?.principal ?? result.data?.Principal ?? result.data?.principalAmount ?? prev.principalAmount),
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
      } else if (txType === 'topup_reschedule' || txType === 'topup_details') {
        // For Top-up Loan, call topup endpoint then fetch loan details for the selected/top candidate
        setLoanProductDetails(null);
        const memberCode = resolveGroupCode();
        if (memberCode) {
          try {
            const topupPayload = await fetchTopupLoans(memberCode);
              if (topupPayload && Array.isArray(topupPayload.loans) && topupPayload.loans.length > 0) {
              const candidate = topupPayload.loans[0];
              const loanId = candidate.loan_id || candidate.loanId || candidate.id;
              // Map basic candidate fields into form. Do NOT prefill calculated Principal here — keep currentLoanBalance separate.
              setFormData((prev) => ({
                ...prev,
                loanId: loanId || prev.loanId,
                currentLoanBalance: candidate.loanBal ?? prev.currentLoanBalance,
                loanProduct: candidate.prd_id ?? prev.loanProduct,
                interestRate: candidate.intrate ?? prev.interestRate,
                // Do NOT overwrite loanDuration for top-up/reschedule
                // If this transaction type is Rescheduled Loan, set newPrincipal to 0 and keep it readonly
                newPrincipal: txType === 'topup_details' ? '0' : prev.newPrincipal,
              }));

              if (loanId) {
                try {
                  const detailsPayload = await fetchLoanDetails(memberCode, loanId);
                  // If detailsPayload contains richer data, try to map known fields
                  const details = detailsPayload && (detailsPayload.data || detailsPayload)
                  if (details) {
                    // Map a few likely fields safely. Keep existing loanDuration unchanged.
                    const loanRec = Array.isArray(details.loans) && details.loans.length ? details.loans[0] : details
                    // Pick loan balance from common field names and normalize comma-formatted numbers
                    const pickPrincipal = (val) => {
                      if (val === null || val === undefined) return null
                      const str = String(val)
                      return str.replace(/,/g, '')
                    }
                    const loanBalanceValue = pickPrincipal(loanRec.loanBal ?? loanRec.LoanBalance ?? loanRec.loanBalance ?? loanRec.loanamt ?? loanRec.loanAmt ?? loanRec.Principal ?? loanRec.principal)
                    
                    // Load ApplicationForm if available from backend
                    const applicationFormData = loanRec.ApplicationForm || loanRec.applicationForm || null;
                    if (applicationFormData) {
                      const previewUrl = base64ToPreviewUrl(applicationFormData);
                      setApplicationFormPreviewUrl(previewUrl);
                    }
                    
                    setFormData((prev) => ({
                      ...prev,
                      currentLoanBalance: loanRec.loanBal ?? loanRec.LoanBalance ?? prev.currentLoanBalance,
                      interestRate: loanRec.intrate ?? loanRec.interestRate ?? prev.interestRate,
                      principalAmount: loanBalanceValue ?? prev.principalAmount,
                    }));
                  }
                } catch (err) {
                  console.error('Failed to fetch loan details for top-up:', err)
                }
              }
            }
          } catch (err) {
            console.error('Top-up lookup failed:', err)
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
          newPrincipal: '',
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

  const resolveGroupCode = () => {
    const value = String(formData.memberCode || searchMemberCode || '').trim();
    return value ? value.padStart(6, '0') : '';
  };

  const normalizeGroupMembers = (rows) => rows.map((item, index) => ({
    id: item?.ID || item?.id || item?.MemberCode || `${index}`,
    ID: item?.ID || item?.id || null,
    FirstName: String(item?.FirstName || '').trim(),
    LastName: String(item?.LastName || '').trim(),
    Sector: String(item?.Sector ?? ''),
    LoanAmount: String(item?.LoanAmount ?? ''),
    ExpiryDate: item?.ExpiryDate ? dayjs(item.ExpiryDate).format('YYYY-MM-DD') : '',
    MemberCode: item?.MemberCode || '',
  }));

  const loadGroupMembers = async () => {
    const groupCode = resolveGroupCode();
    if (!groupCode) {
      setMembersStatusMessage('Search and select a member before loading group members.');
      setMembersStatusError(true);
      return;
    }

    setMembersLoading(true);
    setMembersStatusMessage('');
    setMembersStatusError(false);

    try {
      const response = await fetch(`/api/groupmembers/${groupCode}`);
      if (!response.ok) {
        throw new Error(`Failed to load group members (${response.status})`);
      }

      const result = await response.json();
      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setGroupMembers(normalizeGroupMembers(rows));
      setMembersStatusMessage('');
      setMembersStatusError(false);
    } catch (error) {
      setGroupMembers([]);
      setMembersStatusMessage(error?.message || 'Failed to load group members.');
      setMembersStatusError(true);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleShowMembers = async () => {
    setMembersOpen(true);
    await loadGroupMembers();
  };

  const handleGroupMemberFieldChange = (index, field, value) => {
    setGroupMembers((prev) => prev.map((member, rowIndex) => {
      if (rowIndex !== index) {
        return member;
      }

      if (field === 'LoanAmount') {
        return { ...member, LoanAmount: cleanNumericInput(value) };
      }

      if (field === 'Sector') {
        return { ...member, Sector: String(value).replace(/\D/g, '') };
      }

      return { ...member, [field]: value };
    }));
  };

  const saveGroupMembersUpdates = async () => {
    const groupCode = resolveGroupCode();
    if (!groupCode) {
      setMembersStatusMessage('Search and select a member before saving updates.');
      setMembersStatusError(true);
      return;
    }

    const membersPayload = groupMembers.map((member) => ({
      ID: Number(member.ID || member.id) || 0,
      Sector: Number(member.Sector) || 0,
      LoanAmount: parseFloat(member.LoanAmount) || 0,
      ExpiryDate: member.ExpiryDate ? `${dayjs(member.ExpiryDate).format('YYYY-MM-DD')}T00:00:00` : null,
    }));

    setMembersSaving(true);
    setMembersStatusMessage('');
    setMembersStatusError(false);

    try {
      let saveSucceeded = false;
      let response = await fetch('/api/groupmembers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(membersPayload),
      });

      if (response.ok) {
        saveSucceeded = true;
      }

      if (!response.ok) {
        const individualResponses = await Promise.all(
          membersPayload.map((item) => fetch('/api/groupmembers/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })),
        );
        const allOk = individualResponses.every((item) => item.ok);
        if (!allOk) {
          const failed = individualResponses.find((item) => !item.ok);
          const failedText = failed ? await failed.text() : '';
          throw new Error(`Failed to save member updates (${failed?.status || response.status})${failedText ? `: ${failedText}` : ''}`);
        }

        saveSucceeded = true;
      }

      if (!saveSucceeded) {
        const errorText = await response.text();
        throw new Error(`Failed to save member updates (${response.status})${errorText ? `: ${errorText}` : ''}`);
      }

      setMembersStatusMessage('Group member updates saved successfully.');
      setMembersStatusError(false);
      await loadGroupMembers();
    } catch (error) {
      setMembersStatusMessage(error?.message || 'Failed to save member updates.');
      setMembersStatusError(true);
    } finally {
      setMembersSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Convert application form to base64
      const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const applicationFormBase64 = applicationFormFileRef.current ? await fileToBase64(applicationFormFileRef.current) : null;

      // If top-up or reschedule transaction, call the loans update endpoint instead of the standard save
      const isTopupSave = formData.transactionType === 'topup_reschedule'
      const isRescheduleSave = formData.transactionType === 'topup_details'
      if (isTopupSave || isRescheduleSave) {
        const LoanId = parseInt(formData.loanId) || 0
        const newPrincipalVal = parseFloat(formData.newPrincipal) || 0
        const existingLoanBalanceVal = parseFloat(formData.currentLoanBalance) || parseFloat(formData.principalAmount) || 0
        const Principal = newPrincipalVal + existingLoanBalanceVal
        const LoanBalance = existingLoanBalanceVal
        const InterestAmount = parseFloat(formData.totalInterest) || 0
        const Duration = parseInt(formData.loanDuration) || 0
        const StartDate = dayjs(formData.startDate).isValid() ? dayjs(formData.startDate).format('YYYY-MM-DDT00:00:00') : formData.startDate
        const MaturityDate = dayjs(formData.finalPaymentDate).isValid() ? dayjs(formData.finalPaymentDate).format('YYYY-MM-DDT00:00:00') : formData.finalPaymentDate
        const PaymentPerPeriod = parseFloat(formData.periodicPayment) || (parseFloat(formData.totalPayment) / (parseFloat(formData.totalDuration) || 1)) || 0
        const FrequencyValue = parseInt(formData.yearlyFrequency) || parseInt(formData.paymentFrequency) || 12
        const TotalInterest = parseFloat(formData.totalInterest) || 0
        const TotalBalance = parseFloat(formData.totalPayment) || (Principal + TotalInterest)
        const UserId = user?.username || user?.userId || 'SYSTEM'
        const BranchId = 16
        const EconomicSectorId = parseInt(formData.economicSector) || 0
        const LoanPurposeId = parseInt(formData.loanPurpose) || 0
        const MemberSourceFundsId = parseInt(formData.sourceOfFunds) || 0
        const GuaSourceFundsId = parseInt(formData.guarantorSourceOfFunds) || 0
        const GracePeriod = parseInt(formData.gracePeriod) || 0
        const GracePeriodInterest = parseInt(formData.gracePeriodInterest) || 0

        const updatePayload = {
          LoanId,
          IsTopup: isTopupSave,
          IsReschedule: isRescheduleSave,
          Principal,
          LoanBalance,
          InterestAmount,
          Duration,
          StartDate,
          MaturityDate,
          PaymentPerPeriod,
          FrequencyValue,
          TotalInterest,
          TotalBalance,
          UserId,
          BranchId,
          EconomicSectorId,
          LoanPurposeId,
          MemberSourceFundsId,
          GuaSourceFundsId,
          GracePeriod,
          GracePeriodInterest,
        }

        try {
          const updateResult = await updateLoan(updatePayload)
          const messageContent = (updateResult?.message || updateResult?.Message || updateResult?.msg || JSON.stringify(updateResult) || '').toLowerCase()
          const isSuccess = updateResult && (updateResult.success === true || updateResult.status === 'success' || messageContent.includes('success') || updateResult.data)
          if (isSuccess) {
            setStatusMessage('✓ Loan update saved successfully! Resetting form...')
            setStatusError(false)
            setTimeout(() => {
              setFormData(initialFormData)
              setMemberDetails(null)
              setSearchMemberCode('')
              applicationFormFileRef.current = null
              setApplicationFormPreviewUrl('')
              setStatusMessage('')
            }, 4000)
          } else {
            setStatusMessage('Error updating loan: Invalid response from server')
            setStatusError(true)
          }
        } catch (err) {
          setStatusMessage('❌ Error updating loan: ' + (err.message || 'Unknown error'))
          setStatusError(true)
        } finally {
          setIsSaving(false)
        }

        return
      }

      // Build the payload according to backend requirements
      const payload = {
        gnNewLoanID: '',
        membcode: String(formData.memberCode).padStart(6, '0'), // Pad to 6 digits like "000001"
        lNET_SAVINGS: parseInt(formData.savingBalance) || 0, // Convert to number, not empty string
        gnPrdId: parseInt(formData.loanProduct) || 0,
        lLOAN_INTEREST: parseFloat(formData.calculatedInterestRate) || parseFloat(formData.interestRate) || 0,
        // Use `newPrincipal` for top-up/reschedule flows, otherwise use principalAmount
        lPRINCIPAL_AMT: (formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details')
          ? parseFloat(formData.newPrincipal) || 0
          : parseFloat(formData.principalAmount) || 0,
        lLDURATION_NUM: parseInt(formData.loanDuration) || 0,
        lPROFIT_AMT: formData.interestScope === 3 ? (parseFloat(formData.profitAmount) || 0) : 0,
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
        // dPrinPay based on the chosen principal (newPrincipal for top-up/reschedule)
        dPrinPay: parseFloat(((formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details') ? (parseFloat(formData.newPrincipal) || 0) : (parseFloat(formData.principalAmount) || 0)) * 0.9) || 0,
        ApplicationForm: applicationFormBase64,
        applicationForm: applicationFormBase64 || '',
      };


      
      const result = await saveLoan(payload);
      
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
      
      if (isSuccess) {
        setStatusMessage('✓ Loan application saved successfully! Resetting form...');
        setStatusError(false);
        
        // Reset form after successful save - delay for 8 seconds so user can see success message
        setTimeout(() => {
          setFormData(initialFormData);
          setMemberDetails(null);
          setSearchMemberCode('');
          applicationFormFileRef.current = null;
          setApplicationFormPreviewUrl('');
          setStatusMessage('');
        }, 8000);
      } else {
        setStatusMessage('Error saving loan application: Invalid response from server');
        setStatusError(true);
      }
    } catch (error) {
      setStatusMessage('❌ Error saving loan application: ' + (error.message || 'Unknown error'));
      setStatusError(true);
      // Do NOT reset the form on error - keep it for user to correct and retry
    } finally {
      setIsSaving(false);
    }
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
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
                  //helperText="Enter customer code and press Tab to load member details."
                  FormHelperTextProps={{
                    sx: {
                      fontWeight: 800,
                      color: '#b45309',
                    },
                  }}
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
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  sx={{
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    paddingX: 3,
                    boxShadow: 'none',
                    textTransform: 'none',
                    color: '#666',
                    borderColor: '#ccc',
                    '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' },
                  }}
                >
                  Clear
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

                    {/* Profit Amount - Only for Islamic Products (interestScope: 3) */}
                    {Number(formData.interestScope) === 3 && (
                      <TextField
                        label="Profit Amount"
                        name="profitAmount"
                        value={formatCurrency(formData.profitAmount)}
                        onChange={(e) => {
                          const cleanValue = cleanNumericInput(e.target.value);
                          setFormData((prev) => ({ ...prev, profitAmount: cleanValue }));
                        }}
                        size="small"
                        fullWidth
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
                    )}

                    {/* Principal Amount */}
                    <TextField
                      label="Principal Amount"
                      name="principalAmount"
                      value={formatCurrency(formData.principalAmount)}
                      onChange={handlePrincipalAmountChange}
                      size="small"
                      fullWidth
                      disabled={formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details'}
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

                    {/* New Principal - only relevant for Top-up / Reschedule transactions */}
                    {(formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details') && (
                      <TextField
                        label="New Principal"
                        name="newPrincipal"
                        value={formatCurrency(formData.newPrincipal)}
                        onChange={handleNewPrincipalChange}
                        size="small"
                        fullWidth
                        required={formData.transactionType === 'topup_reschedule'}
                        disabled={formData.transactionType === 'topup_details'}
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
                    )}

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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#2c3e50' }}>
                      Additional Details
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleShowMembers}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      Show Members
                    </Button>
                  </Box>


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
                    {(formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details') && (
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
                        {(formData.transactionType === 'topup_reschedule' || formData.transactionType === 'topup_details')
                          ? 'N/A'
                          : (formData.savingBalance || 'N/A')}
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

            {/* Application Form Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Application Form
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button component="label" variant="outlined" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                      Select a Form
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleApplicationFormFileChange}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={!applicationFormPreviewUrl}
                      onClick={handleRemoveApplicationFormFile}
                      sx={{ textTransform: 'none' }}
                    >
                      Remove Form
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(15, 23, 42, 0.06)',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                      Form Preview
                    </Typography>
                    <Box
                      sx={{
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        minHeight: 150,
                        display: 'grid',
                        placeItems: 'center',
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                      }}
                    >
                      {applicationFormPreviewUrl ? (
                        <Box
                          component="img"
                          src={applicationFormPreviewUrl}
                          alt="Application form preview"
                          sx={{ width: '100%', height: 150, objectFit: 'contain', bgcolor: 'background.paper', borderRadius: 1 }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Selected form preview will appear here.
                        </Typography>
                      )}
                    </Box>
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

      <Dialog
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd', pb: 1.5 }}>
          Group Members
        </DialogTitle>
        <DialogContent dividers>
          {membersStatusMessage && (
            <Alert severity={membersStatusError ? 'error' : 'success'} sx={{ mb: 2 }}>
              {membersStatusMessage}
            </Alert>
          )}

          {membersLoading ? (
            <Box sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f4f7fb' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>First Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>Last Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>Sector</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>Loan Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>Expiry Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No group members found.</TableCell>
                    </TableRow>
                  ) : (
                    groupMembers.map((member, index) => (
                      <TableRow key={member.id || `${member.FirstName}-${member.LastName}-${index}`}>
                        <TableCell>{member.FirstName || 'N/A'}</TableCell>
                        <TableCell>{member.LastName || 'N/A'}</TableCell>
                        <TableCell sx={{ minWidth: 240 }}>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={member.Sector}
                            onChange={(e) => handleGroupMemberFieldChange(index, 'Sector', e.target.value)}
                            SelectProps={{
                              displayEmpty: true,
                              renderValue: (selected) => {
                                if (!selected) {
                                  return <em>Select a sector</em>;
                                }
                                const selectedSector = sectorOptions.find((sector) => sector.value === selected);
                                return selectedSector?.label || selected;
                              },
                            }}
                          >
                            <MenuItem value="">
                              <em>Select a sector</em>
                            </MenuItem>
                            {sectorOptions.map((sector) => (
                              <MenuItem key={sector.value} value={sector.value}>
                                {sector.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <TextField
                            size="small"
                            value={formatCurrency(member.LoanAmount)}
                            onChange={(e) => handleGroupMemberFieldChange(index, 'LoanAmount', e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment> }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 170 }}>
                          <DatePicker
                            value={member.ExpiryDate ? dayjs(member.ExpiryDate) : null}
                            onChange={(newValue) => handleGroupMemberFieldChange(
                              index,
                              'ExpiryDate',
                              newValue ? dayjs(newValue).format('YYYY-MM-DD') : '',
                            )}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersOpen(false)} disabled={membersSaving}>Close</Button>
          <Button
            variant="contained"
            onClick={saveGroupMembersUpdates}
            disabled={membersSaving || membersLoading || groupMembers.length === 0}
          >
            {membersSaving ? 'Saving...' : 'Save Updates'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
