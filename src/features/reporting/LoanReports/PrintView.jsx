import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
} from '@mui/material';

const formatCurrency = (v) => (typeof v === 'number' ? v.toFixed(2) : v || '');

export default function PrintView({ open, onClose, rows = [], format = 'PDF' }) {
  const first = rows && rows.length > 0 ? rows[0] : {};

  const handleDownloadCSV = () => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-report.${format === 'CSV' ? 'csv' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h6">{first.com_name ? first.com_name.trim() : 'Loan Report'}</Typography>
            <Typography variant="body2">{first.caddress || ''}</Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Loan No</TableCell>
              <TableCell>Client Code</TableCell>
              <TableCell>Client Name</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Principal</TableCell>
              <TableCell>Repayment</TableCell>
              <TableCell>Applied</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell>Issued</TableCell>
              <TableCell>Maturity</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Total Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{(r.LOAN_NUMBER || '').toString().trim()}</TableCell>
                <TableCell>{(r.ccustcode || '').toString().trim()}</TableCell>
                <TableCell>{(`${r.ccustfname || ''} ${r.ccustmname || ''} ${r.ccustlname || ''}`).trim()}</TableCell>
                <TableCell>{(r.prd_name || '').toString().trim()}</TableCell>
                <TableCell>{formatCurrency(r.PRINCIPAL_AMT)}</TableCell>
                <TableCell>{formatCurrency(r.REPAYMENT_AMT)}</TableCell>
                <TableCell>{r.loan_appl_date ? new Date(r.loan_appl_date).toLocaleDateString() : ''}</TableCell>
                <TableCell>{r.loan_appr_date ? new Date(r.loan_appr_date).toLocaleDateString() : ''}</TableCell>
                <TableCell>{r.ISSUED_DATE && r.ISSUED_DATE !== '1900-01-01T00:00:00' ? new Date(r.ISSUED_DATE).toLocaleDateString() : ''}</TableCell>
                <TableCell>{r.MATURITY_DATE ? new Date(r.MATURITY_DATE).toLocaleDateString() : ''}</TableCell>
                <TableCell>{(r.br_name || '').toString().trim()}</TableCell>
                <TableCell>{formatCurrency(r.TOTALBALANCE)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDownloadCSV}>Download {format === 'CSV' ? 'CSV' : 'CSV'}</Button>
        <Button onClick={handlePrint}>Print / Save as PDF</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
