
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Backdrop,
  CircularProgress,
  Skeleton,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import dayjs from 'dayjs';
import { useGetLoanRepaymentAccount } from './hooks/useGetLoanRepaymentAccount';
import { useGetMemberDetails } from '../../member/DepositManagement/hooks/useGetMemberDetails';
import { useGetAccountDetails } from '../../member/DepositManagement/hooks/useGetAccountDetails';
import { useGetBanks } from '../../member/DepositManagement/hooks/useGetBanks';
import { useGetBankAccounts } from '../../member/DepositManagement/hooks/useGetBankAccounts';
import { useAuthStore } from '../../../store/authStore';
import { formatCurrency, cleanNumericInput, CURRENCY_SYMBOL } from '../../../utils/currencyFormatter';

// Placeholder for profile/signature images
const defaultProfileImage = '/src/assets/company-logo.jpg';

export default function Repayments() {
  // State
  const todayIso = dayjs().format('YYYY-MM-DD');
  const [formData, setFormData] = useState({
    memberCode: '',
    profilePicture: '',
    memberSignature: '',
    phoneNumber: '',
    postingAccount: '',
    memberAccounts: [],
    transactionDate: todayIso,
    repaymentAmount: '',
    comments: '',
    // Loan details
    loanAmount: undefined,
    interest: undefined,
    repayment: undefined,
    duration: undefined,
    startDate: undefined,
    // Repayment type details
    repaymentType: '',
    checkNumber: '',
    checkDate: '',
    bank: '',
    bankAccount: '',
    contraAccount: '',
    cashAccount: '',
    creditLimit: '',
    debitLimit: '',
    loanLimit: '',
  });
      // Bank and account state for dropdowns
      const [banks, setBanks] = useState([]);
      const [bankAccounts, setBankAccounts] = useState([]);
      const user = useAuthStore((state) => state.user);
      const { fetchBanks } = useGetBanks();
      const { fetchBankAccounts } = useGetBankAccounts();
      // Handle Repayment Type change
      const handleRepaymentTypeChange = async (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
          ...prev,
          repaymentType: value,
          // Reset details on type change
          checkNumber: '',
          checkDate: '',
          bank: '',
          bankAccount: '',
          contraAccount: '',
          cashAccount: '',
          creditLimit: '',
          debitLimit: '',
          loanLimit: '',
        }));
        if (value === 'cheque' || value === 'bank') {
          const result = await fetchBanks();
          if (result && result.success && result.data) setBanks(result.data);
          else setBanks([]);
          setBankAccounts([]);
        } else if (value === 'cash' && user) {
          setFormData((prev) => ({
            ...prev,
            cashAccount: user.CashAccount || '',
            contraAccount: user.CashAccount || '',
            debitLimit: user.DebitLimit != null ? String(user.DebitLimit) : '',
            creditLimit: user.CreditLimit != null ? String(user.CreditLimit) : '',
            loanLimit: user.LoanLimit != null ? String(user.LoanLimit) : '',
          }));
          setBanks([]);
          setBankAccounts([]);
        } else {
          setBanks([]);
          setBankAccounts([]);
        }
      };
      // Handle bank change
      const handleBankChange = async (e) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, bank: value, bankAccount: '', contraAccount: '' }));
        if (value) {
          const result = await fetchBankAccounts(value);
          if (result && result.success && result.data) setBankAccounts(result.data);
          else setBankAccounts([]);
        } else {
          setBankAccounts([]);
        }
      };
      // Handle bank account change
      const handleBankAccountChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, bankAccount: value, contraAccount: value }));
      };
    // Fetch loan details from new endpoint
    const fetchLoanDetails = useCallback(async (accountNumber, tranDate) => {
      setLoadingAccountDetails(true);
      try {
        const url = `http://alakuyateh-001-site10.atempurl.com/api/LoanRepayment/getLoanRepaymentAccount?accountNumber=${encodeURIComponent(accountNumber)}&ncompid=30&tranDate=${tranDate}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch loan details');
        const data = await resp.json();
        setFormData((prev) => ({
          ...prev,
          loanAmount: data.LoanAmount,
          interest: data.Interest,
          repayment: data.Repayment,
          duration: data.Duration,
          startDate: data.StartDate,
        }));
      } finally {
        setLoadingAccountDetails(false);
      }
    }, []);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [loadingAccountDetails, setLoadingAccountDetails] = useState(false);
  const [touched, setTouched] = useState({});

  // Hooks
  const { fetchLoanRepaymentAccount } = useGetLoanRepaymentAccount();
  const { fetchMemberDetails } = useGetMemberDetails();
  useGetAccountDetails(); // Only call for side effects if any

  // Search member by code
  const searchMember = useCallback(async () => {
    if (!formData.memberCode) return;
    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);
    try {
      const member = await fetchMemberDetails(formData.memberCode);
      if (!member) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: '',
          memberSignature: '',
          phoneNumber: '',
          memberAccounts: [],
          accountBalance: '',
          accountNumber: '',
          clearedBalance: '',
          unclearedBalance: '',
        }));
        setStatusMessage('Member not found for provided code.');
        setStatusError(true);
        return;
      }
      // Map payload fields
      setFormData((prev) => ({
        ...prev,
        profilePicture: member.MemberPicture ? `data:image/jpeg;base64,${member.MemberPicture}` : '',
        memberSignature: member.MemberSignature ? `data:image/jpeg;base64,${member.MemberSignature}` : '',
        phoneNumber: member.Phone || '',
        memberAccounts: Array.isArray(member.Accounts) ? member.Accounts : [],
      }));
      setStatusMessage('Member accounts and contact details loaded successfully.');
      setStatusError(false);
    } catch {
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  }, [formData.memberCode, fetchMemberDetails]);

  // Clear form
  const handleClear = () => {
    setFormData({
      memberCode: '',
      profilePicture: '',
      memberSignature: '',
      phoneNumber: '',
      postingAccount: '',
      memberAccounts: [],
      accountBalance: '',
      accountNumber: '',
      clearedBalance: '',
      unclearedBalance: '',
      transactionDate: todayIso,
      repaymentAmount: '',
      comments: '',
    });
    setStatusMessage('');
    setStatusError(false);
    setTouched({});
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle numeric input for repayment amount
  const handleRepaymentAmountChange = (e) => {
    const cleanValue = cleanNumericInput(e.target.value);
    setFormData((prev) => ({ ...prev, repaymentAmount: cleanValue }));
  };

  // Handle date change
  const handleDateChange = (value) => {
    setFormData((prev) => ({ ...prev, transactionDate: value ? value.format('YYYY-MM-DD') : '' }));
  };

  // Fetch account details when posting account changes
  useEffect(() => {
    if (formData.postingAccount) {
      setLoadingAccountDetails(true);
      fetchLoanRepaymentAccount(formData.postingAccount, formData.transactionDate).then((result) => {
        if (result) {
          setFormData((prev) => ({
            ...prev,
            accountNumber: result.accountNumber || '',
            accountBalance: result.accountBalance || '',
            clearedBalance: result.clearedBalance || '',
            unclearedBalance: result.unclearedBalance || '',
          }));
        }
        setLoadingAccountDetails(false);
      }).catch(() => {
        setLoadingAccountDetails(false);
      });
    }
  }, [formData.postingAccount, formData.transactionDate, fetchLoanRepaymentAccount]);

  // Field validation
  const isFieldInvalid = (field) => {
    return touched[field] && !formData[field];
  };

  // Main render
  return (
    <Box component="fieldset" p={3} sx={{ border: 'none', p: 3, m: 0, position: 'relative' }}>
      <Backdrop open={isLoadingMember} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={96} thickness={5} />
          <Typography variant="h6" fontWeight={800}>Loading member...</Typography>
        </Box>
      </Backdrop>

      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Repayments
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Process member loan repayments and manage transactions
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Search
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Customer Code"
                name="memberCode"
                value={formData.memberCode}
                onChange={handleChange}
                onBlur={() => searchMember('memberCode')}
                disabled={isLoadingMember}
                placeholder="Member Code"
              />
              <TextField
                label="Payroll Number"
                name="payrollNumber"
                value={formData.payrollNumber || ''}
                onChange={handleChange}
                onBlur={() => searchMember('payrollNumber')}
                disabled={isLoadingMember}
                placeholder="e.g. PAY001"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleClear}
                  disabled={isLoadingMember}
                  sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, flex: 1, textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, justifyItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="img"
                    src={formData.profilePicture || defaultProfileImage}
                    alt="Member profile"
                    sx={{ width: 160, height: 120, borderRadius: 1.5, border: '2px solid', borderColor: 'primary.light', objectFit: 'cover', boxShadow: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Member Profile
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="img"
                    src={formData.memberSignature || defaultProfileImage}
                    alt="Member signature"
                    sx={{ width: 160, height: 120, borderRadius: 1.5, border: '2px solid', borderColor: 'primary.light', objectFit: 'contain', backgroundColor: '#f5f5f5', boxShadow: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Member Signature
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '120px' }}>
                    Phone Number:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                    {formData.phoneNumber || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          sx={{ mt: 2, '& .MuiAlert-message': { fontSize: '1.1rem', fontWeight: statusError ? 600 : 700 } }}
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
      )}

      <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#2c3e50' }}>
            Repayment Information
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {/* Transaction Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Transaction Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                  <TextField
                    select
                    label="Posting Account"
                    name="postingAccount"
                    value={formData.postingAccount}
                    onChange={handleChange}
                    onBlur={e => {
                      const value = e.target.value;
                      if (value) fetchLoanDetails(value, formData.transactionDate);
                    }}
                    error={isFieldInvalid('postingAccount')}
                    helperText={isFieldInvalid('postingAccount') ? 'Posting Account is required' : ''}
                    size="small"
                    fullWidth
                    required
                  >
                    <MenuItem value="">Select Posting Account</MenuItem>
                    {formData.memberAccounts.map((account) => (
                      <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                        {account.AccountName}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Transaction Date"
                    name="transactionDate"
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => handleDateChange(dayjs(e.target.value))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Loan Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Loan Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {loadingAccountDetails ? (
                    <>
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                      <Skeleton variant="rounded" height={30} />
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                          Loan Amount:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.loanAmount !== undefined ? formatCurrency(formData.loanAmount) : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                          Interest:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.interest !== undefined ? `${formData.interest}%` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                          Repayment:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.repayment !== undefined ? formatCurrency(formData.repayment) : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                          Duration:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.duration !== undefined ? formData.duration : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                          Start Date:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                          {formData.startDate || 'N/A'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Repayment Details Card */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Repayment Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>

                  <Box>
                    <TextField
                      select
                      label="Repayment Type"
                      name="repaymentType"
                      value={formData.repaymentType}
                      onChange={handleRepaymentTypeChange}
                      size="small"
                      fullWidth
                      required
                    >
                      <MenuItem value="">Select Repayment Type</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="bank">Bank</MenuItem>
                      <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
                    </TextField>
                  </Box>
                  {/* Details Card on the right */}
                  <Box>
                    {formData.repaymentType === 'cash' && (
                      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                            Cash Details
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                              label="Cash Account"
                              name="cashAccount"
                              value={formData.cashAccount}
                              onChange={handleChange}
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Credit Limit"
                              name="creditLimit"
                              value={formData.creditLimit}
                              onChange={handleChange}
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Debit Limit"
                              name="debitLimit"
                              value={formData.debitLimit}
                              onChange={handleChange}
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Loan Limit"
                              name="loanLimit"
                              value={formData.loanLimit}
                              onChange={handleChange}
                              size="small"
                              fullWidth
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                    {(formData.repaymentType === 'cheque' || formData.repaymentType === 'bank') && (
                      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                            {formData.repaymentType === 'cheque' ? 'Check Details' : 'Bank Details'}
                          </Typography>
                          <Box sx={{ display: 'grid', gap: 2 }}>
                            {formData.repaymentType === 'cheque' && (
                              <>
                                <TextField
                                  label="Check Number"
                                  name="checkNumber"
                                  value={formData.checkNumber}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                />
                                <TextField
                                  label="Check Date"
                                  name="checkDate"
                                  type="date"
                                  value={formData.checkDate}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                />
                              </>
                            )}
                            <TextField
                              select
                              label="Bank"
                              name="bank"
                              value={formData.bank}
                              onChange={handleBankChange}
                              size="small"
                              fullWidth
                            >
                              <MenuItem value="">Select bank</MenuItem>
                              {banks.map((bank) => (
                                <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              label="Bank Account"
                              name="bankAccount"
                              value={formData.bankAccount}
                              onChange={handleBankAccountChange}
                              size="small"
                              fullWidth
                              disabled={!formData.bank}
                            >
                              <MenuItem value="">Select account</MenuItem>
                              {bankAccounts.map((account) => (
                                <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              label="Contra Account"
                              name="contraAccount"
                              value={formData.contraAccount}
                              disabled
                              size="small"
                              fullWidth
                              sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                  backgroundColor: '#f5f5f5',
                                  color: '#666',
                                  fontWeight: 600,
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Box>

                  <TextField
                    label="Repayment Amount"
                    name="repaymentAmount"
                    value={formatCurrency(formData.repaymentAmount)}
                    onChange={handleRepaymentAmountChange}
                    size="small"
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
                    }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                  <TextField
                    label="Comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    multiline
                    minRows={4}
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disabled
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, paddingX: 3, boxShadow: 'none', textTransform: 'none' }}
            >
              💾 Save Repayment
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
