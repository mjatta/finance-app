import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import logo from '../../../assets/company-logo.jpg';

export default function Reprint() {
  const [memberId, setMemberId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDeposits = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch('/api/deposits');
        if (!response.ok) {
          throw new Error('Failed to load deposits for reprint.');
        }

        const payload = await response.json();
        const sourceRows = Array.isArray(payload?.rows) ? payload.rows : [];

        const receiptRows = sourceRows.map((row, idx) => ({
          id: `${row.refNo || 'RCP'}-${row.transactionDate || 'NO-DATE'}-${idx}`,
          memberId: row.memberCode || '',
          receiptNumber: row.refNo || `RCP-${idx + 1}`,
          receiptDate: row.transactionDate || '',
          receiptAmount: row.paymentMade || '0',
        }));

        if (!isMounted) {
          return;
        }

        setRows(receiptRows);
        setFilteredRows(receiptRows);
      } catch {
        if (isMounted) {
          setErrorMessage('Unable to load receipt records.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDeposits();

    return () => {
      isMounted = false;
    };
  }, []);

  const runSearch = () => {
    const searched = rows.filter((row) => {
      const memberMatch = memberId.trim()
        ? row.memberId.toLowerCase().includes(memberId.trim().toLowerCase())
        : true;

      const rowDate = row.receiptDate || '';
      const fromMatch = fromDate ? rowDate >= fromDate : true;
      const toMatch = toDate ? rowDate <= toDate : true;

      return memberMatch && fromMatch && toMatch;
    });

    setFilteredRows(searched);
    setSelectedRows({});
  };

  const allVisibleSelected = useMemo(
    () => filteredRows.length > 0 && filteredRows.every((row) => selectedRows[row.id]),
    [filteredRows, selectedRows],
  );

  const handleToggleAll = (checked) => {
    if (!checked) {
      setSelectedRows({});
      return;
    }

    const next = {};
    filteredRows.forEach((row) => {
      next[row.id] = true;
    });
    setSelectedRows(next);
  };

  const handleToggleRow = (rowId, checked) => {
    setSelectedRows((prev) => ({
      ...prev,
      [rowId]: checked,
    }));
  };

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const handlePrintSelected = () => {
    const selectedData = filteredRows.filter((row) => selectedRows[row.id]);
    if (selectedData.length === 0) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      return;
    }

    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const rowsHtml = selectedData
      .map(
        (row) => `
          <tr class="main-row">
            <td>${escapeHtml(row.receiptNumber)}</td>
            <td>${escapeHtml(row.receiptDate || '-')}</td>
            <td>${escapeHtml(row.receiptAmount)}</td>
          </tr>
        `,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt Reprint</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Inter, Segoe UI, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #102a43;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-shell {
              border: 1px solid #d9e2ec;
              border-radius: 12px;
              overflow: visible;
            }
            .print-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #dbe7f3;
              padding: 14px 18px;
              background: linear-gradient(90deg, #f7fbff 0%, #eef5ff 100%);
            }
            .brand-wrap { display: flex; align-items: center; gap: 12px; }
            .brand-logo {
              width: 56px;
              height: 56px;
              object-fit: cover;
              border-radius: 8px;
              border: 1px solid #dbe7f3;
            }
            .brand-name { font-size: 20px; font-weight: 800; color: #102a43; }
            .report-title { font-size: 18px; font-weight: 800; color: #0f4c81; }
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 18px;
              background: #f8fbff;
              border-bottom: 1px solid #e4edf5;
              font-size: 12px;
              color: #486581;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #d9e2ec;
              padding: 6px 6px;
              text-align: left;
              font-size: 11px;
              line-height: 1.25;
              white-space: normal;
              word-break: break-word;
            }
            th {
              background: #1f4f82;
              color: #ffffff;
              font-weight: 700;
              letter-spacing: 0.2px;
            }
            .main-row td {
              background: #ffffff;
            }
            .main-row:nth-of-type(odd) td {
              background: #fbfdff;
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            @media print {
              body { padding: 0; }
              .report-shell { border: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="report-shell">
            <div class="print-header">
              <div class="brand-wrap">
                <img class="brand-logo" src="${logo}" alt="Company logo" />
                <div class="brand-name">Microfinance Management</div>
              </div>
              <div class="report-title">Receipt Reprint</div>
            </div>
            <div class="meta-row">
              <span>Generated: ${new Date().toLocaleString()}</span>
              <span>Selected Records: ${selectedData.length}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Reciept Number</th>
                  <th>Reciept Date</th>
                  <th>Recipt amount</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Reprint
      </Typography>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Search Receipts
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Member ID"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              sx={{ flex: '1 1 240px', minWidth: 220 }}
            />
            <TextField
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 220px', minWidth: 200 }}
            />
            <TextField
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 220px', minWidth: 200 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="contained" onClick={runSearch}>
                Search
              </Button>
              <Button variant="outlined" onClick={handlePrintSelected} disabled={selectedCount === 0}>
                Print
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {errorMessage && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading receipts...
        </Typography>
      ) : (
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ mb: 2, p: 1.5, display: 'flex', gap: 1, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Checkbox
              checked={allVisibleSelected}
              indeterminate={selectedCount > 0 && !allVisibleSelected}
              onChange={(e) => handleToggleAll(e.target.checked)}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select receipts'}
            </Typography>
          </Box>
          {filteredRows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              No records found.
            </Typography>
          ) : (
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={filteredRows.map((row) => ({
                  ...row,
                  id: row.id || `receipt-${Date.now()}`,
                }))}
                columns={[
                  {
                    field: 'select',
                    headerName: '',
                    flex: 0.05,
                    minWidth: 50,
                    sortable: false,
                    renderCell: (params) => (
                      <Checkbox
                        checked={Boolean(selectedRows[params.row.id])}
                        onChange={(e) => handleToggleRow(params.row.id, e.target.checked)}
                      />
                    ),
                  },
                  { field: 'receiptNumber', headerName: 'Receipt Number', flex: 1, minWidth: 120 },
                  { field: 'receiptDate', headerName: 'Receipt Date', flex: 1, minWidth: 120 },
                  { field: 'receiptAmount', headerName: 'Receipt Amount', flex: 1, minWidth: 120 },
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
        </Paper>
      )}
    </Box>
  );
}
