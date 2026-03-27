import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import logo from '../../../assets/company-logo.jpg';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

const todayIso = new Date().toISOString().split('T')[0];
const defaultProfileImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="130" viewBox="0 0 180 130"><rect width="180" height="130" fill="#f1f5f9"/><circle cx="90" cy="48" r="18" fill="#cbd5e1"/><rect x="52" y="76" width="76" height="30" rx="15" fill="#cbd5e1"/></svg>',
)}`;

const mockMembers = [
  {
    memberCode: 'MEM001',
    payrollNumber: 'PAY001',
    profilePicture: 'https://i.pravatar.cc/120?img=12',
    phoneNumber: '2207001111',
    email: 'member001@sdf.org',
    accounts: [
      { accountType: 'Regular Account', accountNumber: 'REG-0001', accountBalance: '12,500.00' },
      { accountType: 'Saving Account', accountNumber: 'SAV-0001', accountBalance: '22,300.00' },
    ],
  },
  {
    memberCode: 'MEM002',
    payrollNumber: 'PAY002',
    profilePicture: 'https://i.pravatar.cc/120?img=32',
    phoneNumber: '2207112222',
    email: 'member002@sdf.org',
    accounts: [
      { accountType: 'Regular Account', accountNumber: 'REG-0002', accountBalance: '8,400.00' },
      { accountType: 'Saving Account', accountNumber: 'SAV-0002', accountBalance: '15,900.00' },
    ],
  },
];

const makeWithdrawalRow = (account, index) => ({
  id: `${account.accountNumber}-${index}`,
  selected: index === 0,
  accountType: account.accountType,
  accountNumber: account.accountNumber,
  paymentMade: '',
  principle: '',
  interest: '',
  beginBalance: account.accountBalance,
  endBalance: account.accountBalance,
  outstandingBalance: account.accountBalance,
  order: '',
});

export default function Withdrawal() {
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    transactionType: 'withdrawal',
    memberCode: '',
    payrollNumber: '',
    profilePicture: '',
    phoneNumber: '',
    email: '',
    postingAccount: '',
    accountBalance: '',
    accountNumber: '',
    clearedBalance: '',
    unclearedBalance: '',
    referenceNumber: '',
    printReceipt: false,
    transactionDate: todayIso,
    sendSmsFee: false,
    feeAmount: '',
    withdrawalAmount: '',
    comments: '',
    depositType: 'cash',
    contraAccount: '',
    checkNumber: '',
    checkDate: todayIso,
  });

  const [rows, setRows] = useState([]);

  const applyMemberData = (member) => {
    const nextRows = member.accounts.map((account, index) => makeWithdrawalRow(account, index));
    const selectedAccount = member.accounts[0];

    setRows(nextRows);
    setFormData((prev) => ({
      ...prev,
      memberCode: member.memberCode,
      payrollNumber: member.payrollNumber,
      profilePicture: member.profilePicture,
      phoneNumber: member.phoneNumber,
      email: member.email,
      accountNumber: selectedAccount?.accountNumber || '',
      accountBalance: selectedAccount?.accountBalance || '',
      clearedBalance: selectedAccount?.accountBalance || '',
      unclearedBalance: '0.00',
    }));
  };

  const searchMember = async (searchBy) => {
    const rawValue = searchBy === 'memberCode' ? formData.memberCode : formData.payrollNumber;
    if (!rawValue.trim()) {
      return;
    }

    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      const lookup = rawValue.trim().toUpperCase();
      const member = mockMembers.find((item) => {
        if (searchBy === 'memberCode') {
          return item.memberCode.toUpperCase() === lookup;
        }
        return item.payrollNumber.toUpperCase() === lookup;
      });

      if (!member) {
        setRows([]);
        setFormData((prev) => ({
          ...prev,
          profilePicture: '',
          phoneNumber: '',
          email: '',
          accountBalance: '',
          accountNumber: '',
          clearedBalance: '',
          unclearedBalance: '',
        }));
        setStatusMessage('Member not found for provided search details.');
        setStatusError(true);
        return;
      }

      applyMemberData(member);
      setStatusMessage('Member accounts and contact details loaded successfully.');
      setStatusError(false);
    } catch {
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? value.format('YYYY-MM-DD') : '',
    }));
  };

  const handleSelectRow = (rowId) => {
    setRows((prevRows) => {
      const nextRows = prevRows.map((row) => ({ ...row, selected: row.id === rowId }));
      const selected = nextRows.find((row) => row.selected);
      setFormData((prev) => ({
        ...prev,
        accountNumber: selected?.accountNumber || '',
        accountBalance: selected?.beginBalance || '',
        clearedBalance: selected?.beginBalance || '',
      }));
      return nextRows;
    });
  };

  const selectedAccountLabel = useMemo(() => rows.find((row) => row.selected)?.accountType || '-', [rows]);

  const handleSaveWithdrawal = async () => {
    const selectedRow = rows.find((row) => row.selected);

    if (!selectedRow) {
      setStatusMessage('Please select an account (Regular or Saving) from the grid.');
      setStatusError(true);
      return;
    }

    if (!formData.postingAccount || !formData.withdrawalAmount || !formData.transactionDate) {
      setStatusMessage('Posting Account, Withdrawal Amount and Transaction Date are required.');
      setStatusError(true);
      return;
    }

    if (formData.transactionDate > todayIso) {
      setStatusMessage('Transaction Date cannot be in the future.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const payload = {
        ...formData,
        selectedAccountType: selectedRow.accountType,
        selectedAccountNumber: selectedRow.accountNumber,
        accountAllocations: rows.map((row) => ({
          accountType: row.accountType,
          accountNumber: row.accountNumber,
          selected: row.selected,
          paymentMade: row.paymentMade,
          principle: row.principle,
          interest: row.interest,
          beginBalance: row.beginBalance,
          endBalance: row.endBalance,
          outstandingBalance: row.outstandingBalance,
          order: row.order,
        })),
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row: payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to save withdrawal.');
      }

      setStatusMessage('Withdrawal saved successfully.');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Member Administration / Withdrawal',
        action: 'Save Withdrawal',
        message: 'Withdrawal saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Failed to save withdrawal.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Withdrawal',
        action: 'Save Withdrawal',
        message: 'Failed to save withdrawal.',
        error,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    const selectedRow = rows.find((row) => row.selected);

    if (!selectedRow) {
      setStatusMessage('Please select an account before printing receipt.');
      setStatusError(true);
      return;
    }

    const receiptWindow = window.open('', '_blank', 'width=720,height=820');
    if (!receiptWindow) {
      setStatusMessage('Unable to open print window. Please allow pop-ups and try again.');
      setStatusError(true);
      return;
    }

    const now = new Date().toLocaleString();
    const infoRows = [
      ['Customer Code', formData.memberCode || '-'],
      ['Payroll Number', formData.payrollNumber || '-'],
      ['Account Type', selectedRow.accountType || '-'],
      ['Account Number', selectedRow.accountNumber || '-'],
      ['Posting Account', formData.postingAccount || '-'],
      ['Deposit Type', formData.depositType || '-'],
      ['Withdrawal Amount', formData.withdrawalAmount || '0.00'],
      ['Transaction Date', formData.transactionDate || '-'],
      ['Reference Number', formData.referenceNumber || '-'],
      ['Phone Number', formData.phoneNumber || '-'],
      ['Email', formData.email || '-'],
      ['Comments', formData.comments || '-'],
    ];

    const detailsHtml = infoRows
      .map(([label, value]) => `
        <div class="row">
          <span class="label">${label}</span>
          <span class="value">${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
        </div>
      `)
      .join('');

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Withdrawal Receipt</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Inter, Segoe UI, Arial, sans-serif;
              color: #102a43;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .shell {
              margin: 12px;
              border: 1px solid #d9e2ec;
              border-radius: 10px;
              overflow: hidden;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #dbe7f3;
              padding: 10px 12px;
              background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand-logo {
              width: 44px;
              height: 44px;
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #dbe7f3;
            }
            .brand-title {
              font-size: 16px;
              font-weight: 800;
            }
            .receipt-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f4c81;
            }
            .meta {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              background: #f8fbff;
              border-bottom: 1px solid #e4edf5;
              font-size: 11px;
              color: #486581;
            }
            .section {
              padding: 10px 12px;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px 12px;
            }
            .row {
              display: flex;
              flex-direction: column;
              border: 1px solid #e4edf5;
              border-radius: 6px;
              padding: 6px 8px;
              min-height: 50px;
            }
            .label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #486581;
              margin-bottom: 4px;
            }
            .value {
              font-size: 12px;
              font-weight: 600;
              color: #102a43;
              word-break: break-word;
            }
            @page {
              size: A4;
              margin: 8mm;
            }
          </style>
        </head>
        <body>
          <div class="shell">
            <div class="header">
              <div class="brand">
                <img class="brand-logo" src="${logo}" alt="Company logo" />
                <div class="brand-title">Microfinance Management</div>
              </div>
              <div class="receipt-title">Member Withdrawal Receipt</div>
            </div>
            <div class="meta">
              <span>Printed On: ${now}</span>
              <span>Receipt Ref: ${formData.referenceNumber || '-'}</span>
            </div>

            <div class="section">
              ${detailsHtml}
            </div>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Member Withdrawal
      </Typography>

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
                placeholder="e.g. MEM001"
              />
              <TextField
                label="Payroll Number"
                name="payrollNumber"
                value={formData.payrollNumber}
                onChange={handleChange}
                onBlur={() => searchMember('payrollNumber')}
                disabled={isLoadingMember}
                placeholder="e.g. PAY001"
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src={formData.profilePicture || defaultProfileImage}
                  alt="Member profile"
                  sx={{
                    width: 180,
                    height: 130,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    objectFit: 'cover',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Member profile picture
                </Typography>
              </Box>
              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                InputProps={{ readOnly: true }}
                disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {statusMessage && (
        <Typography
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: statusError ? 'error.light' : 'success.light',
            color: statusError ? 'error.dark' : 'success.dark',
          }}
        >
          {statusMessage}
        </Typography>
      )}

      <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Withdrawal Information
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Selected account to withdraw from: {selectedAccountLabel}
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              label="Transcation Type"
              name="transactionType"
              value={formData.transactionType}
              InputProps={{ readOnly: true }}
            />
            <TextField select label="Posting Account" name="postingAccount" value={formData.postingAccount} onChange={handleChange}>
              <MenuItem value="">Select posting account</MenuItem>
              <MenuItem value="MAIN-CASH">Main Cash</MenuItem>
              <MenuItem value="TELLER-CASH">Teller Cash</MenuItem>
              <MenuItem value="BANK-CLEARING">Bank Clearing</MenuItem>
            </TextField>

            <TextField label="Account Balance" name="accountBalance" value={formData.accountBalance} onChange={handleChange} />
            <TextField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
            <TextField label="Cleared Balance" name="clearedBalance" value={formData.clearedBalance} onChange={handleChange} />

            <TextField label="Uncleared Balance" name="unclearedBalance" value={formData.unclearedBalance} onChange={handleChange} />
            <TextField label="Reference Number" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} />

            <FormControlLabel
              control={<Checkbox name="printReceipt" checked={formData.printReceipt} onChange={handleChange} />}
              label="Check to print receipt"
            />
            <DatePicker
              label="Transaction Date"
              value={formData.transactionDate ? dayjs(formData.transactionDate) : null}
              onChange={(value) => handleDateChange('transactionDate', value)}
              maxDate={dayjs(todayIso)}
              slotProps={{ textField: { name: 'transactionDate' } }}
            />

            <FormControlLabel
              control={<Checkbox name="sendSmsFee" checked={formData.sendSmsFee} onChange={handleChange} />}
              label="Check to send SMS fee"
            />
            <TextField label="Fee Amount" name="feeAmount" value={formData.feeAmount} onChange={handleChange} />

            <TextField label="Withdrawal Amount" name="withdrawalAmount" value={formData.withdrawalAmount} onChange={handleChange} />
            <TextField label="Comments" name="comments" value={formData.comments} onChange={handleChange} />

            <TextField select label="Deposit Type" name="depositType" value={formData.depositType} onChange={handleChange}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
              <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
            </TextField>
            <TextField label="Contra Account" name="contraAccount" value={formData.contraAccount} onChange={handleChange} />

            <TextField label="Check Number" name="checkNumber" value={formData.checkNumber} onChange={handleChange} />
            <DatePicker
              label="Check Date"
              value={formData.checkDate ? dayjs(formData.checkDate) : null}
              onChange={(value) => handleDateChange('checkDate', value)}
              maxDate={dayjs(todayIso)}
              slotProps={{ textField: { name: 'checkDate' } }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleSaveWithdrawal} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Withdrawal'}
            </Button>
            <Button variant="outlined" onClick={handlePrintReceipt}>
              Print Receipt
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Withdrawal Accounts Grid
          </Typography>

          {rows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              Search by Customer Code or Payroll Number to load Regular and Saving accounts.
            </Typography>
          ) : (
            <div style={{ height: 300, width: '100%' }}>
              <DataGrid
                rows={rows.map((row) => ({
                  ...row,
                  _originalData: row,
                }))}
                columns={[
                  {
                    field: 'select',
                    headerName: 'Select',
                    flex: 0.15,
                    minWidth: 100,
                    sortable: false,
                    renderCell: (params) => (
                      <FormControlLabel
                        control={<Checkbox checked={params.row.selected} onChange={() => handleSelectRow(params.row.id)} />}
                        label={params.row.accountType}
                      />
                    ),
                  },
                  { field: 'paymentMade', headerName: 'Payment Made', flex: 0.1, minWidth: 100 },
                  { field: 'principle', headerName: 'Principle', flex: 0.1, minWidth: 100 },
                  { field: 'interest', headerName: 'Interest', flex: 0.1, minWidth: 100 },
                  { field: 'beginBalance', headerName: 'Begin Balance', flex: 0.12, minWidth: 120 },
                  { field: 'endBalance', headerName: 'End Balance', flex: 0.12, minWidth: 120 },
                  { field: 'outstandingBalance', headerName: 'Outstanding Balance', flex: 0.15, minWidth: 130 },
                  { field: 'order', headerName: 'Order', flex: 0.08, minWidth: 80 },
                ]}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                density="compact"
                sx={{
                  '& .MuiDataGrid-columnHeader': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 700,
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    backgroundColor: '#f8f9fa',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#e9ecef',
                  },
                  '& .MuiDataGrid-cell': {
                    borderColor: '#dee2e6',
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
