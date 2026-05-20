import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Button,
  Alert,
  Skeleton,
} from '@mui/material';
import { useGetAccountTypes } from './hooks/useGetAccountTypes';
import { useGetIncomeAccounts } from './hooks/useGetIncomeAccounts';
import { useGetExpenseAccounts } from './hooks/useGetExpenseAccounts';
import { useGetLiabilitiesAccounts } from './hooks/useGetLiabilitiesAccounts';
import { useGetProductSource } from './hooks/useGetProductSource';
import { useInsertProduct } from './hooks/useInsertProduct';

export default function ProductDefinition() {
  const { accountTypes, loading: loadingTypes } = useGetAccountTypes();
  const { incomeAccounts, loading: loadingIncomeAccounts } = useGetIncomeAccounts();
  const { expenseAccounts, loading: loadingExpenseAccounts } = useGetExpenseAccounts();
  const { liabilitiesAccounts, loading: loadingLiabilitiesAccounts } = useGetLiabilitiesAccounts();
  const { productSources, loading: loadingProductSources } = useGetProductSource();
  const { insertProduct } = useInsertProduct();

  const initialForm = {
    mainCategory: '',
    productName: '',
    hasDeductions: false,
    isIslamicProduct: false,
    interestRate: '',
    minimumAmount: '',
    maximumAmount: '',
    minimumDuration: '',
    maximumDuration: '',
    // Loan Facilities Account Details
    interestIncome: '',
    badDebtRecovered: '',
    badDebtExpenses: '',
    loanProductControl: '',
    // Saving/Shares Investment Account Details
    savingProductControl: '',
    expenseAccount: '',
    // Deduction Details
    deductionAccountType: '',
    deductionDestinationAccount: '',
    deductionPercentage: '',
    deductionSourceProduct: '',
  };

  const [form, setForm] = useState(initialForm);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCategory = accountTypes.find((t) => t.adescrip === form.mainCategory);
  const selectedAdescrip = selectedCategory?.adescrip?.toUpperCase() || '';
  const selectedCategoryCode = selectedCategory?.acode || '';
  const isLoan = selectedAdescrip.includes('LOAN');
  const isSavingOrShares = selectedAdescrip.includes('SAVING') || selectedAdescrip.includes('SHARE');

  useEffect(() => {
    if (!isLoan && form.isIslamicProduct) {
      setForm((prev) => ({ ...prev, isIslamicProduct: false }));
    }
  }, [isLoan, form.isIslamicProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'deductionAccountType' ? { deductionDestinationAccount: '' } : {}),
    }));
    setStatusMessage('');
  };

  const handleSave = async () => {
    if (!form.mainCategory || !form.productName) {
      setStatusMessage('Main Category and Product Name are required.');
      setStatusError(true);
      return;
    }
    setIsSaving(true);
    setStatusMessage('');
    try {
      const result = await insertProduct({
        ...form,
        mainCategoryCode: selectedCategoryCode,
        productKind: isLoan ? 'loan' : isSavingOrShares ? 'saving' : 'other',
      });

      if (!result) throw new Error('Save failed');

      setStatusMessage('Product definition saved successfully.');
      setStatusError(false);
      setForm(initialForm);
    } catch {
      setStatusMessage('Failed to save product definition.');
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box component="fieldset" sx={{ border: 'none', p: 3, m: 0 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Product Definition
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Define and manage savings, shares, and loan products
        </Typography>
      </Box>

      {statusMessage && (
        <Alert severity={statusError ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setStatusMessage('')}>
          {statusMessage}
        </Alert>
      )}

      {/* Cards grid - 2 column layout */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>

        {/* Card 1: Product Details */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
              Product Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loadingTypes ? (
                <>
                  <Skeleton variant="rounded" height={40} />
                  <Skeleton variant="rounded" height={40} />
                </>
              ) : (
                <>
                  <TextField
                    select
                    label="Main Category"
                    name="mainCategory"
                    value={form.mainCategory}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                    required
                  >
                    <MenuItem value="">Select a Category</MenuItem>
                    {accountTypes.map((type) => (
                      <MenuItem key={type.acode} value={type.adescrip}>
                        {type.adescrip}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Product Name"
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                    required
                  />
                </>
              )}
              {isSavingOrShares && (
                <FormControlLabel
                  control={
                    <Checkbox
                      name="hasDeductions"
                      checked={form.hasDeductions}
                      onChange={handleChange}
                    />
                  }
                  label="Deductions"
                />
              )}
              {isLoan && (
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isIslamicProduct"
                      checked={form.isIslamicProduct}
                      onChange={handleChange}
                    />
                  }
                  label="Islamic Products"
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Card 2: Financial Parameters */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
              Financial Parameters
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!(isLoan && form.isIslamicProduct) && (
                <TextField
                  label="Interest Rate (%)"
                  name="interestRate"
                  value={form.interestRate}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                />
              )}
              <TextField
                label="Minimum Amount"
                name="minimumAmount"
                value={form.minimumAmount}
                onChange={handleChange}
                size="small"
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
              />
              <TextField
                label="Maximum Amount"
                name="maximumAmount"
                value={form.maximumAmount}
                onChange={handleChange}
                size="small"
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
              />
              <TextField
                label="Minimum Duration"
                name="minimumDuration"
                value={form.minimumDuration}
                onChange={handleChange}
                size="small"
                fullWidth
              />
              <TextField
                label="Maximum Duration"
                name="maximumDuration"
                value={form.maximumDuration}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </Box>
          </CardContent>
        </Card>

        {/* Card 3: Loan Facilities Account Details (only for Loans) */}
        {isLoan && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Loan Facilities Account Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Interest Income"
                  name="interestIncome"
                  value={form.interestIncome}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={loadingIncomeAccounts}
                >
                  <MenuItem value="">Select Interest Income Account</MenuItem>
                  {incomeAccounts.map((account) => (
                    <MenuItem key={account.cacctnumb} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Bad Debt Recovered"
                  name="badDebtRecovered"
                  value={form.badDebtRecovered}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={loadingIncomeAccounts}
                >
                  <MenuItem value="">Select Bad Debt Recovered Account</MenuItem>
                  {incomeAccounts.map((account) => (
                    <MenuItem key={`recovered-${account.cacctnumb}`} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Bad Debt Expenses"
                  name="badDebtExpenses"
                  value={form.badDebtExpenses}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={loadingExpenseAccounts}
                >
                  <MenuItem value="">Select Bad Debt Expenses Account</MenuItem>
                  {expenseAccounts.map((account) => (
                    <MenuItem key={`expenses-${account.cacctnumb}`} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Product Control"
                  name="loanProductControl"
                  value={form.loanProductControl}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={loadingLiabilitiesAccounts}
                >
                  <MenuItem value="">Select Product Control Account</MenuItem>
                  {liabilitiesAccounts.map((account) => (
                    <MenuItem key={`liability-loan-${account.cacctnumb}`} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Card 4: Saving Investment Account Details (only for Savings/Shares) */}
        {/* Card 5: Deduction Details (only when Deductions checkbox is checked) */}
        {form.hasDeductions && isSavingOrShares && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Deduction Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl>
                  <FormLabel sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.85rem', mb: 0.5 }}>Account Type</FormLabel>
                  <RadioGroup
                    row
                    name="deductionAccountType"
                    value={form.deductionAccountType}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="member" control={<Radio size="small" />} label="Member Account" />
                    <FormControlLabel value="gl" control={<Radio size="small" />} label="GL Account" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  select
                  label="Destination Account"
                  name="deductionDestinationAccount"
                  value={form.deductionDestinationAccount}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={!form.deductionAccountType || (form.deductionAccountType === 'member' ? loadingProductSources : loadingIncomeAccounts)}
                >
                  <MenuItem value="">Select Destination Account</MenuItem>
                  {form.deductionAccountType === 'member' && productSources.map((item) => (
                    <MenuItem key={`product-source-${item.value}`} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                  {form.deductionAccountType === 'gl' && incomeAccounts.map((account) => (
                    <MenuItem key={`deduction-gl-${account.cacctnumb}`} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Percentage (%)"
                  name="deductionPercentage"
                  value={form.deductionPercentage}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                />
                <TextField
                  label="Source Product"
                  name="deductionSourceProduct"
                  value={form.deductionSourceProduct}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {isSavingOrShares && (
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Saving Investment Account Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Product Control"
                  name="savingProductControl"
                  value={form.savingProductControl}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={loadingLiabilitiesAccounts}
                >
                  <MenuItem value="">Select Product Control Account</MenuItem>
                  {liabilitiesAccounts.map((account) => (
                    <MenuItem key={`liability-${account.cacctnumb}`} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Expense Account"
                  name="expenseAccount"
                  value={form.expenseAccount}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  disabled={loadingExpenseAccounts}
                >
                  <MenuItem value="">Select Expense Account</MenuItem>
                  {expenseAccounts.map((account) => (
                    <MenuItem key={`saving-expense-${account.cacctnumb}`} value={account.cacctnumb}>
                      {account.cacctname}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>
        )}

      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !form.mainCategory || !form.productName}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', paddingX: 3, boxShadow: 'none' }}
        >
          {isSaving ? 'Saving...' : '💾 Save Product'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => { setForm(initialForm); setStatusMessage(''); setStatusError(false); }}
          sx={{ fontWeight: 600, textTransform: 'none', paddingX: 3 }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
}

