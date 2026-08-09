import React, { useCallback, useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
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
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { CurrencyAdornment, PercentAdornment } from '../../../../components/FieldAdornments';
import { useGetAccountTypes } from './hooks/useGetAccountTypes';
import { useGetIncomeAccounts } from './hooks/useGetIncomeAccounts';
import { useGetExpenseAccounts } from './hooks/useGetExpenseAccounts';
import { useGetLiabilitiesAccounts } from './hooks/useGetLiabilitiesAccounts';
import { useGetAssetsAccounts } from './hooks/useGetAssetsAccounts';
import { useGetProductSource } from './hooks/useGetProductSource';
import { useInsertProduct } from './hooks/useInsertProduct';
import { useUpdateProduct } from './hooks/useUpdateProduct';

export default function ProductDefinition() {
  const { accountTypes, loading: loadingTypes } = useGetAccountTypes();
  const { incomeAccounts, loading: loadingIncomeAccounts } = useGetIncomeAccounts();
  const { expenseAccounts, loading: loadingExpenseAccounts } = useGetExpenseAccounts();
  const { liabilitiesAccounts, loading: loadingLiabilitiesAccounts } = useGetLiabilitiesAccounts();
  const { assetsAccounts, loading: loadingAssetsAccounts } = useGetAssetsAccounts();
  const { productSources, loading: loadingProductSources } = useGetProductSource();
  const { insertProduct } = useInsertProduct();
  const { updateProduct } = useUpdateProduct();

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

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductNumericId, setSelectedProductNumericId] = useState(null);
  const [productSearchValue, setProductSearchValue] = useState(null);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await fetch('/api/product-definition');
      if (response.ok) {
        const data = await response.json();
        let products = Array.isArray(data?.products) ? data.products : [];
        
        // Ensure each product has mainCategory by mapping from acode if needed
        products = products.map(product => {
          let mainCategoryValue = product.mainCategory || '';
          
          if (mainCategoryValue && accountTypes.length > 0) {
            // Try exact match first
            let matchedType = accountTypes.find((t) => t.adescrip === mainCategoryValue);
            // If no exact match, try case-insensitive
            if (!matchedType) {
              const upperMainCategory = mainCategoryValue.toUpperCase();
              matchedType = accountTypes.find((t) => t.adescrip === upperMainCategory);
              if (matchedType) {
                mainCategoryValue = matchedType.adescrip;
              }
            }
          } else if (!mainCategoryValue && product.acode && accountTypes.length > 0) {
            // Fallback: look up from backend acode field if mainCategory not available
            const matchedType = accountTypes.find(t => t.acode === product.acode);
            if (matchedType) {
              mainCategoryValue = matchedType.adescrip;
            }
          }
          
          return {
            ...product,
            mainCategory: mainCategoryValue,
          };
        });
        
        setProducts(products);
      }
    } catch {
      // Ignore; search list simply stays empty/stale.
    } finally {
      setProductsLoading(false);
    }
  }, [accountTypes]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleNewProduct = () => {
    setForm(initialForm);
    setSelectedProductId(null);
    setSelectedProductNumericId(null);
    setProductSearchValue(null);
    setStatusMessage('');
    setStatusError(false);
  };

  const handleSelectProduct = (product) => {
    if (!product) {
      handleNewProduct();
      return;
    }

    // Map mainCategory with case-insensitive matching
    let mainCategoryValue = product.mainCategory || '';
    if (mainCategoryValue && accountTypes.length > 0) {
      // Try exact match first
      let matchedType = accountTypes.find((t) => t.adescrip === mainCategoryValue);
      // If no exact match, try case-insensitive
      if (!matchedType) {
        const upperMainCategory = mainCategoryValue.toUpperCase();
        matchedType = accountTypes.find((t) => t.adescrip === upperMainCategory);
        if (matchedType) {
          mainCategoryValue = matchedType.adescrip;
        }
      }
    } else if (!mainCategoryValue && product.acode && accountTypes.length > 0) {
      // Fallback: look up from backend acode field if mainCategory not available
      const matchedType = accountTypes.find((t) => t.acode === product.acode);
      if (matchedType) {
        mainCategoryValue = matchedType.adescrip;
      }
    }

    // Extract numeric ProductID (try ProductID, productId, prd_id first as they might be numeric)
    const numericId = product.ProductID || product.productId || product.prd_id || product.id;

    setForm({
      mainCategory: mainCategoryValue,
      productName: product.productName || product.prd_name || '',
      hasDeductions: Boolean(product.hasDeductions),
      isIslamicProduct: Boolean(product.isIslamicProduct),
      interestRate: product.interestRate ?? '',
      minimumAmount: product.minimumAmount ?? '',
      maximumAmount: product.maximumAmount ?? '',
      minimumDuration: product.minimumDuration ?? '',
      maximumDuration: product.maximumDuration ?? '',
      interestIncome: product.interestIncome ?? '',
      badDebtRecovered: product.badDebtRecovered ?? '',
      badDebtExpenses: product.badDebtExpenses ?? '',
      loanProductControl: product.loanProductControl ?? '',
      savingProductControl: product.savingProductControl ?? '',
      expenseAccount: product.expenseAccount ?? '',
      deductionAccountType: product.deductionAccountType ?? '',
      deductionDestinationAccount: product.deductionDestinationAccount ?? '',
      deductionPercentage: product.deductionPercentage ?? '',
      deductionSourceProduct: product.deductionSourceProduct ?? '',
    });
    setSelectedProductId(product.id || product.prd_id);
    setSelectedProductNumericId(numericId);
    setProductSearchValue(product);
    setStatusMessage(`Loaded "${product.productName || product.prd_name}" for editing.`);
    setStatusError(false);
  };

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
      const isUpdate = Boolean(selectedProductId);

      let result;
      if (isUpdate) {
        // Call update endpoint for existing products
        result = await updateProduct({
          ...form,
          productId: selectedProductNumericId,
          id: selectedProductId,
          mainCategoryCode: selectedCategoryCode,
          productKind: isLoan ? 'loan' : isSavingOrShares ? 'saving' : 'other',
        });
      } else {
        // Call insert endpoint for new products
        result = await insertProduct({
          ...form,
          mainCategoryCode: selectedCategoryCode,
          productKind: isLoan ? 'loan' : isSavingOrShares ? 'saving' : 'other',
        });
      }

      if (!result) throw new Error(isUpdate ? 'Update failed' : 'Save failed');

      const productRecord = {
        id: selectedProductId || `prd-${Date.now()}`,
        ...form,
      };

      try {
        const syncResponse = await fetch('/api/product-definition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: productRecord,
            mainCategories: [form.mainCategory],
            productNames: [form.productName],
          }),
        });
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          setProducts(Array.isArray(syncData?.products) ? syncData.products : []);
        }
      } catch {
        // Local search index sync failed; the remote save already succeeded.
      }

      setSelectedProductId(productRecord.id);
      setProductSearchValue(productRecord);
      setStatusMessage(isUpdate ? 'Product definition updated successfully.' : 'Product definition saved successfully.');
      setStatusError(false);
    } catch (err) {
      setStatusMessage(err.message || 'Failed to save product definition.');
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box component="fieldset" sx={{ border: 'none', p: 3, m: 0 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
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

      {/* Find Product search */}
      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>
            Find Product
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Autocomplete
              options={products}
              loading={productsLoading}
              value={productSearchValue}
              onChange={(_, value) => handleSelectProduct(value)}
              getOptionLabel={(option) => (option ? `${option.productName || ''} (${option.mainCategory || ''})` : '')}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              sx={{ minWidth: 320, flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Product"
                  placeholder="Type a product name to search"
                  size="small"
                />
              )}
            />
            {selectedProductId && (
              <Chip label={`Editing: ${form.productName}`} color="primary" variant="outlined" />
            )}
            <Button variant="outlined" onClick={handleNewProduct} sx={{ fontWeight: 600, textTransform: 'none' }}>
              New Product
            </Button>
          </Box>
        </CardContent>
      </Card>

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
                    label={<span>Main Category <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    name="mainCategory"
                    value={form.mainCategory}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">Select a Category</MenuItem>
                    {accountTypes.map((type) => (
                      <MenuItem key={type.acode} value={type.adescrip}>
                        {type.adescrip}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={<span>Product Name <span style={{color: 'red', fontSize: '1.2em'}}>*</span></span>}
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    size="small"
                    fullWidth
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
                  type="number"
                  value={form.interestRate}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  InputProps={{ endAdornment: <PercentAdornment /> }}
                />
              )}
              <TextField
                label="Minimum Amount"
                name="minimumAmount"
                type="number"
                value={form.minimumAmount}
                onChange={handleChange}
                size="small"
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                InputProps={{ startAdornment: <CurrencyAdornment /> }}
              />
              <TextField
                label="Maximum Amount"
                name="maximumAmount"
                type="number"
                value={form.maximumAmount}
                onChange={handleChange}
                size="small"
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                InputProps={{ startAdornment: <CurrencyAdornment /> }}
              />
              <TextField
                label="Minimum Duration"
                name="minimumDuration"
                type="number"
                value={form.minimumDuration}
                onChange={handleChange}
                size="small"
                fullWidth
              />
              <TextField
                label="Maximum Duration"
                name="maximumDuration"
                type="number"
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
                  disabled={loadingAssetsAccounts}
                >
                  <MenuItem value="">Select Product Control Account</MenuItem>
                  {assetsAccounts.map((account) => (
                    <MenuItem key={`assets-loan-${account.cacctnumb}`} value={account.cacctnumb}>
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
                  InputProps={{ endAdornment: <PercentAdornment /> }}
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

      <Backdrop open={isSaving} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !form.mainCategory || !form.productName}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', paddingX: 3, boxShadow: 'none' }}
        >
          {isSaving ? 'Saving...' : selectedProductId ? '💾 Update Product' : '💾 Save Product'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleNewProduct}
          sx={{ fontWeight: 600, textTransform: 'none', paddingX: 3 }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
}

