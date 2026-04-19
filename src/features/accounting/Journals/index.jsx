import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { useAuthStore } from '../../../store/authStore';
import { useInternalJournalAccounts } from '../../../hooks/useInternalJournalAccounts';

const initialFormData = {
  postingType: 'double-entry', // double-entry or batch-posting
  jvNumber: '',
  accountToDebit: '',
  batchTransactionDetails: '',
  accountToCredit: '',
  batchEntryDate: dayjs().format('YYYY-MM-DD'),
  batchNumber: '',
  batchDate: dayjs().format('YYYY-MM-DD'),
  batchAmount: '',
  debitCredit: 'debit',
  mainAccount: '',
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

export default function Journals() {
  const user = useAuthStore((state) => state.user);
  const { accounts: journalAccounts, loading: accountsLoading } = useInternalJournalAccounts();

  const [formData, setFormData] = useState(initialFormData);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [additionalBatchEntries, setAdditionalBatchEntries] = useState([]);
  const [gridData, setGridData] = useState(initialGridData);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

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
  };

  const handleDateChange = (fieldName, date) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: date ? dayjs(date).format('YYYY-MM-DD') : '',
    }));
  };

  const handleAddBatchEntry = () => {
    setAdditionalBatchEntries((prev) => [
      ...prev,
      {
        id: Date.now(),
        accountToDebit: '',
        batchTransactionDetails: '',
        accountToCredit: '',
        batchEntryDate: dayjs().format('YYYY-MM-DD'),
        uploadedFile: null,
      },
    ]);
  };

  const handleAdditionalBatchEntryChange = (id, field, value) => {
    setAdditionalBatchEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const handleRemoveBatchEntry = (id) => {
    setAdditionalBatchEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

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

  const handleSaveDetails = async () => {
    try {
      setIsSaving(true);
      // Validate required fields
      if (!formData.batchNumber) {
        setStatusMessage('Batch Number is required');
        setStatusError(true);
        return;
      }

      // Prepare payload
      const payload = {
        jvNumber: formData.jvNumber,
        postingType: formData.postingType,
        batchNumber: formData.batchNumber,
        batchDate: formData.batchDate,
        batchAmount: parseFloat(formData.batchAmount) || 0,
        debitCredit: formData.debitCredit,
        mainAccount: formData.mainAccount,
        transactionComments: formData.transactionComments,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        chequeNumber: formData.chequeNumber,
        chequeDate: formData.chequeDate,
        chequeAmount: parseFloat(formData.chequeAmount) || 0,
        totalDebit,
        totalCredit,
        gridData: gridData,
        accountDetails1: {
          accountNumber: formData.accountNumber1,
          amountDescription: formData.amountDescription1,
          budgetAmount: parseFloat(formData.budgetAmount1) || 0,
          variance: parseFloat(formData.variance1) || 0,
          totalExpense: parseFloat(formData.totalExpense1) || 0,
        },
        accountDetails2: {
          accountNumber: formData.accountNumber2,
          amountDescription: formData.amountDescription2,
          budgetAmount: parseFloat(formData.budgetAmount2) || 0,
          variance: parseFloat(formData.variance2) || 0,
          totalExpense: parseFloat(formData.totalExpense2) || 0,
        },
      };

      console.log('Journal Details Payload:', payload);
      setStatusMessage('Journal details saved successfully (preview mode)');
      setStatusError(false);
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving journal details:', error);
      setStatusMessage('Error saving journal details: ' + error.message);
      setStatusError(true);
      setIsSaving(false);
    }
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

      {/* Batch Posting Card */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, p: 2, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
            Batch Posting
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`Total Debit: D ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: 700, fontSize: '0.95rem', height: 36, px: 1 }}
            />
            <Chip
              label={`Total Credit: D ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.95rem', height: 36, px: 1 }}
            />
            <Button variant="outlined" size="small" onClick={handleAddBatchEntry}>
              Add More Batch Posting
            </Button>
          </Box>
        </Box>
        <CardContent>
          {/* Entry 1 (primary) */}
          <Grid container spacing={2}>
            <Grid>
              <TextField
                select
                label="Account to Debit"
                name="accountToDebit"
                value={formData.accountToDebit}
                onChange={handleChange}
                fullWidth
                size="small"
                disabled={accountsLoading}
              >
                <MenuItem value="">Select Account</MenuItem>
                {journalAccounts.map((acc, idx) => (
                  <MenuItem key={acc.Acctcode || acc.id || idx} value={acc.Acctcode || acc.id || ''}>
                    {acc.AcctName || acc.accountName || acc.name || acc.Acctcode}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid>
              <TextField
                label="Transaction Details"
                name="batchTransactionDetails"
                value={formData.batchTransactionDetails}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Enter transaction details"
              />
            </Grid>
            <Grid>
              <TextField
                select
                label="Account to Credit"
                name="accountToCredit"
                value={formData.accountToCredit}
                onChange={handleChange}
                fullWidth
                size="small"
                disabled={accountsLoading}
              >
                <MenuItem value="">Select Account</MenuItem>
                {journalAccounts.map((acc, idx) => (
                  <MenuItem key={acc.Acctcode || acc.id || idx} value={acc.Acctcode || acc.id || ''}>
                    {acc.AcctName || acc.accountName || acc.name || acc.Acctcode}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid>
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
            </Grid>
            <Grid>
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
            </Grid>
          </Grid>

          {/* Additional batch entries */}
          {additionalBatchEntries.map((entry, index) => (
            <Box
              key={entry.id}
              sx={{
                mt: 3,
                pt: 3,
                borderTop: '2px dashed #e0e0e0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                  Batch Posting {index + 2}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveBatchEntry(entry.id)}
                >
                  Remove
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid>
                  <TextField
                    select
                    label="Account to Debit"
                    value={entry.accountToDebit}
                    onChange={(e) => handleAdditionalBatchEntryChange(entry.id, 'accountToDebit', e.target.value)}
                    fullWidth
                    size="small"
                    disabled={accountsLoading}
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {journalAccounts.map((acc, idx) => (
                      <MenuItem key={acc.Acctcode || acc.id || idx} value={acc.Acctcode || acc.id || ''}>
                        {acc.AcctName || acc.accountName || acc.name || acc.Acctcode}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid>
                  <TextField
                    label="Transaction Details"
                    value={entry.batchTransactionDetails}
                    onChange={(e) => handleAdditionalBatchEntryChange(entry.id, 'batchTransactionDetails', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Enter transaction details"
                  />
                </Grid>
                <Grid>
                  <TextField
                    select
                    label="Account to Credit"
                    value={entry.accountToCredit}
                    onChange={(e) => handleAdditionalBatchEntryChange(entry.id, 'accountToCredit', e.target.value)}
                    fullWidth
                    size="small"
                    disabled={accountsLoading}
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {journalAccounts.map((acc, idx) => (
                      <MenuItem key={acc.Acctcode || acc.id || idx} value={acc.Acctcode || acc.id || ''}>
                        {acc.AcctName || acc.accountName || acc.name || acc.Acctcode}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid>
                  <TextField
                    label="Date"
                    value={entry.batchEntryDate}
                    onChange={(e) => handleAdditionalBatchEntryChange(entry.id, 'batchEntryDate', e.target.value)}
                    fullWidth
                    size="small"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ height: 40, textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    {entry.uploadedFile ? entry.uploadedFile.name : 'Upload Document'}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handleAdditionalBatchEntryChange(entry.id, 'uploadedFile', e.target.files[0] || null)}
                    />
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Posting Type Radio Buttons */}
      {/* Posting Type card removed as requested */}

      {/* Batch Header Details */}
      <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Batch Header Details
          </Typography>

          <Grid container spacing={2}>
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
                value={formData.debitCredit}
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
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditIcon />}
          onClick={handleUpdateJournal}
          disabled={isSaving}
          sx={{ fontWeight: 600 }}
        >
          Update Journal
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to update this journal entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmUpdate}
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
