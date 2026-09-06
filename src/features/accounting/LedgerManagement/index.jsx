import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Button,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import useGlManagement from './hooks/useGlManagement';
import useGlSubgroups from './hooks/useGlSubgroups';
import useGlAccountTransactions from './hooks/useGlAccountTransactions';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { downloadFile } from '../../../utils/downloadFile';

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
  ];

  const transactionColumns = [
    { field: 'postDate', headerName: 'Post Date', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', valueFormatter: (value) => value ? dayjs(value).format('DD-MM-YYYY') : '' },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 220, align: 'center', headerAlign: 'center' },
    { field: 'debit', headerName: 'Debit', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'credit', headerName: 'Credit', flex: 1, minWidth: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
    { field: 'newBalance', headerName: 'New Balance', flex: 1, minWidth: 140, align: 'center', headerAlign: 'center', renderCell: (p) => formatCurrency(p.value || 0) },
  ];

  const handleExportCSV = () => {
    const rows = Array.isArray(transactionsData?.Transactions) ? transactionsData.Transactions : [];
    const headers = ['Post Date', 'Description', 'Debit', 'Credit', 'New Balance'];
    const csvContent = [
      headers.join(','),
      ...rows.map(t => [
        dayjs(t.PostDate).format('DD-MM-YYYY'),
        `"${String(t.TransactionDescription || '').replace(/"/g, '""')}"`,
        Number(t.Debit || 0).toFixed(2),
        Number(t.Credit || 0).toFixed(2),
        Number(t.NewBalance || 0).toFixed(2),
      ].join(',')),
    ].join('\n');
    downloadFile(csvContent, `Account_Transactions_${selectedAccountNumber}_${dayjs().format('YYYY-MM-DD')}.csv`, 'text/csv');
  };

  const handleExportExcel = () => {
    const rows = Array.isArray(transactionsData?.Transactions) ? transactionsData.Transactions : [];
    const headers = ['Post Date', 'Description', 'Debit', 'Credit', 'New Balance'];
    const excelContent = [
      headers.join('\t'),
      ...rows.map(t => [
        dayjs(t.PostDate).format('DD-MM-YYYY'),
        String(t.TransactionDescription || ''),
        Number(t.Debit || 0).toFixed(2),
        Number(t.Credit || 0).toFixed(2),
        Number(t.NewBalance || 0).toFixed(2),
      ].join('\t')),
    ].join('\n');
    downloadFile(excelContent, `Account_Transactions_${selectedAccountNumber}_${dayjs().format('YYYY-MM-DD')}.xlsx`, 'application/vnd.ms-excel');
  };

  const handleExportPDF = () => {
    const rows = Array.isArray(transactionsData?.Transactions) ? transactionsData.Transactions : [];
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Account Transactions</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #333; margin-bottom: 20px; }
            .account-info { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #667eea; color: white; padding: 10px; text-align: center; font-weight: bold; }
            td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h2>Account Transactions Report</h2>
          <div class="account-info">
            <strong>Account Number:</strong> ${selectedAccountNumber}<br>
            <strong>Generated Date:</strong> ${dayjs().format('DD-MM-YYYY HH:mm:ss')}
          </div>
          <table>
            <thead>
              <tr>
                <th>Post Date</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>New Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(t => `
                <tr>
                  <td>${dayjs(t.PostDate).format('DD-MM-YYYY')}</td>
                  <td>${String(t.TransactionDescription || '')}</td>
                  <td>${Number(t.Debit || 0).toFixed(2)}</td>
                  <td>${Number(t.Credit || 0).toFixed(2)}</td>
                  <td>${Number(t.NewBalance || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    downloadFile(htmlContent, `Account_Transactions_${selectedAccountNumber}_${dayjs().format('YYYY-MM-DD')}.pdf`, 'application/pdf');
  };

  const handlePrintPDF = () => {
    try {
      const printedDate = dayjs().format('DD-MM-YYYY HH:mm');
      const tableRows = transactionRows.map((row) => `
        <tr>
          <td>${dayjs(row.postDate).format('DD-MM-YYYY')}</td>
          <td>${row.description}</td>
          <td style="text-align:right">${formatCurrency(row.debit)}</td>
          <td style="text-align:right">${formatCurrency(row.credit)}</td>
          <td style="text-align:right">${formatCurrency(row.newBalance)}</td>
        </tr>
      `).join('');

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Account Transactions</title><style>
    :root{--text:#0f172a;--muted:#475569;--line:#e6eef8;--header-bg:#f1f5f9}
    body{font-family:Segoe UI,Roboto,Arial,sans-serif;color:var(--text);margin:0;padding:20px;background:#fff}
    .report{max-width:1050px;margin:0 auto}
    .header{text-align:center;margin-bottom:12px;border-bottom:2px solid #ccc;padding-bottom:12px}
    .meta-right{position:absolute;right:20px;top:20px;font-size:12px;color:var(--muted)}
    .company{font-size:20px;font-weight:800;margin-bottom:4px}
    .report-type{font-size:12px;color:var(--muted);margin-bottom:8px}
    .line{font-size:13px;color:var(--muted);margin:2px 0}
    .account-info{display:flex;gap:40px;margin:12px 0;font-size:13px;color:var(--text)}
    .account-detail{display:flex;gap:8px}
    .account-detail-label{font-weight:700;color:var(--muted)}
    .title{margin-top:8px;font-size:16px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
    thead th{background:var(--header-bg);border:1px solid var(--line);padding:8px;text-align:left;font-weight:700}
    tbody td{border:1px solid var(--line);padding:7px;vertical-align:top}
    tbody tr:nth-child(even){background:#fbfdff}
    @media print{body{padding:8mm}}
  </style></head><body><div class="report"><div class="header"><div class="meta-right">Printed: ${printedDate}</div><div class="company">MicroFinance Application</div><div class="report-type">Account Transactions Report</div><div class="title">Account Transactions</div><div class="account-info"><div class="account-detail"><span class="account-detail-label">Account Number:</span><span>${selectedAccountNumber}</span></div></div></div><table><thead><tr><th>Post Date</th><th>Description</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">New Balance</th></tr></thead><tbody>${tableRows}</tbody></table></div></body></html>`;
      
      const w = window.open('', '_blank', 'width=1000,height=800');
      if (!w) throw new Error('Popup blocked');
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (err) {
      console.error(err);
    }
  };

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
                  '& .MuiDataGrid-footerContainer': { paddingLeft: '6px', paddingRight: '40px' },
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

        {accountBelongsToThisCard && transactionRows.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handlePrintPDF}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                paddingX: 3,
                paddingY: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  borderColor: '#5568d3',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                },
              }}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportCSV}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                paddingX: 3,
                paddingY: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  borderColor: '#5568d3',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                },
              }}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                paddingX: 3,
                paddingY: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  borderColor: '#5568d3',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                },
              }}
            >
              Excel
            </Button>
          </Box>
        )}
      </CardContent>
      </Collapse>
    </Card>
  );
}

export default function LedgerManagement() {
  const navigate = useNavigate();
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
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/reporting/trial-balance')}
            sx={{
              borderColor: '#667eea',
              color: '#667eea',
              fontWeight: 600,
              paddingX: 4,
              paddingY: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                borderColor: '#5568d3',
                backgroundColor: 'rgba(102, 126, 234, 0.04)',
              },
            }}
          >
            Trial Balance Report
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/reporting/income-statement')}
            sx={{
              borderColor: '#667eea',
              color: '#667eea',
              fontWeight: 600,
              paddingX: 4,
              paddingY: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                borderColor: '#5568d3',
                backgroundColor: 'rgba(102, 126, 234, 0.04)',
              },
            }}
          >
            Income Statement Report
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/reporting/balance-sheet')}
            sx={{
              borderColor: '#667eea',
              color: '#667eea',
              fontWeight: 600,
              paddingX: 4,
              paddingY: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                borderColor: '#5568d3',
                backgroundColor: 'rgba(102, 126, 234, 0.04)',
              },
            }}
          >
            Balance Sheet Report
          </Button>
        </Box>
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

