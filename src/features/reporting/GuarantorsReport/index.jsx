import React, { useEffect, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useRegions } from '../../../hooks/useRegions';
import useGetGuarantorsReport from './hooks/useGetGuarantorsReport';
import { buildGuarantorsReportHtml } from './printSetup';

const formatAmount = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function GuarantorsReport() {
  const { regions = [] } = useRegions();
  const { fetchGuarantorsReport } = useGetGuarantorsReport();

  // Fetch product types from API
  const [productTypes, setProductTypes] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const response = await fetch('/api/loan-report/products');
        if (!response.ok) {
          setProductTypes([]);
          return;
        }

        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
        
        const products = items
          .map((item) => ({
            value: item?.prd_id ?? item?.id ?? '',
            label: (item?.prd_name || item?.name || '').toString().trim(),
          }))
          .filter((item) => item.value && item.label);
        
        setProductTypes(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductTypes([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const [filters, setFilters] = useState({
    region: '',
    productType: '',
    transactionFromDate: dayjs('1990-01-01'),
    transactionToDate: dayjs(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleDownloadPDF = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters = {
        region: filters.region,
        productType: filters.productType,
        transactionFromDate: filters.transactionFromDate
          ? filters.transactionFromDate.format('YYYY-MM-DD')
          : '',
        transactionToDate: filters.transactionToDate
          ? filters.transactionToDate.format('YYYY-MM-DD')
          : '',
      };

      const result = await fetchGuarantorsReport(searchFilters);

      if (!result.success) {
        setError(result.error || 'Failed to fetch report data');
        return;
      }

      const data = result.data || [];
      if (data.length === 0) {
        setError('No data found for the selected filters');
        return;
      }

      // Extract company information from first record
      const companyInfo = data.length > 0 ? {
        com_name: data[0].com_name || '',
        caddress: data[0].caddress || '',
        tel: data[0].tel || '',
        email: data[0].email || '',
      } : {};

      const html = buildGuarantorsReportHtml(data, searchFilters, companyInfo, regions, productTypes);

      // Open print view in a new window
      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        setError('Unable to open print preview. Please allow pop-ups and try again.');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters = {
        region: filters.region,
        productType: filters.productType,
        transactionFromDate: filters.transactionFromDate
          ? filters.transactionFromDate.format('YYYY-MM-DD')
          : '',
        transactionToDate: filters.transactionToDate
          ? filters.transactionToDate.format('YYYY-MM-DD')
          : '',
      };

      const result = await fetchGuarantorsReport(searchFilters);

      if (!result.success) {
        setError(result.error || 'Failed to fetch report data');
        return;
      }

      const data = result.data || [];
      if (data.length === 0) {
        setError('No data found for the selected filters');
        return;
      }

      const headers = [
        'Guarantor Code',
        'Guarantor Name',
        'Loan Account',
        'Guarantee Amount',
        'Product',
        'Guarantee Date',
        'Company',
      ];

      const rows = data.map((row) => [
        row.grantorcode || '',
        row.gcustname?.trim() || '',
        row.loanacct || '',
        formatAmount(row.guaramt),
        row.prd_name?.trim() || '',
        row.guardate ? row.guardate.split('T')[0] : '',
        row.com_name?.trim() || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${btoa(csvContent)}`;
      link.download = `guarantors-report-${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters = {
        region: filters.region,
        productType: filters.productType,
        transactionFromDate: filters.transactionFromDate
          ? filters.transactionFromDate.format('YYYY-MM-DD')
          : '',
        transactionToDate: filters.transactionToDate
          ? filters.transactionToDate.format('YYYY-MM-DD')
          : '',
      };

      const result = await fetchGuarantorsReport(searchFilters);

      if (!result.success) {
        setError(result.error || 'Failed to fetch report data');
        return;
      }

      const data = result.data || [];
      if (data.length === 0) {
        setError('No data found for the selected filters');
        return;
      }

      const headers = [
        'Guarantor Code',
        'Guarantor Name',
        'Loan Account',
        'Guarantee Amount',
        'Product',
        'Guarantee Date',
        'Company',
      ];

      const rows = data.map((row) => [
        row.grantorcode || '',
        row.gcustname?.trim() || '',
        row.loanacct || '',
        formatAmount(row.guaramt),
        row.prd_name?.trim() || '',
        row.guardate ? row.guardate.split('T')[0] : '',
        row.com_name?.trim() || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      link.download = `guarantors-report-${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Guarantors Report
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Filter and view guarantor information for loans with print and export options.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 1000, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              select
              label="Region"
              name="region"
              value={filters.region}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              disabled={loading}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return 'All Regions';
                  const region = regions.find((r) => (r.coun_id || r.id) == selected);
                  return region ? region.coun_name?.trim() || region.name : selected;
                },
              }}
            >
              <MenuItem value="">All Regions</MenuItem>
              {Array.isArray(regions) &&
                regions.map((region) => (
                  <MenuItem key={region.coun_id || region.id} value={region.coun_id || region.id}>
                    {region.coun_name?.trim() || region.name || region.id}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              select
              label="Product Type"
              name="productType"
              value={filters.productType}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              disabled={loading || productsLoading}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return 'All Products';
                  const product = productTypes.find((p) => p.value === selected);
                  return product ? product.label : selected;
                },
              }}
            >
              <MenuItem value="">All Products</MenuItem>
              {productTypes.map((product) => (
                <MenuItem key={product.value} value={product.value}>
                  {product.label}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Transaction From Date"
              value={filters.transactionFromDate}
              onChange={(value) => handleDateChange('transactionFromDate', value)}
              disabled={loading}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />

            <DatePicker
              label="Transaction To Date"
              value={filters.transactionToDate}
              onChange={(value) => handleDateChange('transactionToDate', value)}
              disabled={loading}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<DownloadRoundedIcon />}
              onClick={handleDownloadPDF}
              disabled={loading}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {loading ? 'Loading...' : 'PDF'}
            </Button>

            <Button
              variant="contained"
              startIcon={<DownloadRoundedIcon />}
              onClick={handleExportExcel}
              disabled={loading}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              Excel
            </Button>

            <Button
              variant="contained"
              startIcon={<DownloadRoundedIcon />}
              onClick={handleExportCSV}
              disabled={loading}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Loading Backdrop */}
      <Backdrop
        open={loading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
