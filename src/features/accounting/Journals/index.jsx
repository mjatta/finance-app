import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  RadioGroup,
  TextField,
  Typography,
  Alert,
  // Dialog imports removed (no longer used)
  MenuItem,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { useSaveJournal } from './hooks/useSaveJournal';

const initialFormData = {
  transactionComments: '',
  bankName: '',
  bankBranch: '',
  chequeNumber: '',
  chequeDate: dayjs().format('YYYY-MM-DD'),
  chequeAmount: '',
  accountNumber1: '',
  amountDescription1: '',
  budgetAmount1: '',
  variance1: '',
  totalExpense1: '',
  accountNumber2: '',
  amountDescription2: '',
  budgetAmount2: '',
  variance2: '',
  totalExpense2: '',
};

const initialGridData = [];

export default function SaveJournals() {
  const { saveJournal, isSaving, statusMessage, statusError } = useSaveJournal();

  const [formData, setFormData] = useState(initialFormData);
  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  // Removed unused cashDetails state
  const [uploadedFile, setUploadedFile] = useState(null);
  // Removed unused additionalBatchEntries state
  const [gridData, setGridData] = useState(initialGridData);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  // For dynamic Account Debit and Credit fields
  const [accountDebits, setAccountDebits] = useState([{ value: '' }]);
  const [accountCredits, setAccountCredits] = useState([{ value: '' }]);
  // Handlers for dynamic Account Debit fields
  const handleAccountDebitChange = (idx, value) => {
    setAccountDebits((prev) => prev.map((item, i) => i === idx ? { value } : item));
  };
  const handleAddAccountDebit = () => {
    setAccountDebits((prev) => prev.length < 4 ? [...prev, { value: '' }] : prev);
  };
  // Handlers for dynamic Account Credit fields
  const handleAccountCreditChange = (idx, value) => {
    setAccountCredits((prev) => prev.map((item, i) => i === idx ? { value } : item));
  };
  const handleAddAccountCredit = () => {
    setAccountCredits((prev) => prev.length < 4 ? [...prev, { value: '' }] : prev);
  };

  // Generate JV Number on mount
  useEffect(() => {
    const jvNumber = `JV-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;
    setFormData((prev) => ({ ...prev, jvNumber }));
  }, []);

  // Calculate totals when grid data changes
  useEffect(() => {
    const debitTotal = gridData.reduce((sum, row) => sum + (parseFloat(row.debitAmount) || 0), 0);
    const creditTotal = gridData.reduce((sum, row) => sum + (parseFloat(row.creditAmount) || 0), 0);
    setTotalDebit(debitTotal);
    setTotalCredit(creditTotal);
  }, [gridData]);

  const handleChange = (e) => {

    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Transaction Type logic for Transaction Details card
    if (name === 'transactionType') {
      if (value === 'cash') {
        setFormData((prev) => ({
          ...prev,
          cashAccount: user?.CashAccount || '',
          creditLimit: user?.CreditLimit != null ? String(user.CreditLimit) : '',
          debitLimit: user?.DebitLimit != null ? String(user.DebitLimit) : '',
          loanLimit: user?.LoanLimit != null ? String(user.LoanLimit) : '',
        }));
      } else if (value === 'cheque') {
        // Fetch banks immediately when Cheque is selected
        fetchBanks().then((result) => {
          if (result.success && result.data) setBanks(result.data);
        });
        setFormData((prev) => ({
          ...prev,
          bank: '',
          bankAccount: '',
          contraAccount: '',
        }));
        setBankAccounts([]);
      }
    }

    // Bank logic for Check Details (fetch bank accounts and reset account fields)
    if (name === 'bank') {
      setFormData((prev) => ({
        ...prev,
        bank: value,
        bankAccount: '',
        contraAccount: '',
      }));
      fetchBankAccounts(value).then((result) => {
        if (result.success && result.data) setBankAccounts(result.data);
      });
    }

    // Bank Account logic for Check Details (set contra account to selected bank account)
    if (name === 'bankAccount') {
      setFormData((prev) => ({
        ...prev,
        bankAccount: value,
        contraAccount: value,
      }));
    }
  };

  const handleDateChange = (fieldName, date) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: date ? dayjs(date).format('YYYY-MM-DD') : '',
    }));
  };

  // Removed unused batch entry handlers

  const handleAddRow = () => {    const newRow = {
      id: gridData.length + 1,
      uploadDocument: '',
      date: dayjs().format('YYYY-MM-DD'),
      transactionComments: '',
      accountDebit: '',
      debitAmount: '',
      accountCredit: '',
      creditAmount: '',
    };
    setGridData([...gridData, newRow]);
  };

  const handleDeleteRow = (id) => {
    setGridData(gridData.filter((row) => row.id !== id));
  };

  const handleGridChange = (id, field, value) => {
    setGridData(
      gridData.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveDetails = () => {
    saveJournal(gridData);
  };

  const handleUpdateJournal = () => {
    setOpenDialog(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      setIsSaving(true);
      const payload = {
        jvNumber: formData.jvNumber,
        postingType: formData.postingType,
        batchNumber: formData.batchNumber,
        batchDate: formData.batchDate,
        transactionComments: formData.transactionComments,
        gridData: gridData,
      };

      console.log('Update Journal Payload:', payload);
      setStatusMessage('Journal updated successfully (preview mode)');
      setStatusError(false);
      setOpenDialog(false);
      setIsSaving(false);
    } catch (error) {
      console.error('Error updating journal:', error);
      setStatusMessage('Error updating journal: ' + error.message);
      setStatusError(true);
      setIsSaving(false);
    }
  };

  const columns = [
    {
      field: 'uploadDocument',
      headerName: 'Upload Document',
      width: 120,
      editable: true,
      renderEditCell: (params) => (
        <TextField
          type="file"
          size="small"
          onChange={(e) =>
            handleGridChange(params.id, 'uploadDocument', e.target.value)
          }
        />
      ),
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      editable: true,
      type: 'date',
    },
    {
      field: 'transactionComments',
      headerName: 'Transaction Comments',
      width: 150,
      editable: true,
    },
    {
      field: 'accountDebit',
      headerName: 'Account (Debit)',
      width: 150,
      editable: true,
      renderCell: (params) => (
        <TextField
          select
          size="small"
          value={params.value || ''}
          onChange={(e) =>
            handleGridChange(params.id, 'accountDebit', e.target.value)
          }
        >
          <MenuItem value="">Select Account</MenuItem>
          <MenuItem value="1000">1000 - Cash</MenuItem>
          <MenuItem value="2000">2000 - Bank</MenuItem>
          <MenuItem value="3000">3000 - Receivables</MenuItem>
        </TextField>
      ),
    },
    {
      field: 'debitAmount',
      headerName: 'Debit Amount',
      width: 120,
      editable: true,
      type: 'number',
    },
    {
      field: 'accountCredit',
      headerName: 'Account (Credit)',
      width: 150,
      editable: true,
      renderCell: (params) => (
        <TextField
          select
          size="small"
          value={params.value || ''}
          onChange={(e) =>
            handleGridChange(params.id, 'accountCredit', e.target.value)
          }
        >
          <MenuItem value="">Select Account</MenuItem>
          <MenuItem value="4000">4000 - Income</MenuItem>
          <MenuItem value="5000">5000 - Payables</MenuItem>
          <MenuItem value="6000">6000 - Expenses</MenuItem>
        </TextField>
      ),
    },
    {
      field: 'creditAmount',
      headerName: 'Credit Amount',
      width: 120,
      editable: true,
      type: 'number',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={() => handleDeleteRow(params.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Journals
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Manage and post journal entries
          </Typography>
        </CardContent>
      </Card>

      {/* Batch Information Section */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
          Batch Information
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            label={`Total Debit: D ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: 700, fontSize: '0.95rem', height: 36, px: 1 }}
          />
          <Chip
            label={`Total Credit: D ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.95rem', height: 36, px: 1 }}
          />
        </Box>
      </Box>

      {/* Two Card Layout for Batch Posting */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        {/* Transaction Details Card */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
              Transaction Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Transaction Details"
                name="batchTransactionDetails"
                value={formData.batchTransactionDetails}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Enter transaction details"
              />
              <TextField
                label="Date"
                name="batchEntryDate"
                value={formData.batchEntryDate}
                onChange={(e) => handleDateChange('batchEntryDate', e.target.value)}
                fullWidth
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ height: 40, textTransform: 'none', justifyContent: 'flex-start' }}
              >
                {uploadedFile ? uploadedFile.name : 'Upload Document'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setUploadedFile(e.target.files[0] || null)}
                />
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
              Account Details
            </Typography>
            {/* Static account options for Account Debit and Credit dropdowns */}
            {(() => {
              const accountOptions = [
                { cacctnumb: "10000123101", displayName: "10000123101 Building Cost Banjulinding" },
                { cacctnumb: "10000123301", displayName: "10000123301 Building Cost Bundung Head Office" },
                { cacctnumb: "10000600001", displayName: "10000600001 Fixed Assets" },
                { cacctnumb: "10000600101", displayName: "10000600101 Land Cost @ Bijilo" },
                { cacctnumb: "10000600201", displayName: "10000600201 Building Cost" },
                { cacctnumb: "10000600301", displayName: "10000600301 Equipment Cost" },
                { cacctnumb: "10000600401", displayName: "10000600401 Furniture Cost" },
                { cacctnumb: "10000600501", displayName: "10000600501 M/ Vehicle And Motor Cycles Cost" },
                { cacctnumb: "10000600601", displayName: "10000600601 Credit Union Software" },
                { cacctnumb: "10000600701", displayName: "10000600701 Computer Cost" },
                { cacctnumb: "10000730101", displayName: "10000730101 Divideneds Paid On Shares" },
                { cacctnumb: "10100610001", displayName: "10100610001 Accumulated Depreciation" },
                { cacctnumb: "10100610101", displayName: "10100610101 Acc. Depre. Building" },
                { cacctnumb: "10100610201", displayName: "10100610201 Acc. Depre. Equipment" },
                { cacctnumb: "10100610301", displayName: "10100610301 Acc. Depre. Furniture" },
                { cacctnumb: "10100610401", displayName: "10100610401 Acc. Depre. Motor Vehicles /Cycles" },
                { cacctnumb: "10100610501", displayName: "10100610501 Acc. Depre. Software" },
                { cacctnumb: "10100610601", displayName: "10100610601 Acc. Depre. Computer" },
                // ... (add the rest of the payload here as needed)
              ];
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'flex-start' }}>
                  {accountDebits.map((item, idx) => (
                    <Box key={`account-debit-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <TextField
                        select
                        label={idx === 0 ? 'Account to Debit' : `Account to Debit ${idx + 1}`}
                        value={item.value}
                        onChange={e => handleAccountDebitChange(idx, e.target.value)}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="">Select Account</MenuItem>
                        {accountOptions.map((acc) => (
                          <MenuItem key={acc.cacctnumb} value={acc.cacctnumb}>
                            {acc.displayName}
                          </MenuItem>
                        ))}
                      </TextField>
                      {idx === accountDebits.length - 1 && accountDebits.length < 4 && (
                        <Button onClick={handleAddAccountDebit} variant="outlined" size="small" sx={{ minWidth: 36, p: 0, ml: 1 }}>
                          <span style={{ fontSize: 24, fontWeight: 700 }}>+</span>
                        </Button>
                      )}
                    </Box>
                  ))}
                  {accountCredits.map((item, idx) => (
                    <Box key={`account-credit-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <TextField
                        select
                        label={idx === 0 ? 'Account to Credit' : `Account to Credit ${idx + 1}`}
                        value={item.value}
                        onChange={e => handleAccountCreditChange(idx, e.target.value)}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="">Select Account</MenuItem>
                        {accountOptions.map((acc) => (
                          <MenuItem key={acc.cacctnumb} value={acc.cacctnumb}>
                            {acc.displayName}
                          </MenuItem>
                        ))}
                      </TextField>
                      {idx === accountCredits.length - 1 && accountCredits.length < 4 && (
                        <Button onClick={handleAddAccountCredit} variant="outlined" size="small" sx={{ minWidth: 36, p: 0, ml: 1 }}>
                          <span style={{ fontSize: 24, fontWeight: 700 }}>+</span>
                        </Button>
                      )}
                    </Box>
                  ))}
                </Box>
              );
            })()}
          </CardContent>
        </Card>
      </Box>

      {/* Posting Type Radio Buttons */}
      {/* Posting Type card removed as requested */}

      {/* Batch Header Details */}
      <Card sx={{ mb: 3, mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Batch Header Details
          </Typography>

          <Grid container spacing={2} columns={6}>
            <Grid>
              <TextField
                label="Batch Number"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                fullWidth
                size="small"
                required
              />
            </Grid>
            <Grid>
              <TextField
                label="Batch Date"
                name="batchDate"
                value={formData.batchDate}
                onChange={(e) => handleDateChange('batchDate', e.target.value)}
                fullWidth
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid>
              <TextField
                label="Batch Amount"
                name="batchAmount"
                value={formData.batchAmount}
                onChange={handleChange}
                fullWidth
                size="small"
                type="number"
              />
            </Grid>
            <Grid>
              <TextField
                select
                label="Debit/Credit"
                name="debitCredit"
                value={formData.debitCredit || ''}
                onChange={handleChange}
                fullWidth
                size="small"
              >
                <MenuItem value="debit">Debit</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </TextField>
            </Grid>
            <Grid>
              <TextField
                label="Main Account"
                name="mainAccount"
                value={formData.mainAccount}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid>
              <TextField
                label="Transaction Comments"
                name="transactionComments"
                value={formData.transactionComments}
                onChange={handleChange}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transaction Details Card */}
      <Grid container spacing={2} sx={{ mb: 3 }} columns={2}>
        <Grid>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Transaction Details
              </Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  select
                  label="Transaction Type"
                  name="transactionType"
                  value={formData.transactionType || ''}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  required
                >
                  <MenuItem value="">Select Transaction Type</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                </TextField>
                <TextField
                  label="Amount"
                  name="transactionAmount"
                  value={formData.transactionAmount || ''}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                  required
                  type="number"
                />
                {/* Date Picker for Transaction Details */}
                <TextField
                  label="Transaction Date"
                  name="transactionDate"
                  value={formData.transactionDate || ''}
                  onChange={e => handleDateChange('transactionDate', e.target.value)}
                  size="small"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Comments"
                  name="transactionComments2"
                  value={formData.transactionComments2 || ''}
                  onChange={handleChange}
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          {formData.transactionType === 'cash' && (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Cash Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Cash Account:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.cashAccount || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Credit Limit:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.creditLimit || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Debit Limit:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.debitLimit || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '140px' }}>
                      Loan Limit:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                      {formData.loanLimit || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
          {formData.transactionType === 'cheque' && (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                  Check Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    label="Check Number"
                    name="checkNumber"
                    value={formData.checkNumber || ''}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Check Date"
                    name="checkDate"
                    value={formData.checkDate || ''}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    select
                    label="Bank"
                    name="bank"
                    value={formData.bank || ''}
                    onChange={handleChange}
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
                    value={formData.bankAccount || ''}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">Select account</MenuItem>
                    {bankAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Contra Account"
                    name="contraAccount"
                    value={formData.contraAccount || ''}
                    onChange={handleChange}
                    size="small"
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Journal Entries card removed as requested */}

      {/* Check Details */}
      {/* Check Details card removed as requested */}

      {/* Account Details - Two Columns */}
      {/* Account Details 1, 2, and Check Details cards removed as requested */}

      {/* Status Message */}
      {statusMessage && (
        <Alert severity={statusError ? 'error' : 'success'} sx={{ mb: 3 }}>
          {statusMessage}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveDetails}
          disabled={isSaving}
          sx={{ fontWeight: 600 }}
        >
          {isSaving ? 'Saving...' : 'Save Details'}
        </Button>
      </Box>

      {/* Confirmation Dialog removed */}
    </Box>
  );
}
