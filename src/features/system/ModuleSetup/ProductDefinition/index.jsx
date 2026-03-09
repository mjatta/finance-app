import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function ProductDefinition({ user }) {
  const initialForm = {
    id: '',
    mainCategory: '',
    productName: '',
    productType: 'conventional',
    productScope: 'all',
    productMandate: 'Mandatory',
    minimumAmount: '',
    maximumAmount: '',
    minimumDuration: '',
    maximumDuration: '',
    minimumMembers: '',
    maximumMembers: '',
    interestRate: '',
    minimumSavingToQuality: '',
    gender: 'male',
    interestMode: 'none',
    loanProductTracking: 'at individual level',
    ageBracket: '',
    commissionTransactionFeeType: 'value',
    commissionTransactionFeeValue: '',
    ledgerFeesType: 'value',
    ledgerFeesValue: '',
    penaltyType: 'value',
    penaltyValue: '',
    savingInterestCalculationMethod: 'minimal balance',
  };

  const [form, setForm] = useState(initialForm);
  const [mainCategories, setMainCategories] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [addMainCategoryOpen, setAddMainCategoryOpen] = useState(false);
  const [addProductNameOpen, setAddProductNameOpen] = useState(false);
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [editingProductId, setEditingProductId] = useState('');

  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch('/api/product-definition');
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        if (Array.isArray(payload?.mainCategories)) {
          setMainCategories(payload.mainCategories);
          setForm((prev) => ({ ...prev, mainCategory: prev.mainCategory || payload.mainCategories[0] || '' }));
        }

        if (Array.isArray(payload?.productNames)) {
          setProductNames(payload.productNames);
          setForm((prev) => ({ ...prev, productName: prev.productName || payload.productNames[0] || '' }));
        }

        if (Array.isArray(payload?.products)) {
          setSavedProducts(payload.products);
        }
      } catch {
        // keep defaults
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const canSave = useMemo(
    () => form.mainCategory && form.productName,
    [form.mainCategory, form.productName],
  );

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setStatusMessage('');
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!canSave || isReadOnlyRole) {
      return;
    }

    setIsSaving(true);
    setStatusMessage('');

    try {
      const productPayload = {
        ...form,
        id: form.id || `prd-${Date.now()}`,
      };

      const response = await fetch('/api/product-definition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainCategories,
          productNames,
          product: productPayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save product definition.');
      }

      const payload = await response.json();
      if (Array.isArray(payload?.mainCategories)) {
        setMainCategories(payload.mainCategories);
      }
      if (Array.isArray(payload?.productNames)) {
        setProductNames(payload.productNames);
      }
      if (Array.isArray(payload?.products)) {
        setSavedProducts(payload.products);
      }

      setStatusMessage(editingProductId ? 'Product definition updated successfully.' : 'Product definition saved successfully.');
      setEditingProductId('');
      setForm((prev) => ({
        ...initialForm,
        mainCategory: prev.mainCategory,
        productName: prev.productName,
      }));
    } catch {
      setStatusMessage('Unable to save product definition.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditFromGrid = (row) => {
    setForm({ ...initialForm, ...row });
    setEditingProductId(row.id || row.productName || '');
    setStatusMessage(`Editing product: ${row.productName || '-'}`);
  };

  const addMainCategory = () => {
    const trimmed = newMainCategory.trim();
    if (!trimmed) {
      return;
    }
    setMainCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setForm((prev) => ({ ...prev, mainCategory: trimmed }));
    setNewMainCategory('');
    setAddMainCategoryOpen(false);
  };

  const addProductName = () => {
    const trimmed = newProductName.trim();
    if (!trimmed) {
      return;
    }
    setProductNames((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setForm((prev) => ({ ...prev, productName: trimmed }));
    setNewProductName('');
    setAddProductNameOpen(false);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Product Definition
      </Typography>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view product definitions, but cannot save changes.
        </Typography>
      )}

      {statusMessage && (
        <Typography
          variant="body2"
          sx={{ mb: 2, fontWeight: 700 }}
          color={statusMessage.toLowerCase().includes('unable') ? 'error.main' : 'success.main'}
        >
          {statusMessage}
        </Typography>
      )}

      <Box
        component="fieldset"
        disabled={isReadOnlyRole}
        sx={{ border: 'none', p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1, pointerEvents: isReadOnlyRole ? 'none' : 'auto' }}
      >
        <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 320px', minWidth: 280 }}>
                <TextField
                  select
                  label="Main Catergory"
                  name="mainCategory"
                  value={form.mainCategory}
                  onChange={handleFieldChange}
                  sx={{ flex: 1 }}
                >
                  {mainCategories.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton onClick={() => setAddMainCategoryOpen(true)}>
                  <AddIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 320px', minWidth: 280 }}>
                <TextField
                  select
                  label="Prodcut Name"
                  name="productName"
                  value={form.productName}
                  onChange={handleFieldChange}
                  sx={{ flex: 1 }}
                >
                  {productNames.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton onClick={() => setAddProductNameOpen(true)}>
                  <AddIcon />
                </IconButton>
              </Box>

              <FormControl sx={{ flex: '1 1 100%', minWidth: 300 }}>
                <FormLabel>Product</FormLabel>
                <RadioGroup row name="productType" value={form.productType} onChange={handleFieldChange}>
                  <FormControlLabel value="conventional" control={<Radio />} label="Conventional" />
                  <FormControlLabel value="shariah" control={<Radio />} label="Shariah" />
                  <FormControlLabel value="both" control={<Radio />} label="Both" />
                </RadioGroup>
              </FormControl>

              <FormControl sx={{ flex: '1 1 100%', minWidth: 300 }}>
                <FormLabel>Product scope</FormLabel>
                <RadioGroup row name="productScope" value={form.productScope} onChange={handleFieldChange}>
                  <FormControlLabel value="all" control={<Radio />} label="All" />
                  <FormControlLabel value="individual" control={<Radio />} label="Individual" />
                  <FormControlLabel value="salary" control={<Radio />} label="Salary" />
                  <FormControlLabel value="corporate" control={<Radio />} label="Corporate" />
                  <FormControlLabel value="group" control={<Radio />} label="Group" />
                </RadioGroup>
              </FormControl>

              <TextField
                select
                label="Product mandate"
                name="productMandate"
                value={form.productMandate}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              >
                <MenuItem value="Mandatory">Mandatory</MenuItem>
              </TextField>

              <TextField label="Minimum Amount" name="minimumAmount" value={form.minimumAmount} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="Maxmium Amount" name="maximumAmount" value={form.maximumAmount} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="Mininum duration" name="minimumDuration" value={form.minimumDuration} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="maxmium duration" name="maximumDuration" value={form.maximumDuration} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="minium members" name="minimumMembers" value={form.minimumMembers} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="maximum members" name="maximumMembers" value={form.maximumMembers} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="interset Rat" name="interestRate" value={form.interestRate} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />
              <TextField label="Mininum Saving to Quality" name="minimumSavingToQuality" value={form.minimumSavingToQuality} onChange={handleFieldChange} sx={{ flex: '1 1 240px', minWidth: 240 }} />

              <TextField
                select
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>

              <FormControl sx={{ flex: '1 1 100%', minWidth: 300 }}>
                <FormLabel>Interest mode</FormLabel>
                <RadioGroup row name="interestMode" value={form.interestMode} onChange={handleFieldChange}>
                  <FormControlLabel value="interest receiving" control={<Radio />} label="Interest Recieving" />
                  <FormControlLabel value="interest paying" control={<Radio />} label="interst Paying" />
                  <FormControlLabel value="none" control={<Radio />} label="none" />
                </RadioGroup>
              </FormControl>

              <FormControl sx={{ flex: '1 1 100%', minWidth: 300 }}>
                <FormLabel>Loan Product tracking</FormLabel>
                <RadioGroup row name="loanProductTracking" value={form.loanProductTracking} onChange={handleFieldChange}>
                  <FormControlLabel value="at individual level" control={<Radio />} label="at individaul level" />
                  <FormControlLabel value="at group level" control={<Radio />} label="at Group level" />
                </RadioGroup>
              </FormControl>

              <TextField label="Age Braket(range)" name="ageBracket" value={form.ageBracket} onChange={handleFieldChange} sx={{ flex: '1 1 220px', minWidth: 220 }} />

              <TextField
                select
                label="commisson/Transaction fee"
                name="commissionTransactionFeeType"
                value={form.commissionTransactionFeeType}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 240px', minWidth: 240 }}
              >
                <MenuItem value="value">value</MenuItem>
                <MenuItem value="percentage">percentage</MenuItem>
              </TextField>
              <TextField
                label={form.commissionTransactionFeeType === 'percentage' ? 'Commission percentage' : 'Commission value'}
                name="commissionTransactionFeeValue"
                value={form.commissionTransactionFeeValue}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <TextField
                select
                label="Ledger Fees"
                name="ledgerFeesType"
                value={form.ledgerFeesType}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              >
                <MenuItem value="value">value</MenuItem>
                <MenuItem value="percentage">percentage</MenuItem>
              </TextField>
              <TextField
                label={form.ledgerFeesType === 'percentage' ? 'Ledger percentage' : 'Ledger value'}
                name="ledgerFeesValue"
                value={form.ledgerFeesValue}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <TextField
                select
                label="Penalty"
                name="penaltyType"
                value={form.penaltyType}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              >
                <MenuItem value="value">value</MenuItem>
                <MenuItem value="percentage">percentage</MenuItem>
              </TextField>
              <TextField
                label={form.penaltyType === 'percentage' ? 'Penalty percentage' : 'Penalty value'}
                name="penaltyValue"
                value={form.penaltyValue}
                onChange={handleFieldChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <FormControl sx={{ flex: '1 1 100%', minWidth: 300 }}>
                <FormLabel>saving interst calculation Method</FormLabel>
                <RadioGroup
                  row
                  name="savingInterestCalculationMethod"
                  value={form.savingInterestCalculationMethod}
                  onChange={handleFieldChange}
                >
                  <FormControlLabel value="minimal balance" control={<Radio />} label="Mininal balance" />
                  <FormControlLabel value="maximum balance" control={<Radio />} label="maximum balance" />
                  <FormControlLabel value="average balance" control={<Radio />} label="average balance" />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSave} disabled={!canSave || isSaving}>
                {isSaving ? 'Saving...' : editingProductId ? 'Update product' : 'Save product'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Main category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Product name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Product scope</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Interest rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Min amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Max amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    No saved products.
                  </TableCell>
                </TableRow>
              ) : (
                savedProducts.map((row, index) => (
                  <TableRow
                    key={`${row.id || row.productName || 'product'}-${index}`}
                    hover
                    onClick={() => openEditFromGrid(row)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: editingProductId && editingProductId === row.id ? 'primary.50' : 'inherit',
                    }}
                  >
                    <TableCell>{row.mainCategory || '-'}</TableCell>
                    <TableCell>{row.productName || '-'}</TableCell>
                    <TableCell>{row.productScope || '-'}</TableCell>
                    <TableCell>{row.interestRate || '-'}</TableCell>
                    <TableCell>{row.minimumAmount || '-'}</TableCell>
                    <TableCell>{row.maximumAmount || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={addMainCategoryOpen} onClose={() => setAddMainCategoryOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add main catergory</DialogTitle>
        <DialogContent>
          <TextField
            label="Main catergory"
            value={newMainCategory}
            onChange={(e) => setNewMainCategory(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMainCategoryOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addMainCategory}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addProductNameOpen} onClose={() => setAddProductNameOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add prodcut name</DialogTitle>
        <DialogContent>
          <TextField
            label="Prodcut name"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddProductNameOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addProductName}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
