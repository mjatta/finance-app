import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useBranches } from '../../hooks/useBranches';
import { buildSavingsBalancePrintHtml } from './SavingsBalance/printSetup';

const normalizeBranchName = (branch) => (
  branch?.branchName
  || branch?.br_name
  || branch?.name
  || branch?.branch
  || ''
).toString().trim();

const normalizeBranchId = (branch) => (
  branch?.branchid
  ?? branch?.BranchID
  ?? branch?.branchId
  ?? branch?.id
  ?? ''
).toString().trim();

const normalizeProductLabel = (product) => (
  product?.prd_name
  || product?.productName
  || product?.name
  || product?.label
  || ''
).toString().trim();

export default function SavingsBalance() {
  const { branches, loading: branchesLoading } = useBranches();
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [product, setProduct] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [memberStatus, setMemberStatus] = useState({
    active: false,
    closed: false,
  });
  const [customerType, setCustomerType] = useState({
    individual: false,
    group: false,
    corporate: false,
  });
  const [gender, setGender] = useState({
    male: false,
    female: false,
  });
  const [statusMessage, setStatusMessage] = useState('');

  const branchOptions = useMemo(() => {
    const rows = Array.isArray(branches) ? branches : [];
    const byId = new Map();

    rows.forEach((item) => {
      const id = normalizeBranchId(item);
      const name = normalizeBranchName(item);

      if (!id || !name || byId.has(id)) {
        return;
      }

      byId.set(id, { id, name });
    });

    return Array.from(byId.values());
  }, [branches]);

  useEffect(() => {
    const loadProducts = async () => {
      setProductLoading(true);
      try {
        const response = await fetch('/api/products/types');
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        const rows = result?.status === 'success' && Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];

        const options = rows
          .map((item) => ({
            value: String(item?.prd_id ?? item?.id ?? normalizeProductLabel(item)).trim(),
            label: normalizeProductLabel(item),
          }))
          .filter((item) => item.value && item.label);

        setProductOptions(options);
      } catch {
        setProductOptions([]);
      } finally {
        setProductLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handlePrint = async () => {
    if (!branchId || !date) {
      setStatusMessage('Please select a branch and date before printing.');
      return;
    }

    setStatusMessage('');

    try {
      // Build payload based on selected filters
      const payload = {
        BranchID: Number(branchId),
        ProductType: product ? Number(product) : 0,
        CustType0: customerType.individual ? 1 : 0,
        CustType1: customerType.group ? 2 : 0,
        CustType2: customerType.corporate ? 3 : 0,
        GenderMale: gender.male ? 1 : 0,
        GenderFemale: gender.female ? 2 : 0,
        GenderOther: 3,
        TransactionDate: date,
      };

      const response = await fetch('/api/savingsbalances/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch savings balance data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Open print preview window with the data
      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
        return;
      }

      const reportHtml = buildSavingsBalancePrintHtml(data, date);
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleMemberStatusChange = (event) => {
    const { name, checked } = event.target;
    setMemberStatus((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleCustomerTypeChange = (event) => {
    const { name, checked } = event.target;
    setCustomerType((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleGenderChange = (event) => {
    const { name, checked } = event.target;
    setGender((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Savings Balance
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Generate savings balance reports by branch, product, and member details.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {statusMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          {/* Row 1: Branch and Date */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              size="small"
              fullWidth
              disabled={branchesLoading}
              SelectProps={{ displayEmpty: true, renderValue: (selected) => {
                if (!selected) return 'Select a branch';
                const option = branchOptions.find((item) => item.id === selected);
                return option?.name || 'Select a branch';
              } }}
            >
              <MenuItem value="" disabled>
                Select a branch
              </MenuItem>
              {branchOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Date"
              value={date ? dayjs(date) : null}
              onChange={(value) => setDate(value ? value.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>

          {/* Row 2: Products */}
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              label="Products"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              size="small"
              fullWidth
              disabled={productLoading}
              SelectProps={{ displayEmpty: true, renderValue: (selected) => {
                if (!selected) return 'Select a product';
                const option = productOptions.find((item) => item.value === selected);
                return option?.label || 'Select a product';
              } }}
            >
              <MenuItem value="" disabled>
                Select a product
              </MenuItem>
              {productOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Row 3: Member Status Checkboxes */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Member Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberStatus.active}
                    onChange={handleMemberStatusChange}
                    name="active"
                  />
                }
                label="Active Member"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberStatus.closed}
                    onChange={handleMemberStatusChange}
                    name="closed"
                  />
                }
                label="Closed Members"
              />
            </Box>
          </Box>

          {/* Row 4: Customer Type Checkboxes */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Customer Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customerType.individual}
                    onChange={handleCustomerTypeChange}
                    name="individual"
                  />
                }
                label="Individual"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customerType.group}
                    onChange={handleCustomerTypeChange}
                    name="group"
                  />
                }
                label="Group"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customerType.corporate}
                    onChange={handleCustomerTypeChange}
                    name="corporate"
                  />
                }
                label="Corporate"
              />
            </Box>
          </Box>

          {/* Row 5: Gender Checkboxes */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Gender
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gender.male}
                    onChange={handleGenderChange}
                    name="male"
                  />
                }
                label="Male"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gender.female}
                    onChange={handleGenderChange}
                    name="female"
                  />
                }
                label="Female"
              />
            </Box>
          </Box>

          {/* Print Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={!branchId || !date}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
