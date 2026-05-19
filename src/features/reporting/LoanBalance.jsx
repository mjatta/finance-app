import React, { useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useBranches } from '../../hooks/useBranches';
import useGetLoanBalancePrint from './LoanBalance/hooks/useGetLoanBalancePrint';
import { buildLoanBalancePrintHtml } from './LoanBalance/printSetup';

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

const productOptions = [
  { value: 1, label: 'Development Loan' },
  { value: 2, label: 'Emergency Loan' },
  { value: 3, label: 'Regular Loan' },
  { value: 4, label: 'Consumer Loan' },
  { value: 5, label: 'Building Loan' },
  { value: 6, label: 'Tobaski Loan' },
];

export default function LoanBalance() {
  const { branches, loading: branchesLoading } = useBranches();
  const { fetchLoanBalance, loading: printLoading } = useGetLoanBalancePrint();
  const [branch, setBranch] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productType, setProductType] = useState('');
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
    other: false,
  });
  const [statusMessage, setStatusMessage] = useState('');

  const branchOptions = useMemo(
    () => {
      const rows = Array.isArray(branches) ? branches : [];
      const byId = new Map();

      rows.forEach((item) => {
        const id = normalizeBranchId(item);
        const name = normalizeBranchName(item);

        if (!name || byId.has(id || name)) {
          return;
        }

        byId.set(id || name, { id: id || name, name });
      });

      return Array.from(byId.values());
    },
    [branches],
  );

  const handlePrint = async () => {
    if (!branch || !date || !productType) {
      setStatusMessage('Please select a branch and date before printing.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      setStatusMessage('Unable to open print preview. Please allow pop-ups and try again.');
      return;
    }

    setStatusMessage('');

    const payload = {
      BranchID: Number(branch) || 0,
      ProductType: Number(productType) || 0,
      CustType0: customerType.individual ? '1' : '',
      CustType1: customerType.group ? '2' : '',
      CustType2: customerType.corporate ? '3' : '',
      GenderMale: gender.male ? 1 : '',
      GenderFemale: gender.female ? 2 : '',
      GenderOther: gender.other ? '3' : '',
      TransactionDate: date,
      ByLoanOfficer: '',
    };

    const data = await fetchLoanBalance(payload);

    if (!data) {
      printWindow.close();
      setStatusMessage('Failed to fetch loan balance report. Please try again.');
      return;
    }

    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.data)
          ? data.data
          : [];

    if (rows.length === 0) {
      printWindow.close();
      setStatusMessage('No loan balance data found for the selected filters.');
      return;
    }

    const selectedBranch = branchOptions.find((item) => item.id === branch);
    const selectedProduct = productOptions.find((item) => String(item.value) === String(productType));

    const reportHtml = buildLoanBalancePrintHtml(rows, {
      branchLabel: selectedBranch?.name || '',
      date,
      productLabel: selectedProduct?.label || '',
      memberStatusLabel: [
        memberStatus.active ? 'Active' : '',
        memberStatus.closed ? 'Closed' : '',
      ].filter(Boolean).join(', '),
      customerTypeLabel: [
        customerType.individual ? 'Individual' : '',
        customerType.group ? 'Group' : '',
        customerType.corporate ? 'Corporate' : '',
      ].filter(Boolean).join(', '),
      genderLabel: [
        gender.male ? 'Male' : '',
        gender.female ? 'Female' : '',
        gender.other ? 'Other' : '',
      ].filter(Boolean).join(', '),
    });

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
      <Backdrop
        open={printLoading}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Balance
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Generate loan balance reports by branch, product, and member details.
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
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              fullWidth
              disabled={branchesLoading}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return 'Select a branch';
                  }

                  const option = branchOptions.find((item) => item.id === selected);
                  return option?.name || selected;
                },
              }}
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

            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Row 2: Products */}
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              label="Products"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return 'Select a product';
                  }

                  const option = productOptions.find((item) => String(item.value) === String(selected));
                  return option?.label || selected;
                },
              }}
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gender.other}
                    onChange={handleGenderChange}
                    name="other"
                  />
                }
                label="Other"
              />
            </Box>
          </Box>

          {/* Print Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={!branch || !date || !productType || branchesLoading || printLoading}
              startIcon={printLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              {printLoading ? 'Loading...' : 'Print'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
