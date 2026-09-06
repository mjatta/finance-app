import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import useGlManagement from './hooks/useGlManagement';
import useGlSubgroups from './hooks/useGlSubgroups';
import useGlAccountTransactions from './hooks/useGlAccountTransactions';
import { formatCurrency } from '../../../utils/currencyFormatter';

function CategoryCard({ category, selectedSubGroupCode, onSelectSubGroup, accountsData, accountsLoading, selectedAccountNumber, onSelectAccount, transactionsData, transactionsLoading, isExpanded, onToggleExpand }) {
  const subGroupRows = (Array.isArray(category.SubGroups) ? category.SubGroups : []).map((sg, idx) => ({
    id: sg.SubGrpCode ?? idx,
    subGrpCode: sg.SubGrpCode,
    subGrpName: String(sg.SubGrpName || '').trim(),
  }));

  const belongsToThisCard = subGroupRows.some((r) => r.subGrpCode === selectedSubGroupCode);
  const accountBelongsToThisCard = belongsToThisCard && accountsData
    ? (Array.isArray(accountsData.Accounts) ? accountsData.Accounts : []).some((a) => a.AccountNumber === selectedAccountNumber)
    : false;

  const accountRows = belongsToThisCard && accountsData
    ? (Array.isArray(accountsData.Accounts) ? accountsData.Accounts : []).map((a, idx) => ({
        id: a.AccountNumber ?? idx,
        accountNumber: a.AccountNumber,
        accountName: a.AccountName,
        bookBalance: Number(a.BookBalance || 0),
        budgetAmount: Number(a.BudgetAmount || 0),
        actualAmount: Number(a.ActualAmount || 0),
      }))
    : [];

  const transactionRows = accountBelongsToThisCard
    ? (Array.isArray(transactionsData?.Transactions) ? transactionsData.Transactions : []).map((t, idx) => ({
        id: idx,
        postDate: t.PostDate,
        description: t.TransactionDescription,
        debit: Number(t.Debit || 0),
        credit: Number(t.Credit || 0),
        newBalance: Number(t.NewBalance || 0),
      }))
    : [];

  const subGroupColumns = [
    { field: 'subGrpCode', headerName: 'Sub Group Code', flex: 1, minWidth: 130, align: 'center', headerAlign: 'center' },
    { field: 'subGrpName', headerName: 'Sub Group Name', flex: 2, minWidth: 200, align: 'center', headerAlign: 'center' },
  ];

  const accountColumns = [
    { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 150, align: 'center', headerAlign: 'center' },
    { field: 'accountName', headerName: 'Account Name', flex: 2, minWidth: 200, align: 'center', headerAlign: 'center' },
    { field: 'bookBalance', headerName: 'Book Balance', flex: 1, minWidth: 130, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'budgetAmount', headerName: 'Budget Amount', flex: 1, minWidth: 130, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'actualAmount', headerName: 'Actual Amount', flex: 1, minWidth: 130, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
  ];

  const transactionColumns = [
    { field: 'postDate', headerName: 'Post Date', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', valueFormatter: (value) => value ? dayjs(value).format('DD-MM-YYYY') : '' },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 220, align: 'center', headerAlign: 'center' },
    { field: 'debit', headerName: 'Debit', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'credit', headerName: 'Credit', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'newBalance', headerName: 'New Balance', flex: 1, minWidth: 140, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
  ];

  return (
    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={onToggleExpand}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {category.Code} - {String(category.CategoryName || '').trim()}
        </Typography>
        <IconButton size="small" sx={{ color: 'primary.contrastText' }}>
          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
              Sub Groups
            </Typography>
            <div style={{ height: 320, width: '100%' }}>
              <DataGrid
                rows={subGroupRows}
                columns={subGroupColumns}
                density="compact"
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                rowSelectionModel={{ type: 'include', ids: belongsToThisCard && selectedSubGroupCode != null ? new Set([selectedSubGroupCode]) : new Set() }}
                onRowClick={(params) => onSelectSubGroup(params.row.subGrpCode)}
                getRowClassName={(params) => (belongsToThisCard && params.row.subGrpCode === selectedSubGroupCode ? 'selected-row' : '')}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeader': { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700 },
                  '& .selected-row': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12) !important',
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.2) !important' },
                  },
                }}
              />
            </div>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
              Accounts {belongsToThisCard && selectedSubGroupCode != null ? `(Sub Group ${selectedSubGroupCode})` : ''}
            </Typography>
            <div style={{ height: 320, width: '100%', position: 'relative' }}>
              {belongsToThisCard && accountsLoading && (
                <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <DataGrid
                rows={accountRows}
                columns={accountColumns}
                density="compact"
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                rowSelectionModel={{ type: 'include', ids: selectedAccountNumber ? new Set([selectedAccountNumber]) : new Set() }}
                onRowClick={(params) => onSelectAccount(params.row.accountNumber)}
                getRowClassName={(params) => (params.row.accountNumber === selectedAccountNumber ? 'selected-row' : '')}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeader': { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700 },
                  '& .selected-row': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12) !important',
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.2) !important' },
                  },
                }}
              />
            </div>
          </Box>
        </Box>

        {accountBelongsToThisCard && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
              Account Transactions - {selectedAccountNumber}
            </Typography>
            <div style={{ height: 350, width: '100%', position: 'relative' }}>
              {transactionsLoading && (
                <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <DataGrid
                rows={transactionRows}
                columns={transactionColumns}
                density="compact"
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeader': { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700 },
                }}
              />
            </div>
          </Box>
        )}
      </CardContent>
      </Collapse>
    </Card>
  );
}

export default function LedgerManagement() {
  const { fetchGlData, loading, error } = useGlManagement();
  const { fetchSubgroupAccounts, loading: accountsLoading } = useGlSubgroups();
  const { fetchAccountTransactions, loading: transactionsLoading } = useGlAccountTransactions();

  const [glData, setGlData] = useState(null);
  const [selectedSubGroupCode, setSelectedSubGroupCode] = useState(null);
  const [accountsData, setAccountsData] = useState(null);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set([0])); // Only first category expanded on load

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      const data = await fetchGlData(30);
      if (data && mounted) {
        setGlData(data);
        setExpandedCategories(new Set([0])); // Keep first category expanded
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleSelectSubGroup = async (subGroupCode) => {
    setSelectedSubGroupCode(subGroupCode);
    setSelectedAccountNumber(null);
    setTransactionsData(null);
    const data = await fetchSubgroupAccounts(subGroupCode);
    if (data) {
      setAccountsData(data);
    }
  };

  const handleSelectAccount = async (accountNumber) => {
    setSelectedAccountNumber(accountNumber);
    const data = await fetchAccountTransactions(accountNumber, 30);
    if (data) {
      setTransactionsData(data);
    }
  };

  const handleToggleCategoryExpand = (categoryIndex) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryIndex)) {
      newExpanded.delete(categoryIndex);
    } else {
      newExpanded.add(categoryIndex);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const caption = glData?.Caption || 'General Ledger Management';
  const categories = glData?.Categories || [];
  const financialPeriod = glData?.FinancialPeriod || {};

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            {caption}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Chart of Accounts and General Ledger Management
          </Typography>
        </CardContent>
      </Card>

      {financialPeriod && (
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Financial Period Start:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.StartDate
                    ? new Date(financialPeriod.StartDate).toISOString().split('T')[0]
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Financial Period End:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.EndDate
                    ? new Date(financialPeriod.EndDate).toISOString().split('T')[0]
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Number of Periods:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.NumberOfPeriods || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Current Period:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.CurrentPeriod || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {Array.isArray(categories) && categories.length > 0 ? (
        categories.map((category, idx) => (
          <CategoryCard
            key={idx}
            category={category}
            selectedSubGroupCode={selectedSubGroupCode}
            onSelectSubGroup={handleSelectSubGroup}
            accountsData={accountsData}
            accountsLoading={accountsLoading}
            selectedAccountNumber={selectedAccountNumber}
            onSelectAccount={handleSelectAccount}
            transactionsData={transactionsData}
            transactionsLoading={transactionsLoading}
            isExpanded={expandedCategories.has(idx)}
            onToggleExpand={() => handleToggleCategoryExpand(idx)}
          />
        ))
      ) : (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography sx={{ textAlign: 'center', py: 4, color: '#999' }}>
              No categories available
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

