import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import dayjs from 'dayjs';
import { useSaveJournal } from './hooks/useSaveJournal';
import { useGetBanks } from '../../member/DepositManagement/hooks/useGetBanks';
import { useGetBankAccounts } from '../../member/DepositManagement/hooks/useGetBankAccounts';
import { useGetInternalJournalAccounts } from './hooks/useGetInternalJournalAccounts';

const fallbackAccountOptions = [
  { cacctnumb: '10000123101', displayName: '10000123101 Building Cost Banjulinding' },
  { cacctnumb: '10000123301', displayName: '10000123301 Building Cost Bundung Head Office' },
  { cacctnumb: '10000600001', displayName: '10000600001 Fixed Assets' },
  { cacctnumb: '10000600101', displayName: '10000600101 Land Cost @ Bijilo' },
  { cacctnumb: '10000600201', displayName: '10000600201 Building Cost' },
  { cacctnumb: '10000600301', displayName: '10000600301 Equipment Cost' },
  { cacctnumb: '10000600401', displayName: '10000600401 Furniture Cost' },
  { cacctnumb: '10000600501', displayName: '10000600501 M/ Vehicle And Motor Cycles Cost' },
  { cacctnumb: '10000600601', displayName: '10000600601 Credit Union Software' },
  { cacctnumb: '10000600701', displayName: '10000600701 Computer Cost' },
  { cacctnumb: '10000730101', displayName: '10000730101 Divideneds Paid On Shares' },
  { cacctnumb: '10100610001', displayName: '10100610001 Accumulated Depreciation' },
  { cacctnumb: '10100610101', displayName: '10100610101 Acc. Depre. Building' },
  { cacctnumb: '10100610201', displayName: '10100610201 Acc. Depre. Equipment' },
  { cacctnumb: '10100610301', displayName: '10100610301 Acc. Depre. Furniture' },
  { cacctnumb: '10100610401', displayName: '10100610401 Acc. Depre. Motor Vehicles /Cycles' },
  { cacctnumb: '10100610501', displayName: '10100610501 Acc. Depre. Software' },
  { cacctnumb: '10100610601', displayName: '10100610601 Acc. Depre. Computer' },
];

const paymentTypeOptions = ['cash', 'cheque'];

const createPaymentRow = () => ({ transactionType: '', amount: '' });

const createTransactionState = () => ({
  date: dayjs().format('YYYY-MM-DD'),
  transactionDescription: '',
  amount: '',
  account: '',
  uploadDocument: null,
  paymentDetails: [createPaymentRow()],
  chequeNumber: '',
  chequeDate: dayjs().format('YYYY-MM-DD'),
  bank: '',
  bankAccount: '',
  contraAccount: '',
});

const getPersistedUser = () => {
  try {
    const persisted = localStorage.getItem('microfinance-auth');
    if (!persisted) {
      return null;
    }
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user || null;
  } catch {
    return null;
  }
};

export default function SaveJournals() {
  const { saveJournal, isSaving, statusMessage, statusError } = useSaveJournal();
  const { fetchBanks } = useGetBanks();
  const { fetchBankAccounts } = useGetBankAccounts();
  const {
    accounts: internalJournalAccounts,
    loading: internalJournalAccountsLoading,
  } = useGetInternalJournalAccounts();
  const [debitTransactions, setDebitTransactions] = useState([createTransactionState()]);
  const [creditTransactions, setCreditTransactions] = useState([createTransactionState()]);
  const [banksByCard, setBanksByCard] = useState({});
  const [bankAccountsByCard, setBankAccountsByCard] = useState({});

  const user = useMemo(() => getPersistedUser(), []);
  const accountOptions = useMemo(
    () => (internalJournalAccounts.length > 0 ? internalJournalAccounts : fallbackAccountOptions),
    [internalJournalAccounts],
  );
  const totalDebit = debitTransactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCredit = creditTransactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const hasEnteredBothAmounts =
    debitTransactions.some((item) => String(item.amount).trim() !== '')
    && creditTransactions.some((item) => String(item.amount).trim() !== '');
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001;
  const canSave = hasEnteredBothAmounts && isBalanced;

  const getSetter = (type) => (type === 'debit' ? setDebitTransactions : setCreditTransactions);
  const getTransactions = (type) => (type === 'debit' ? debitTransactions : creditTransactions);
  const getCardKey = (type, cardIndex) => `${type}-${cardIndex}`;

  const handleTransactionChange = (type, cardIndex, field, value) => {
    const setter = getSetter(type);
    setter((prev) => prev.map((item, idx) => (idx === cardIndex ? { ...item, [field]: value } : item)));
  };

  const handleUploadChange = (type, cardIndex, file) => {
    const setter = getSetter(type);
    setter((prev) => prev.map((item, idx) => (idx === cardIndex ? { ...item, uploadDocument: file || null } : item)));
  };

  const handlePaymentRowChange = (type, cardIndex, paymentIndex, field, value) => {
    const setter = getSetter(type);
    setter((prev) => prev.map((card, i) => (
      i === cardIndex
        ? {
          ...card,
          paymentDetails: card.paymentDetails.map((item, j) => (j === paymentIndex ? { ...item, [field]: value } : item)),
        }
        : card
    )));

    if (paymentIndex === 0 && field === 'transactionType') {
      const cardKey = getCardKey(type, cardIndex);
      if (value === 'cheque') {
        fetchBanks().then((result) => {
          if (result.success && Array.isArray(result.data)) {
            setBanksByCard((prev) => ({ ...prev, [cardKey]: result.data }));
          } else {
            setBanksByCard((prev) => ({ ...prev, [cardKey]: [] }));
          }
        });
      } else {
        setBanksByCard((prev) => ({ ...prev, [cardKey]: [] }));
        setBankAccountsByCard((prev) => ({ ...prev, [cardKey]: [] }));
        const clearChequeFields = getSetter(type);
        clearChequeFields((prev) => prev.map((card, i) => (
          i === cardIndex
            ? {
              ...card,
              bank: '',
              bankAccount: '',
              contraAccount: '',
            }
            : card
        )));
      }
    }
  };

  const handleChequeFieldChange = (type, cardIndex, field, value) => {
    const setter = getSetter(type);
    const cardKey = getCardKey(type, cardIndex);

    if (field === 'bank') {
      setter((prev) => prev.map((card, i) => (
        i === cardIndex ? { ...card, bank: value, bankAccount: '', contraAccount: '' } : card
      )));
      if (!value) {
        setBankAccountsByCard((prev) => ({ ...prev, [cardKey]: [] }));
        return;
      }
      fetchBankAccounts(value).then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setBankAccountsByCard((prev) => ({ ...prev, [cardKey]: result.data }));
        } else {
          setBankAccountsByCard((prev) => ({ ...prev, [cardKey]: [] }));
        }
      });
      return;
    }

    if (field === 'bankAccount') {
      setter((prev) => prev.map((card, i) => (
        i === cardIndex ? { ...card, bankAccount: value, contraAccount: value } : card
      )));
      return;
    }

    setter((prev) => prev.map((card, i) => (i === cardIndex ? { ...card, [field]: value } : card)));
  };

  const handleAddTransactionCard = (type) => {
    const setter = getSetter(type);
    setter((prev) => [...prev, createTransactionState()]);
  };

  const handleSaveDetails = () => {
    const combinedDescription = [
      ...debitTransactions.map((item) => item.transactionDescription),
      ...creditTransactions.map((item) => item.transactionDescription),
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' | ');

    const firstDebitWithDate = debitTransactions.find((item) => item.date)?.date;
    const firstUpload = [...debitTransactions, ...creditTransactions].find((item) => item.uploadDocument?.name);

    const formData = {
      batchEntryDate: firstDebitWithDate || dayjs().format('YYYY-MM-DD'),
      batchTransactionDetails: combinedDescription || 'Combined Journal Posting',
      transactionDebitAmount: totalDebit,
      transactionCreditAmount: totalCredit,
      bookBalance: 0,
      uploadDocument: firstUpload?.uploadDocument?.name || '',
    };

    const accountDebits = debitTransactions
      .map((item) => String(item.account || '').trim())
      .filter(Boolean)
      .map((value) => ({ value }));
    const accountCredits = creditTransactions
      .map((item) => String(item.account || '').trim())
      .filter(Boolean)
      .map((value) => ({ value }));

    saveJournal(formData, accountDebits, accountCredits);
  };

  const renderCashOrChequeDetails = (type, cardIndex) => {
    const transaction = getTransactions(type)[cardIndex];
    const primaryPaymentType = transaction.paymentDetails[0]?.transactionType || '';
    const cardKey = getCardKey(type, cardIndex);

    if (primaryPaymentType === 'cash') {
      return (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: '#fafafa' }}>
          <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#2c3e50' }}>
              Cash Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Typography variant="body2"><strong>Cash Account:</strong> {user?.CashAccount || '-'}</Typography>
              <Typography variant="body2"><strong>Credit Limit:</strong> {user?.CreditLimit ?? '-'}</Typography>
              <Typography variant="body2"><strong>Debit Limit:</strong> {user?.DebitLimit ?? '-'}</Typography>
              <Typography variant="body2"><strong>Loan Limit:</strong> {user?.LoanLimit ?? '-'}</Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (primaryPaymentType === 'cheque') {
      return (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: '#fafafa' }}>
          <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#2c3e50' }}>
              Cheque Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                label="Cheque Number"
                size="small"
                value={transaction.chequeNumber}
                onChange={(e) => handleTransactionChange(type, 'chequeNumber', e.target.value)}
              />
              <TextField
                label="Cheque Date"
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={transaction.chequeDate}
                onChange={(e) => handleTransactionChange(type, 'chequeDate', e.target.value)}
              />
              <TextField
                label="Bank"
                select
                size="small"
                value={transaction.bank}
                onChange={(e) => handleChequeFieldChange(type, cardIndex, 'bank', e.target.value)}
              >
                <MenuItem value="">Select Bank</MenuItem>
                {(banksByCard[cardKey] || []).map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Bank Account"
                select
                size="small"
                value={transaction.bankAccount}
                onChange={(e) => handleChequeFieldChange(type, cardIndex, 'bankAccount', e.target.value)}
              >
                <MenuItem value="">Select Bank Account</MenuItem>
                {(bankAccountsByCard[cardKey] || []).map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Contra Account"
                size="small"
                value={transaction.contraAccount}
                onChange={(e) => handleTransactionChange(type, cardIndex, 'contraAccount', e.target.value)}
              />
            </Box>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const renderTransactionCard = (type, cardIndex, title, amountLabel, accountLabel) => {
    const transaction = getTransactions(type)[cardIndex];
    const addMoreLabel = type === 'debit' ? 'Add more Debit' : 'Add more Credit';
    const titleWithIndex = cardIndex === 0 ? title : `${title} ${cardIndex + 1}`;

    return (
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#2c3e50' }}>
              {titleWithIndex}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleAddTransactionCard(type)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
              title={`Add another ${title} card`}
            >
              {addMoreLabel}
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Date"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={transaction.date}
              onChange={(e) => handleTransactionChange(type, cardIndex, 'date', e.target.value)}
            />
            <TextField
              label="Transaction Description"
              size="small"
              value={transaction.transactionDescription}
              onChange={(e) => handleTransactionChange(type, cardIndex, 'transactionDescription', e.target.value)}
            />
            <TextField
              label={amountLabel}
              size="small"
              type="number"
              value={transaction.amount}
              onChange={(e) => handleTransactionChange(type, cardIndex, 'amount', e.target.value)}
            />
            <TextField
              select
              label={accountLabel}
              size="small"
              value={transaction.account}
              onChange={(e) => handleTransactionChange(type, cardIndex, 'account', e.target.value)}
              helperText={internalJournalAccountsLoading ? 'Loading account list...' : ''}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return 'Select Account';
                  }
                  const selectedAccount = accountOptions.find((acc) => acc.cacctnumb === selected);
                  return selectedAccount?.displayName || selected;
                },
              }}
            >
              <MenuItem value="" disabled>Select Account</MenuItem>
              {accountOptions.map((acc) => (
                <MenuItem key={acc.cacctnumb} value={acc.cacctnumb}>
                  {acc.displayName || acc.cacctnumb}
                </MenuItem>
              ))}
            </TextField>

            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ height: 40, textTransform: 'none', justifyContent: 'flex-start' }}
            >
              {transaction.uploadDocument?.name || 'Upload Document'}
              <input
                type="file"
                hidden
                onChange={(e) => handleUploadChange(type, cardIndex, e.target.files?.[0])}
              />
            </Button>

            <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
              Payment Details
            </Typography>
            {transaction.paymentDetails.map((row, idx) => (
              <Box key={`${type}-payment-${cardIndex}-${idx}`} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr' } }}>
                <TextField
                  select
                  label="Transaction Type"
                  size="small"
                  value={row.transactionType}
                  onChange={(e) => handlePaymentRowChange(type, cardIndex, idx, 'transactionType', e.target.value)}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  {paymentTypeOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ))}

            {renderCashOrChequeDetails(type, cardIndex)}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
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

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {debitTransactions.map((_, cardIndex) => (
            <Box key={`debit-card-${cardIndex}`}>
              {renderTransactionCard('debit', cardIndex, 'Debit Transaction', 'Debit Amount', 'Debit Account')}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {creditTransactions.map((_, cardIndex) => (
            <Box key={`credit-card-${cardIndex}`}>
              {renderTransactionCard('credit', cardIndex, 'Credit Transaction', 'Credit Amount', 'Credit Account')}
            </Box>
          ))}
        </Box>
      </Box>

      {statusMessage && (
        <Alert severity={statusError ? 'error' : 'success'} sx={{ my: 3 }}>
          {statusMessage}
        </Alert>
      )}

      {!isBalanced && (
        <Alert severity="warning" sx={{ my: 2 }}>
          Total Debit and Total Credit must be equal before you can save.
        </Alert>
      )}

      {!hasEnteredBothAmounts && (
        <Alert severity="info" sx={{ my: 2 }}>
          Enter both Debit Amount and Credit Amount to enable save.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveDetails}
          disabled={isSaving || !canSave}
          sx={{ fontWeight: 600 }}
        >
          {isSaving ? 'Saving...' : 'Save Details'}
        </Button>
      </Box>
    </Box>
  );
}
