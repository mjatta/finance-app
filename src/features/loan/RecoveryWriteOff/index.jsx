import React, { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Paper, Skeleton, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { CURRENCY_SYMBOL, formatCurrency } from '../../../utils/currencyFormatter';
import { useRecoveryWriteOffClients } from './hooks/useRecoveryWriteOffClients';
import { useLoanDetails } from './hooks/useLoanDetails';
import { useMemberSavings } from './hooks/useMemberSavings';
import { useMemberShares } from './hooks/useMemberShares';
import { useBadDebtExpenses } from './hooks/useBadDebtExpenses';
import { useSavingsSharesDetails } from './hooks/useSavingsSharesDetails';
import { useLoanBadDebtExpenses } from './hooks/useLoanBadDebtExpenses';
import { useProcessBadDebt } from './hooks/useProcessBadDebt';

export default function RecoveryWriteOff() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { rows, isLoading, error } = useRecoveryWriteOffClients(refreshKey);
  const [selectedId, setSelectedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isBadDebtSubmitting, setIsBadDebtSubmitting] = useState(false);
  const [badDebtError, setBadDebtError] = useState(null);

  const { processBadDebt } = useProcessBadDebt();

  const normalizedRows = useMemo(
    () => rows.map((row) => ({
      id: row.LoanId,
      customerCode: row.CustCode || '',
      customerName: row.MemberName || '',
      loanType: row.LoanType || '',
      loanAmount: Number(row.PrincipalAmount ?? 0),
      approvalDate: row.IssuedDate || null,
      loanNumber: row.MemberAccount || '',
      initialPrincipal: Number(row.InitialPrincipal ?? row.PrincipalAmount ?? 0),
      grossInterest: Number(row.GrossInterest ?? 0),
      totalAmount: Number(row.TotalAmount ?? row.PrincipalAmount ?? 0),
      loanBalance: Number(row.LoanBalance ?? row.PrincipalAmount ?? 0),
      currentInterest: Number(row.CurrentInterest ?? 0),
      accruedInterest: Number(row.AccruedInterest ?? row.AccuredInterest ?? 0),
      totalOutstanding: Number(row.TotalOutstanding ?? row.PrincipalAmount ?? 0),
    })),
    [rows],
  );

  const selectedRow =
    normalizedRows.find((row) => row.id === selectedId) || normalizedRows[0] || null;

  // Fetch detailed loan info when a row is selected
  const { details: loanDetails, isLoading: detailsLoading } = useLoanDetails(
    selectedRow?.customerCode,
    selectedRow?.id,
  );

  // Fetch member savings and shares
  const { savings, isLoading: savingsLoading } = useMemberSavings(selectedRow?.customerCode);
  const { shares, isLoading: sharesLoading } = useMemberShares(selectedRow?.customerCode);

  // Extract account number from savings or shares response for details fetch
  const cacctnumb = savings?.cacctnumb || shares?.cacctnumb || null;

  // Fetch bad debt expenses
  const { badDebtExpenses, isLoading: badDebtLoading } = useBadDebtExpenses(selectedRow?.id);

  // Fetch savings/shares account details
  const { details: accountDetails, isLoading: accountDetailsLoading } = useSavingsSharesDetails(cacctnumb);

  const money = (value) => `${CURRENCY_SYMBOL} ${formatCurrency(Number(value || 0).toFixed(2))}`;

  // Parse principal amount from formatted string (e.g., "10,000.00" -> 10000)
  const parsePrincipal = (val) => {
    if (!val) return 0;
    const str = String(val).replace(/,/g, '');
    return Number(str) || 0;
  };

  // Build detail items, preferring fetched details if available
  const detailItems = [
    {
      label: 'Initial Principal',
      value: money(loanDetails?.PrincipalAmt ? parsePrincipal(loanDetails.PrincipalAmt) : selectedRow?.initialPrincipal),
    },
    {
      label: 'Gross Interest',
      value: money(loanDetails?.total_interest ? parsePrincipal(loanDetails.total_interest) : selectedRow?.grossInterest),
    },
    {
      label: 'Total Amount',
      value: money(
        loanDetails?.PrincipalAmt && loanDetails?.total_interest
          ? parsePrincipal(loanDetails.PrincipalAmt) + parsePrincipal(loanDetails.total_interest)
          : selectedRow?.totalAmount,
      ),
    },
    {
      label: 'Loan Balance',
      value: money(loanDetails?.savebal ? parsePrincipal(loanDetails.savebal) : selectedRow?.loanBalance),
    },
    {
      label: 'Current Interest',
      value: money(loanDetails?.total_interest ? parsePrincipal(loanDetails.total_interest) : selectedRow?.currentInterest),
    },
    {
      label: 'Accured Interest',
      value: money(selectedRow?.accruedInterest),
    },
    {
      label: 'Total Oustanding',
      value: money(selectedRow?.totalOutstanding),
    },
    {
      label: 'Savings Balance',
      value: savingsLoading ? <Skeleton width="100px" /> : money(savings?.SavingsBalance || savings?.savingsBalance || savings?.balance || 0),
    },
    {
      label: 'Shares Balance',
      value: sharesLoading ? <Skeleton width="100px" /> : money(shares?.SharesBalance || shares?.sharesBalance || shares?.balance || 0),
    },
  ];

  const handleConfirmWriteOff = async () => {
    if (!selectedRow?.id) {
      setSubmitError('No loan selected');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/loans/writeoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          LoanID: selectedRow.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to confirm write-off: ${response.status}`);
      }

      // Refresh the grid
      setRefreshKey((prev) => prev + 1);
      setSelectedId(null);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessBadDebt = async () => {
    if (!accountDetails?.AccountNumber || !badDebtExpenses?.LoansControlAccount) {
      setBadDebtError('Missing required account details');
      return;
    }

    setIsBadDebtSubmitting(true);
    setBadDebtError(null);

    try {
      // Use Savings Balance and Shares Balance from loan details
      const savingsBalance = savings?.SavingsBalance ? parsePrincipal(savings.SavingsBalance) : 0;
      const sharesBalance = shares?.SharesBalance ? parsePrincipal(shares.SharesBalance) : 0;
      const totalOutstanding = selectedRow?.totalOutstanding || 0;

      // First, call the Withdrawal/BadDebt endpoint
      await processBadDebt({
        accountNumber: accountDetails.AccountNumber,
        loansControlAccount: badDebtExpenses.LoansControlAccount,
        productId: badDebtExpenses.ProductId,
        savingsBalance,
        sharesBalance,
      });

      // Then, call the Loan Repayment InsertLoanRepayment endpoint
      const repaymentResult = await useLoanBadDebtExpenses(
        accountDetails.AccountNumber,
        badDebtExpenses.LoansControlAccount,
        badDebtExpenses.BadDebtExpense,
        badDebtExpenses.ProductId,
        savingsBalance,
        sharesBalance,
        totalOutstanding
      );

      if (!repaymentResult.success) {
        throw new Error(repaymentResult.error || 'Failed to insert loan repayment');
      }

      // Refresh the grid
      setRefreshKey((prev) => prev + 1);
      setSelectedId(null);
    } catch (err) {
      setBadDebtError(err.message);
    } finally {
      setIsBadDebtSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Box
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Recovery &amp; Write-off
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Process and manage loan recovery and write-offs for clients
        </Typography>
      </Box>

      <Paper sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <div style={{ height: 420, width: '100%' }}>
          <DataGrid
            rows={normalizedRows}
            columns={[
              { field: 'customerCode', headerName: 'Customer Code', flex: 1, minWidth: 130 },
              { field: 'customerName', headerName: 'Customer Name', flex: 1.4, minWidth: 180 },
              { field: 'loanType', headerName: 'Loan Type', flex: 1.1, minWidth: 150 },
              {
                field: 'loanAmount',
                headerName: 'Loan Amount',
                flex: 1,
                minWidth: 140,
                valueFormatter: (value) => money(value),
              },
              {
                field: 'approvalDate',
                headerName: 'Approval Date',
                flex: 1,
                minWidth: 130,
                valueFormatter: (value) => (value ? dayjs(value).format('YYYY-MM-DD') : ''),
              },
              { field: 'loanNumber', headerName: 'Loan Number', flex: 1.2, minWidth: 170 },
            ]}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            density="compact"
            loading={isLoading}
            onRowClick={(params) => setSelectedId(params.row.id)}
            getRowClassName={(params) => (params.row.id === selectedRow?.id ? 'selected-row' : '')}
            sx={{
              cursor: 'pointer',
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              },
              '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
              '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
              '& .selected-row': { backgroundColor: '#cfe2ff !important', fontWeight: 700 },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {error ? 'Failed to load recovery/write-off clients.' : 'No records found.'}
                  </Typography>
                </Box>
              ),
              loadingOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={28} />
                </Box>
              ),
            }}
          />
        </div>
      </Paper>

      <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
            Loan Details
          </Typography>

          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {detailsLoading ? (
              <>
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
              </>
            ) : (
              detailItems.map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', minWidth: '110px' }}>
                    {item.label}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#34495e', fontSize: '0.95rem' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
          {submitError && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fee', border: '1px solid #fcc', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {submitError}
              </Typography>
            </Box>
          )}

          {badDebtError && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fee', border: '1px solid #fcc', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {badDebtError}
              </Typography>
            </Box>
          )}

          {selectedRow && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 1, border: '2px solid', borderColor: '#ff9800', backgroundColor: '#fff3e0', mt: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100', minWidth: '180px' }}>
                Loan Amount to be Written Off:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.95rem' }}>
                {money(Math.abs((selectedRow?.totalOutstanding || 0) - (savings?.SavingsBalance ? parsePrincipal(savings.SavingsBalance) : 0) - (shares?.SharesBalance ? parsePrincipal(shares.SharesBalance) : 0)))}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              disabled={!selectedRow || isSubmitting}
              onClick={handleConfirmWriteOff}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, paddingX: 3, boxShadow: 'none', textTransform: 'none' }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Confirm Loan Write Off'
              )}
            </Button>
            <Button
              variant="contained"
              disabled={!selectedRow || isBadDebtSubmitting || !accountDetails || !badDebtExpenses}
              onClick={handleProcessBadDebt}
              sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#45a049' }, fontWeight: 600, paddingX: 3, boxShadow: 'none', textTransform: 'none' }}
            >
              {isBadDebtSubmitting ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Bad Debt'
              )}
            </Button>
          </Box>        </CardContent>
      </Card>
    </Box>
  );
}
